/**
 * Task Proposer
 * Feeds the codebase to an LLM and asks it to propose the next development tasks.
 * Parses the YAML response and appends new tasks to the queue.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, relative, extname } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { AgentAdapter, AgentRequest } from './types.js';
import { createQueueManager, type QueueTask } from './queue-manager.js';
import type { ProjectConfig } from './project-registry.js';

// --- Types ---

export interface ProposerConfig {
  basePath: string;
  adapter: AgentAdapter;
  promptPath?: string;
  reviewPromptPath?: string;
  maxTasks?: number;
  maxFileSize?: number;    // Skip files larger than this (bytes)
  includeGlobs?: string[]; // Only include these directories
  skipReview?: boolean;     // Skip the self-review step (default: false)
  projectConfig?: ProjectConfig; // Multi-project support
  orchestratorRoot?: string;     // Path to orchestrator (for prompts)
}

interface ProposedTask {
  id: string;
  prompt: string;
  context_files?: string[];
  variables?: Record<string, string>;
}

// --- Helpers ---

const SCAN_DIRS = ['src'];
const SKIP_EXTENSIONS = new Set(['.test.ts', '.spec.ts']);
const MAX_FILE_SIZE = 50_000; // 50KB

/**
 * Recursively scan a directory for TypeScript source files.
 */
async function scanSourceFiles(
  dir: string,
  basePath: string,
  maxSize: number
): Promise<{ path: string; content: string }[]> {
  const files: { path: string; content: string }[] = [];

  async function walk(currentDir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules, dist, .state, etc.
        if (['node_modules', 'dist', '.state', '.git', 'output'].includes(entry.name)) {
          continue;
        }
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        // Skip test files
        if (SKIP_EXTENSIONS.has(extname(entry.name)) || entry.name.includes('.test.')) {
          continue;
        }

        try {
          const stats = await stat(fullPath);
          if (stats.size > maxSize) continue;

          const content = await readFile(fullPath, 'utf-8');
          const relPath = relative(basePath, fullPath);
          files.push({ path: relPath, content });
        } catch {
          // Skip unreadable files
        }
      }
    }
  }

  await walk(dir);
  return files;
}

/**
 * Build a codebase summary for the LLM.
 */
async function buildCodebaseSummary(basePath: string, maxSize: number): Promise<string> {
  const sections: string[] = [];

  // Scan source directories
  for (const dir of SCAN_DIRS) {
    const dirPath = resolve(basePath, dir);
    const files = await scanSourceFiles(dirPath, basePath, maxSize);

    for (const file of files) {
      sections.push(`--- ${file.path} ---\n${file.content}`);
    }
  }

  // Include package.json for dependency awareness
  try {
    const pkg = await readFile(resolve(basePath, 'package.json'), 'utf-8');
    sections.push(`--- package.json ---\n${pkg}`);
  } catch {
    // Skip if not found
  }

  return sections.join('\n\n');
}

/**
 * Parse the LLM's YAML response into task objects.
 */
function parseProposedTasks(llmOutput: string): ProposedTask[] {
  // Extract YAML block — handle both ```yaml:tasks and ```yaml formats
  const yamlMatch = llmOutput.match(/```(?:yaml:tasks|yaml)\n([\s\S]*?)```/);
  if (!yamlMatch) {
    // Try parsing the entire output as YAML
    try {
      const parsed = parseYaml(llmOutput);
      if (Array.isArray(parsed)) return parsed as ProposedTask[];
    } catch {
      // Fall through
    }
    return [];
  }

  try {
    const parsed = parseYaml(yamlMatch[1]);
    if (Array.isArray(parsed)) return parsed as ProposedTask[];
    return [];
  } catch {
    return [];
  }
}

// --- Proposer ---

