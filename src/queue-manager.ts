/**
 * Queue Manager
 * Reads and writes the task queue file (tasks/queue.yaml).
 * Picks the next pending task, updates status after execution.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

// --- Types ---

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface QueueTask {
  id: string;
  status: TaskStatus;
  workflow: string;
  prompt: string;
  project?: string;            // Project ID from registry (undefined = orchestrator)
  context_files?: string[];
  variables?: Record<string, string>;
  error?: string;
  started_at?: string;
  completed_at?: string;
  branch?: string;
}

interface QueueFile {
  tasks: QueueTask[];
}

// --- Manager ---

export function createQueueManager(basePath: string, queuePath = 'tasks/queue.yaml') {
  const fullPath = resolve(basePath, queuePath);

  async function load(): Promise<QueueFile> {
    const raw = await readFile(fullPath, 'utf-8');
    return parseYaml(raw) as QueueFile;
  }

  async function save(queue: QueueFile): Promise<void> {
    const yaml = stringifyYaml(queue, {
      lineWidth: 120,
      defaultKeyType: 'PLAIN',
      defaultStringType: 'PLAIN',
    });
    await writeFile(fullPath, yaml, 'utf-8');
  }

  return {
    /**
     * Get all tasks in the queue.
     */
    async list(): Promise<QueueTask[]> {
      const queue = await load();
      return queue.tasks;
    },

    /**
     * Get the next pending task (first one in order).
     */
    async next(): Promise<QueueTask | null> {
      const queue = await load();
      return queue.tasks.find((t) => t.status === 'pending') ?? null;
    },

    /**
     * Get a task count summary.
     */
    async summary(): Promise<Record<TaskStatus, number>> {
      const queue = await load();
      const counts: Record<TaskStatus, number> = {
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
        skipped: 0,
      };
      for (const task of queue.tasks) {
        counts[task.status]++;
      }
      return counts;
    },

    /**
     * Mark a task as running.
     */
    async markRunning(taskId: string): Promise<void> {
      const queue = await load();
      const task = queue.tasks.find((t) => t.id === taskId);
      if (!task) throw new Error(`Task not found: ${taskId}`);

      task.status = 'running';
      task.started_at = new Date().toISOString();
      await save(queue);
    },

    /**
     * Mark a task as completed.
     */
    async markCompleted(taskId: string, branch?: string): Promise<void> {
      const queue = await load();
      const task = queue.tasks.find((t) => t.id === taskId);
      if (!task) throw new Error(`Task not found: ${taskId}`);

      task.status = 'completed';
      task.completed_at = new Date().toISOString();
      if (branch) task.branch = branch;
      task.error = undefined;
      await save(queue);
    },

    /**
     * Mark a task as failed with an error message.
     */
    async markFailed(taskId: string, error: string): Promise<void> {
      const queue = await load();
      const task = queue.tasks.find((t) => t.id === taskId);
      if (!task) throw new Error(`Task not found: ${taskId}`);

      task.status = 'failed';
      task.completed_at = new Date().toISOString();
      task.error = error;
      await save(queue);
    },

    /**
     * Reset a failed task back to pending (for retry).
     */
    async resetTask(taskId: string): Promise<void> {
      const queue = await load();
      const task = queue.tasks.find((t) => t.id === taskId);
      if (!task) throw new Error(`Task not found: ${taskId}`);

      task.status = 'pending';
      task.error = undefined;
      task.started_at = undefined;
      task.completed_at = undefined;
      await save(queue);
    },

    /**
     * Print a formatted summary of the queue.
     */
    async print(): Promise<void> {
      const queue = await load();
      const counts = await this.summary();

      console.log('\n📋 Task Queue\n');
      console.log(`   Pending: ${counts.pending} | Completed: ${counts.completed} | Failed: ${counts.failed}\n`);

      for (const task of queue.tasks) {
        const icon =
          task.status === 'completed' ? '✅' :
          task.status === 'failed' ? '❌' :
          task.status === 'running' ? '▶' :
          task.status === 'skipped' ? '⏭' : '⏳';

        console.log(`  ${icon} ${task.id} (${task.status})`);
        if (task.error) {
          console.log(`     Error: ${task.error.slice(0, 100)}`);
        }
        if (task.branch) {
          console.log(`     Branch: ${task.branch}`);
        }
      }
      console.log('');
    },
  };
}

