/**
 * Scheduler
 * Loops through the task queue, running each pending task autonomously.
 *
 * Modes:
 *   - next: Run just the next pending task, then stop.
 *   - loop: Run all pending tasks sequentially, then stop.
 *   - watch: Run all pending tasks, then poll for new ones on an interval.
 *
 * Multi-project support:
 *   - Tasks with a `project` field target an external project.
 *   - Git operations run at the target project's path.
 *   - External project branches are NOT auto-merged — left for review.
 *   - Queue state is always committed to the orchestrator repo.
 */

import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createQueueManager, type QueueTask } from './queue-manager.js';
import { createAutonomousRunner, type AutoStep, type AutoWorkflow } from './autonomous-runner.js';
import { runVerification, defaultVerifyCommands, verifyCommandsForProject } from './verify-runner.js';
import type { AgentAdapter, AgentType } from './types.js';
import type { ProjectConfig, ProjectRegistry } from './project-registry.js';
import { getProfile, getLanguageVarsFromProfile } from './project-profiles.js';

/**
 * Run a git command and return stdout.
 */
function gitCmd(args: string[], cwd: string): Promise<{ success: boolean; output: string }> {
  return new Promise((res) => {
    let stdout = '';
    let stderr = '';
    const proc = spawn('git', args, { cwd, shell: false });
    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
    proc.on('close', (code) => res({ success: code === 0, output: (stdout + stderr).trim() }));
    proc.on('error', (e) => res({ success: false, output: e.message }));
  });
}

// --- Types ---

export interface SchedulerConfig {
  basePath: string;
  adapters: Record<string, AgentAdapter>;
  defaultAgent: AgentType;
  queuePath?: string;
  pollIntervalMs?: number; // For watch mode (default: 5 minutes)
  projectConfig?: ProjectConfig; // Single project (backward compat)
  registry?: ProjectRegistry;    // Full registry for multi-project task resolution
}

interface TaskRunResult {
  taskId: string;
  projectId: string;       // Which project was targeted
  success: boolean;
  error?: string;
  durationMs: number;
  branch?: string;
}

// --- Language variable defaults ---

/**
 * Derive language-related template variables from project config.
 * Uses project-profiles for consistent defaults per project type.
 * Falls back to TypeScript defaults if profile not found.
 */
function getLanguageVars(projectConfig?: ProjectConfig): Record<string, string> {
  const projectType = projectConfig?.type ?? 'typescript-node';
  const profile = getProfile(projectType);

  if (profile) {
    return getLanguageVarsFromProfile(profile);
  }

  // Fallback: TypeScript defaults
  return {
    language: 'TypeScript',
    code_lang: 'typescript',
    file_ext: 'ts',
    module_system: 'ES modules (import/export, .js extensions in imports)',
    language_instructions: 'TypeScript strict mode — no `any`, no implicit types.',
  };
}

// --- Scheduler ---