export function createTaskProposer(config: ProposerConfig) {
  const {
    basePath,
    adapter,
    promptPath = 'prompts/auto-propose-tasks.md',
    reviewPromptPath = 'prompts/auto-review-tasks.md',
    maxTasks = 5,
    maxFileSize = MAX_FILE_SIZE,
    skipReview = false,
  } = config;

  const queue = createQueueManager(basePath);

  /**
   * Self-review: Feed proposed tasks back to the LLM to filter out
   * bad ideas before they hit the queue.
   */
  async function reviewTasks(tasks: ProposedTask[]): Promise<ProposedTask[]> {
    if (tasks.length === 0 || skipReview) return tasks;

    console.log('\n🧠 Self-review: LLM auditing its own proposals...\n');

    // Load review prompt
    const templatePath = resolve(basePath, reviewPromptPath);
    let template: string;
    try {
      template = await readFile(templatePath, 'utf-8');
    } catch {
      console.log('   ⚠️  Review prompt not found, skipping review');
      return tasks;
    }

    // Format proposed tasks as YAML for the reviewer
    const { stringify: stringifyYaml } = await import('yaml');
    const tasksYaml = stringifyYaml(tasks, { lineWidth: 120 });

    const prompt = template
      .replace(/\{\{\s*project_name\s*\}\}/g, 'agentic-workflow-orchestrator')
      .replace(/\{\{\s*proposed_tasks\s*\}\}/g, tasksYaml);

    const request: AgentRequest = { prompt };
    const response = await adapter.execute(request);

    if (!response.success || !response.output) {
      console.log('   ⚠️  Review call failed, proceeding with unfiltered tasks');
      return tasks;
    }

    const reviewed = parseProposedTasks(response.output);

    const kept = reviewed.length;
    const dropped = tasks.length - kept;

    if (dropped > 0) {
      console.log(`   🔍 Review result: kept ${kept}, dropped ${dropped}`);
      const droppedIds = tasks
        .filter((t) => !reviewed.some((r) => r.id === t.id))
        .map((t) => t.id);
      for (const id of droppedIds) {
        console.log(`   ❌ Dropped: ${id}`);
      }
    } else {
      console.log(`   ✅ Review result: all ${kept} tasks approved`);
    }

    return reviewed;
  }

  return {
    /**
     * Analyze the codebase and propose new tasks.
     * Returns the proposed tasks without adding them to the queue.
     */
    async propose(): Promise<ProposedTask[]> {
      console.log('\n🔍 Scanning codebase...');
      const codebaseSummary = await buildCodebaseSummary(basePath, maxFileSize);
      const lineCount = codebaseSummary.split('\n').length;
      console.log(`   Found ${lineCount} lines of source code`);

      // Load prompt template
      const templatePath = resolve(basePath, promptPath);
      let template: string;
      try {
        template = await readFile(templatePath, 'utf-8');
      } catch {
        throw new Error(`Propose prompt not found: ${templatePath}`);
      }

      // Get existing task IDs to avoid duplicates
      const existingTasks = await queue.list();
      const existingIds = new Set(existingTasks.map((t) => t.id));

      // Inject variables
      const prompt = template
        .replace(/\{\{\s*project_name\s*\}\}/g, 'agentic-workflow-orchestrator')
        .replace(/\{\{\s*project_description\s*\}\}/g, 'Autonomous AI agent system for continuous development')
        .replace(/\{\{\s*max_tasks\s*\}\}/g, String(maxTasks));

      // Build the full prompt with codebase context
      const fullPrompt = `${prompt}\n\n## Current Codebase\n\n${codebaseSummary}\n\n## Existing Tasks (do NOT duplicate these)\n\n${existingTasks.map((t) => `- ${t.id} (${t.status})`).join('\n') || 'None'}`;

      console.log('🤖 Asking LLM to propose tasks...\n');

      const request: AgentRequest = {
        prompt: fullPrompt,
      };

      const response = await adapter.execute(request);

      if (!response.success || !response.output) {
        throw new Error(`LLM call failed: ${response.error ?? 'no output'}`);
      }

      // Parse tasks from response
      const proposed = parseProposedTasks(response.output);

      // Filter out duplicates
      const newTasks = proposed.filter((t) => !existingIds.has(t.id));

      console.log(`\n📋 Proposed ${proposed.length} tasks, ${newTasks.length} are new`);

      // Self-review: LLM audits its own proposals
      const reviewed = await reviewTasks(newTasks);

      return reviewed;
    },

    /**
     * Propose tasks and add them to the queue.
     * Returns the tasks that were added.
     */
    async proposeAndQueue(): Promise<QueueTask[]> {
      const proposed = await this.propose();

      if (proposed.length === 0) {
        console.log('   No new tasks to add.');
        return [];
      }

      // Convert to QueueTasks and append
      const queueTasks: QueueTask[] = proposed.map((t) => ({
        id: t.id,
        status: 'pending' as const,
        workflow: 'auto',
        prompt: t.prompt,
        context_files: t.context_files,
        variables: t.variables,
      }));

      // Load existing queue, append new tasks, save
      const existing = await queue.list();
      const allTasks = [...existing, ...queueTasks];

      // Write updated queue using the yaml module
      const { writeFile: writeFs } = await import('node:fs/promises');
      const { stringify: stringifyYaml } = await import('yaml');
      const queuePath = resolve(basePath, 'tasks/queue.yaml');
      await writeFs(queuePath, stringifyYaml({ tasks: allTasks }, { lineWidth: 120 }), 'utf-8');

      console.log(`\n✅ Added ${queueTasks.length} tasks to queue:`);
      for (const t of queueTasks) {
        console.log(`   ⏳ ${t.id}`);
      }

      return queueTasks;
    },

    /**
     * Preview proposed tasks without adding to queue (dry run).
     */
    async preview(): Promise<void> {
      const proposed = await this.propose();

      if (proposed.length === 0) {
        console.log('\n   LLM found nothing to propose.');
        return;
      }

      console.log('\n📋 Proposed Tasks (preview — not queued):\n');
      for (const task of proposed) {
        console.log(`  ⏳ ${task.id}`);
        console.log(`     Prompt: ${task.prompt}`);
        if (task.context_files) {
          console.log(`     Context: ${task.context_files.join(', ')}`);
        }
        if (task.variables) {
          const desc = task.variables['module_description'] ??
            task.variables['modification_description'] ??
            task.variables['test_description'] ?? '';
          if (desc) {
            console.log(`     Description: ${desc.slice(0, 100).trim()}...`);
          }
        }
        console.log('');
      }
    },
  };
}

