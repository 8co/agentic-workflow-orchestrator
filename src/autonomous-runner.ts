/**
 * Autonomous Runner
 * The closed loop: LLM generates code → files written → build/test → git commit
 * If verification fails, errors are fed back to the LLM for a retry.
 *
 * This is the key component that "closes the loop" — turning LLM output
 * into actual codebase changes with automated verification.
 */

import { v4 as uuidv4 } from 'uuid';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type {
  AgentAdapter,
  AgentRequest,
  AgentType,
} from './types.js';
import { parseCodeBlocks, writeFiles, buildFileContext } from './file-writer.js';
import {
  runVerification,
  defaultVerifyCommands,
  type VerifyCommand,
  type VerificationSummary,
} from './verify-runner.js';
import {
  commitChanges,
  revertChanges,
  hasChanges,
  getChangedFiles,
  getCurrentBranch,
  createBranch,
} from './git-ops.js';

// --- Types ---

export interface AutoStep {
  id: string;
  prompt: string;           // Path to prompt template
  agent?: AgentType;        // Override agent for this step
  context_files?: string[]; // Project files to include as context
  verify?: VerifyCommand[]; // Custom verification commands (defaults to tsc)
  max_attempts?: number;    // Max LLM attempts including error feedback (default 3)
  commit_message?: string;  // Custom commit message template
}

export interface AutoWorkflow {
  name: string;
  description?: string;
  target_dir: string;       // The project directory to modify
  branch?: string;          // Create a feature branch (optional)
  variables?: Record<string, string>;
  steps: AutoStep[];
  verify?: VerifyCommand[]; // Default verification for all steps
}

export interface AutoStepResult {
  stepId: string;
  status: 'completed' | 'failed';
  attempts: number;
  filesWritten: string[];
  verificationPassed: boolean;
  committed: boolean;
  commitMessage?: string;
  error?: string;
  durationMs: number;
}

export interface AutoExecutionResult {
  executionId: string;
  workflowName: string;
  status: 'completed' | 'failed';
  steps: AutoStepResult[];
  startedAt: string;
  completedAt: string;
  branch?: string;
}

// --- Runner ---

interface AutoRunnerDeps {
  adapters: Record<string, AgentAdapter>;
  defaultAgent: AgentType;
}

