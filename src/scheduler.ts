/**
 * Scheduler
 * Loops through the task queue, running each pending task autonomously.
 *
 * Modes:
 *   - next: Run just the next pending task, then stop.
 *   - loop: Run all pending tasks sequentially, then stop.
 *   - watch: Run all pending tasks, then poll for new ones on an interval.
 */

import { resolve } from 'node:path';
import { createQueueManager, type QueueTask } from './queue-manager.js';
import { createAutonomousRunner, type AutoStep, type AutoWorkflow } from './autonomous-runner.js';
import type { AgentAdapter, AgentType } from './types.js';

// --- Types ---

export interface SchedulerConfig {
  basePath: string;
  adapters: Record<string, AgentAdapter>;
  defaultAgent: AgentType;
  queuePath?: string;
  pollIntervalMs?: number; // For watch mode (default: 5 minutes)
}

interface TaskRunResult {
  taskId: string;
  success: boolean;
  error?: string;
  durationMs: number;
}

// --- Scheduler ---

export function createScheduler(config: SchedulerConfig) {
  const {
    basePath,
    adapters,
    defaultAgent,
    queuePath,
    pollIntervalMs = 5 * 60 * 1000,
  } = config;

  const queue = createQueueManager(basePath, queuePath);
  const runner = createAutonomousRunner({ adapters, defaultAgent });

  /**
   * Convert a queue task into an AutoWorkflow the runner can execute.
   */
  function taskToWorkflow(task: QueueTask): { workflow: AutoWorkflow; path: string } {
    const branchName = `auto/${task.id}`;

    const step: AutoStep = {
      id: task.id,
      prompt: task.prompt,
      context_files: task.context_files,
      max_attempts: 3,
      commit_message: `Auto: ${task.id}`,
      variables: task.variables,
    };

    const workflow: AutoWorkflow = {
      name: task.id,
      description: `Queued task: ${task.id}`,
      target_dir: '.',
      branch: branchName,
      steps: [step],
    };

    return { workflow, path: '' };
  }

  /**
   * Run a single task from the queue.
   */
  async function runTask(task: QueueTask): Promise<TaskRunResult> {
    const start = Date.now();

    console.log('\n' + '━'.repeat(50));
    console.log(`📌 Task: ${task.id}`);
    console.log('━'.repeat(50));

    await queue.markRunning(task.id);

    try {
      const { workflow } = taskToWorkflow(task);

      // Write a temporary workflow file for the runner
      const tempWorkflowPath = resolve(basePath, `.tmp-workflow-${task.id}.yaml`);
      const { writeFile: writeFs } = await import('node:fs/promises');
      const { stringify: stringifyYaml } = await import('yaml');
      await writeFs(tempWorkflowPath, stringifyYaml(workflow), 'utf-8');

      const result = await runner.run(tempWorkflowPath, basePath);

      // Clean up temp file
      const { unlink } = await import('node:fs/promises');
      await unlink(tempWorkflowPath).catch(() => {});

      if (result.status === 'completed') {
        await queue.markCompleted(task.id, result.branch);
        return {
          taskId: task.id,
          success: true,
          durationMs: Date.now() - start,
        };
      } else {
        const error = result.steps.find((s) => s.status === 'failed')?.error ?? 'Unknown error';
        await queue.markFailed(task.id, error);
        return {
          taskId: task.id,
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

      // Print summary
      console.log('\n' + '═'.repeat(50));
      console.log('📊 SCHEDULER COMPLETE');
      console.log('═'.repeat(50));

      const passed = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      const totalMs = results.reduce((sum, r) => sum + r.durationMs, 0);

      console.log(`   Tasks run: ${results.length}`);
      console.log(`   Passed: ${passed} | Failed: ${failed}`);
      console.log(`   Total time: ${Math.round(totalMs / 1000)}s`);
      console.log('═'.repeat(50));

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