export function createScheduler(config: SchedulerConfig) {
  const {
    basePath,
    adapters,
    defaultAgent,
    queuePath,
    pollIntervalMs = 5 * 60 * 1000,
    registry,
  } = config;

  const queue = createQueueManager(basePath, queuePath);
  const runner = createAutonomousRunner({ adapters, defaultAgent });

  /**
   * Resolve the project config for a task.
   * Falls back to orchestrator defaults when no project is specified.
   */
  function resolveProject(task: QueueTask): { projectConfig: ProjectConfig | undefined; projectId: string } {
    if (task.project && registry) {
      const projectConfig = registry.get(task.project);
      if (projectConfig) {
        return { projectConfig, projectId: task.project };
      }
      console.log(`  ⚠️  Unknown project "${task.project}", falling back to orchestrator`);
    }
    return { projectConfig: config.projectConfig, projectId: 'orchestrator' };
  }

  /**
   * Convert a queue task into an AutoWorkflow the runner can execute.
   * For external projects, sets target_dir to the project's absolute path
   * and injects language-specific template variables.
   */
  function taskToWorkflow(task: QueueTask, projectConfig: ProjectConfig | undefined, projectId: string): { workflow: AutoWorkflow; path: string } {
    const branchName = `auto/${task.id}`;

    // Inject language variables into the task's variables
    const langVars = getLanguageVars(projectConfig);
    const mergedVars: Record<string, string> = {
      ...langVars,
      ...task.variables,  // Task-specific vars override defaults
    };

    const step: AutoStep = {
      id: task.id,
      prompt: task.prompt,
      context_files: task.context_files,
      max_attempts: 3,
      commit_message: `Auto: ${task.id}`,
      variables: mergedVars,
      verify: projectConfig?.verify
        ? verifyCommandsForProject(projectConfig.verify)
        : undefined,
    };

    // For external projects, use their absolute path as target_dir
    // resolve() returns the absolute path unchanged if it's already absolute
    const targetDir = (projectConfig && projectId !== 'orchestrator')
      ? projectConfig.path
      : '.';

    const workflow: AutoWorkflow = {
      name: task.id,
      description: `Queued task: ${task.id}`,
      target_dir: targetDir,
      branch: branchName,
      steps: [step],
      projectId,
    };

    return { workflow, path: '' };
  }

  /**
   * Run a single task from the queue.
   */
  async function runTask(task: QueueTask): Promise<TaskRunResult> {
    const start = Date.now();
    const { projectConfig, projectId } = resolveProject(task);

    const isExternal = projectId !== 'orchestrator';
    const targetPath = (isExternal && projectConfig)
      ? projectConfig.path
      : basePath;

    console.log('\n' + '━'.repeat(50));
    console.log(`📌 Task: ${task.id}`);
    if (isExternal) {
      console.log(`📁 Project: ${projectConfig?.name ?? projectId} (${targetPath})`);
    }
    console.log('━'.repeat(50));

    await queue.markRunning(task.id);

    // Commit queue state in the ORCHESTRATOR repo
    // (so reverts in the target project don't lose queue state)
    const { commitChanges: gitCommit } = await import('./git-ops.js');
    await gitCommit(basePath, `Queue: start ${task.id}`);

    try {
      const { workflow } = taskToWorkflow(task, projectConfig, projectId);

      // Write a temporary workflow file (always in orchestrator)
      const tempWorkflowPath = resolve(basePath, `.tmp-workflow-${task.id}.yaml`);
      const { writeFile: writeFs } = await import('node:fs/promises');
      const { stringify: stringifyYaml } = await import('yaml');
      await writeFs(tempWorkflowPath, stringifyYaml(workflow), 'utf-8');

      // Run the workflow
      // basePath is still the orchestrator root (for prompt template resolution)
      const result = await runner.run(tempWorkflowPath, basePath);

      // Clean up temp file
      const { unlink } = await import('node:fs/promises');
      await unlink(tempWorkflowPath).catch(() => {});

      if (result.status === 'completed') {
        await queue.markCompleted(task.id, result.branch);
        return {
          taskId: task.id,
          projectId,
          success: true,
          durationMs: Date.now() - start,
          branch: result.branch,
        };
      } else {
        const error = result.steps.find((s) => s.status === 'failed')?.error ?? 'Unknown error';
        await queue.markFailed(task.id, error);
        return {
          taskId: task.id,
          projectId,
          success: false,
          error,
          durationMs: Date.now() - start,
        };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await queue.markFailed(task.id, error);
      return {
        taskId: task.id,
        projectId,
        success: false,
        error,
        durationMs: Date.now() - start,
      };
    }
  }

  return {
    /**
     * Run just the next pending task, then stop.
     */
    async next(): Promise<TaskRunResult | null> {
      const task = await queue.next();
      if (!task) {
        console.log('\n✅ No pending tasks in queue.');
        return null;
      }
      return runTask(task);
    },

    /**
     * Run all pending tasks sequentially, then stop.
     */
    async loop(): Promise<TaskRunResult[]> {
      const results: TaskRunResult[] = [];
      const summary = await queue.summary();

      console.log('\n' + '═'.repeat(50));
      console.log('🔄 SCHEDULER — LOOP MODE');
      console.log('═'.repeat(50));
      console.log(`   Pending tasks: ${summary.pending}`);
      console.log('═'.repeat(50));

      let task = await queue.next();
      while (task) {
        const result = await runTask(task);
        results.push(result);

        if (!result.success) {
          console.log(`\n⚠️  Task "${task.id}" failed. Continuing to next task.`);
        }

        task = await queue.next();
      }

      // Post-batch health check (orchestrator only)
      console.log('\n' + '─'.repeat(50));
      console.log('🏥 POST-BATCH HEALTH CHECK');
      console.log('─'.repeat(50));

      const healthCheck = await runVerification(defaultVerifyCommands(), basePath);
      if (healthCheck.allPassed) {
        console.log('   ✅ Codebase is healthy — tsc passed');
      } else {
        console.log('   ⚠️  Codebase has issues after batch:');
        console.log(`   ${healthCheck.errorSummary?.slice(0, 200)}`);
      }

      // Print summary
      console.log('\n' + '═'.repeat(50));
      console.log('📊 BATCH COMPLETE');
      console.log('═'.repeat(50));

      const passed = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      const totalMs = results.reduce((sum, r) => sum + r.durationMs, 0);

      console.log(`   Tasks run: ${results.length}`);
      console.log(`   Passed: ${passed} | Failed: ${failed}`);
      console.log(`   Total time: ${Math.round(totalMs / 1000)}s`);
      console.log(`   Health:    ${healthCheck.allPassed ? '✅ clean' : '⚠️  issues detected'}`);
      console.log('═'.repeat(50));

      // Separate orchestrator branches from external project branches
      const orchestratorBranches = results
        .filter((r) => r.success && r.branch && r.projectId === 'orchestrator')
        .map((r) => r.branch as string);

      const externalBranches = results
        .filter((r) => r.success && r.branch && r.projectId !== 'orchestrator');

      // Merge orchestrator branches into main and push (existing behavior)
      if (orchestratorBranches.length > 0 && healthCheck.allPassed) {
        console.log('\n' + '─'.repeat(50));
        console.log('🔀 MERGE & PUSH (orchestrator)');
        console.log('─'.repeat(50));

        // Stash any uncommitted changes (queue.yaml updates)
        await gitCmd(['stash'], basePath);

        // Switch to main
        const checkoutResult = await gitCmd(['checkout', 'main'], basePath);
        if (checkoutResult.success) {
          // Merge all successful branches at once
          const mergeResult = await gitCmd(['merge', ...orchestratorBranches], basePath);
          if (mergeResult.success) {
            console.log(`   ✅ Merged ${orchestratorBranches.length} branch(es) into main`);

            // Restore stashed queue changes
            await gitCmd(['stash', 'pop'], basePath);

            // Commit queue state
            await gitCmd(['add', '-A'], basePath);
            await gitCmd(['commit', '-m', `Batch complete: ${passed} passed, ${failed} failed`], basePath);

            // Push
            const pushResult = await gitCmd(['push', 'origin', 'main'], basePath);
            if (pushResult.success) {
              console.log('   🚀 Pushed to origin/main');
            } else {
              console.log(`   ⚠️  Push failed: ${pushResult.output.slice(0, 100)}`);
            }
          } else {
            console.log(`   ⚠️  Merge failed: ${mergeResult.output.slice(0, 100)}`);
            // Abort merge and restore
            await gitCmd(['merge', '--abort'], basePath);
            await gitCmd(['stash', 'pop'], basePath);
          }
        } else {
          console.log(`   ⚠️  Could not switch to main: ${checkoutResult.output.slice(0, 100)}`);
          await gitCmd(['stash', 'pop'], basePath);
        }
      } else if (orchestratorBranches.length > 0) {
        console.log('\n   ⚠️  Skipping orchestrator merge — health check failed. Branches remain local.');
      }

      // Report external project branches (no auto-merge)
      if (externalBranches.length > 0) {
        console.log('\n' + '─'.repeat(50));
        console.log('📋 EXTERNAL PROJECT BRANCHES (ready for review)');
        console.log('─'.repeat(50));

        for (const result of externalBranches) {
          const projectName = registry?.get(result.projectId)?.name ?? result.projectId;
          console.log(`   🌿 ${result.branch} → ${projectName}`);
        }

        console.log('\n   These branches are NOT auto-merged. Review and merge manually.');
      }

      await queue.print();

      return results;
    },

    /**
     * Run all pending tasks, then poll for new ones on an interval.
     * Runs until interrupted (Ctrl+C).
     */
    async watch(): Promise<void> {
      console.log('\n' + '═'.repeat(50));
      console.log('👁  SCHEDULER — WATCH MODE');
      console.log(`   Polling every ${Math.round(pollIntervalMs / 1000)}s`);
      console.log('   Press Ctrl+C to stop');
      console.log('═'.repeat(50));

      const runPending = async () => {
        let task = await queue.next();
        while (task) {
          await runTask(task);
          task = await queue.next();
        }
      };

      // Initial run
      await runPending();

      // Poll loop
      const interval = setInterval(async () => {
        const summary = await queue.summary();
        if (summary.pending > 0) {
          console.log(`\n🔔 ${summary.pending} new task(s) found`);
          await runPending();
        } else {
          console.log(`⏳ ${new Date().toISOString()} — no pending tasks, waiting...`);
        }
      }, pollIntervalMs);

      // Graceful shutdown
      process.on('SIGINT', () => {
        clearInterval(interval);
        console.log('\n\n👋 Scheduler stopped.');
        process.exit(0);
      });

      // Keep alive
      await new Promise(() => {});
    },

    /**
     * Print the current queue status.
     */
    async status(): Promise<void> {
      await queue.print();
    },
  };
}