export function createAutonomousRunner(deps: AutoRunnerDeps) {
  const { adapters, defaultAgent } = deps;

  /**
   * Load and parse an autonomous workflow YAML.
   */
  async function loadWorkflow(workflowPath: string, basePath: string): Promise<AutoWorkflow> {
    const fullPath = resolve(basePath, workflowPath);
    const raw = await readFile(fullPath, 'utf-8');
    return parseYaml(raw) as AutoWorkflow;
  }

  /**
   * Resolve variables in a prompt template.
   */
  function resolveVars(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\s*[\w.]+\s*)\}\}/g, (_match, key: string) => {
      const trimmed = key.trim();
      return vars[trimmed] ?? `{{${trimmed}}}`;
    });
  }

  /**
   * Load a prompt template and resolve variables.
   */
  async function loadPrompt(
    promptPath: string,
    basePath: string,
    vars: Record<string, string>
  ): Promise<string> {
    const fullPath = resolve(basePath, promptPath);
    const template = await readFile(fullPath, 'utf-8');
    return resolveVars(template, vars);
  }

  /**
   * Execute a single autonomous step with error feedback loop.
   */
  async function executeStep(
    step: AutoStep,
    workflow: AutoWorkflow,
    basePath: string,
    prevOutputs: Record<string, string>
  ): Promise<AutoStepResult> {
    const start = Date.now();
    const maxAttempts = step.max_attempts ?? 3;
    const agentName = step.agent ?? defaultAgent;
    const adapter = adapters[agentName];
    const targetDir = resolve(basePath, workflow.target_dir);
    const verifyCommands = step.verify ?? workflow.verify ?? defaultVerifyCommands();

    if (!adapter) {
      return {
        stepId: step.id,
        status: 'failed',
        attempts: 0,
        filesWritten: [],
        verificationPassed: false,
        committed: false,
        error: `No adapter for agent: ${agentName}`,
        durationMs: Date.now() - start,
      };
    }

    // Build variables including previous step outputs
    const vars: Record<string, string> = { ...workflow.variables };
    for (const [id, output] of Object.entries(prevOutputs)) {
      vars[`steps.${id}.output`] = output;
    }

    // Load base prompt
    let basePrompt = await loadPrompt(step.prompt, basePath, vars);

    // Add file context if specified
    if (step.context_files && step.context_files.length > 0) {
      const context = await buildFileContext(step.context_files, targetDir);
      if (context) {
        basePrompt += `\n\n## Current File Contents\n\n${context}`;
      }
    }

    let lastError: string | undefined;
    let filesWritten: string[] = [];
    let lastLlmOutput = '';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`\n  🤖 Attempt ${attempt}/${maxAttempts} (agent: ${agentName})`);

      // Build the prompt — include error feedback on retry
      let prompt = basePrompt;
      if (attempt > 1 && lastError) {
        prompt += `\n\n## ⚠️ Previous Attempt Failed\n\nYour previous code had errors. Fix ALL of them:\n\n${lastError}`;
        console.log(`  📋 Feeding ${lastError.split('\n').length} lines of error context`);
      }

      // Call the LLM
      const request: AgentRequest = {
        prompt,
        context: step.context_files
          ? await buildFileContext(step.context_files, targetDir)
          : undefined,
      };

      const response = await adapter.execute(request);

      if (!response.success || !response.output) {
        lastError = response.error ?? 'LLM returned no output';
        console.log(`  ❌ LLM call failed: ${lastError}`);
        continue;
      }

      lastLlmOutput = response.output;

      // Parse code blocks from LLM output
      const changes = parseCodeBlocks(response.output);

      if (changes.length === 0) {
        console.log(`  ⚠️  No code blocks found in LLM output`);
        // If the LLM gave instructions but no code blocks, that might be the output
        // Store it and continue (don't count as error)
        lastError = 'No code blocks with file paths found in output. Wrap code in ```language:path/to/file.ts blocks.';
        continue;
      }

      console.log(`  📦 Found ${changes.length} file(s) to write`);

      // Write files to the target project
      const writeResult = await writeFiles(changes, targetDir);
      filesWritten = writeResult.filesWritten.map((f) => f.filePath);

      if (writeResult.errors.length > 0) {
        console.log(`  ⚠️  Write errors: ${writeResult.errors.join(', ')}`);
      }

      // Run verification
      console.log(`\n  🔍 Verifying...`);
      const verification = await runVerification(verifyCommands, targetDir);

      if (verification.allPassed) {
        console.log(`  ✅ Verification passed`);

        // Commit the changes
        const commitMsg = step.commit_message
          ? resolveVars(step.commit_message, { ...vars, step_id: step.id })
          : `Auto: ${step.id} — ${workflow.name}`;

        const commitResult = await commitChanges(targetDir, commitMsg);

        return {
          stepId: step.id,
          status: 'completed',
          attempts: attempt,
          filesWritten,
          verificationPassed: true,
          committed: commitResult.success,
          commitMessage: commitMsg,
          durationMs: Date.now() - start,
        };
      }

      // Verification failed — prepare error feedback for next attempt
      lastError = verification.errorSummary;
      console.log(`  ❌ Verification failed — will retry with error feedback`);

      // Revert the bad changes so next attempt starts clean
      if (await hasChanges(targetDir)) {
        await revertChanges(targetDir);
        console.log(`  ⏪ Reverted changes from failed attempt`);
      }
    }

    // All attempts exhausted
    return {
      stepId: step.id,
      status: 'failed',
      attempts: maxAttempts,
      filesWritten,
      verificationPassed: false,
      committed: false,
      error: lastError ?? 'Max attempts reached',
      durationMs: Date.now() - start,
    };
  }

  return {
    /**
     * Run an autonomous workflow end-to-end.
     */
    async run(
      workflowPath: string,
      basePath: string,
      overrides?: Record<string, string>
    ): Promise<AutoExecutionResult> {
      const workflow = await loadWorkflow(workflowPath, basePath);

      if (overrides) {
        workflow.variables = { ...workflow.variables, ...overrides };
      }

      const executionId = uuidv4();
      const startedAt = new Date().toISOString();
      const targetDir = resolve(basePath, workflow.target_dir);

      console.log('\n' + '═'.repeat(50));
      console.log('🔁 AUTONOMOUS MODE');
      console.log('═'.repeat(50));
      console.log(`  Workflow:  ${workflow.name}`);
      console.log(`  Execution: ${executionId.slice(0, 8)}`);
      console.log(`  Target:    ${targetDir}`);
      console.log(`  Steps:     ${workflow.steps.map((s) => s.id).join(' → ')}`);

      // Create feature branch if specified
      let branch: string | undefined;
      if (workflow.branch) {
        const branchName = resolveVars(workflow.branch, workflow.variables ?? {});
        const branchResult = await createBranch(targetDir, branchName);
        if (branchResult.success) {
          branch = branchName;
          console.log(`  Branch:    ${branch}`);
        } else {
          console.log(`  ⚠️  Branch creation failed: ${branchResult.error}`);
          // Continue on the current branch
          const currentBranch = await getCurrentBranch(targetDir);
          console.log(`  Branch:    ${currentBranch} (existing)`);
        }
      }

      console.log('═'.repeat(50) + '\n');

      const stepResults: AutoStepResult[] = [];
      const prevOutputs: Record<string, string> = {};

      for (const step of workflow.steps) {
        console.log(`\n${'─'.repeat(50)}`);
        console.log(`▶ Step: ${step.id}`);
        console.log('─'.repeat(50));

        const result = await executeStep(step, workflow, basePath, prevOutputs);
        stepResults.push(result);

        if (result.status === 'completed') {
          console.log(`\n  ✅ Step "${step.id}" completed in ${result.attempts} attempt(s)`);
          console.log(`     Files: ${result.filesWritten.join(', ')}`);
          if (result.committed) {
            console.log(`     Commit: ${result.commitMessage}`);
          }

          // Store output for next step (the files written)
          prevOutputs[step.id] = result.filesWritten
            .map((f) => `- ${f}`)
            .join('\n');
        } else {
          console.log(`\n  ❌ Step "${step.id}" failed after ${result.attempts} attempt(s)`);
          console.log(`     Error: ${result.error}`);

          // Stop on failure
          break;
        }
      }

      const completedAt = new Date().toISOString();
      const allPassed = stepResults.every((r) => r.status === 'completed');

      console.log('\n' + '═'.repeat(50));
      console.log(allPassed ? '✅ WORKFLOW COMPLETED' : '❌ WORKFLOW FAILED');
      console.log('═'.repeat(50));
      console.log(`  Duration: ${Date.parse(completedAt) - Date.parse(startedAt)}ms`);
      console.log(`  Steps: ${stepResults.filter((r) => r.status === 'completed').length}/${stepResults.length} passed`);
      if (branch) {
        console.log(`  Branch: ${branch}`);
      }
      console.log('═'.repeat(50) + '\n');

      return {
        executionId,
        workflowName: workflow.name,
        status: allPassed ? 'completed' : 'failed',
        steps: stepResults,
        startedAt,
        completedAt,
        branch,
      };
    },
  };
}

