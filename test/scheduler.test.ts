import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { createScheduler, SchedulerConfig } from '../src/scheduler.js';
import { QueueTask } from '../src/queue-manager.js';
import { AgentAdapter, AgentType } from '../src/types.js';

const mockTask: QueueTask = {
  id: 'test-task',
  prompt: 'Test prompt',
  context_files: [],
  variables: {}
};

let taskError: string | undefined;

const mockQueueManager = {
  markRunning: async (taskId: string) => {
    if (taskId === 'error-task') {
      taskError = 'Task execution error';
    }
  },
  markCompleted: async (taskId: string, branch: string) => {
    if (taskError) throw new Error('Cannot complete task that failed');
  },
  markFailed: async (taskId: string, error: string) => {
    taskError = error;
  },
  next: async () => mockTask,
  summary: async () => ({ pending: 1 }),
  print: async () => {},
};

const mockRunner = {
  run: async (workflowPath: string, basePath: string) => {
    if (taskError) {
      return { status: 'failed', steps: [{ status: 'failed', error: taskError }] };
    }
    return { status: 'completed', branch: 'main', steps: [] };
  }
};

const mockConfig: SchedulerConfig = {
  basePath: '.',
  adapters: {} as Record<string, AgentAdapter>,
  defaultAgent: {} as AgentType
};

describe('Scheduler Error Handling', () => {
  let scheduler: ReturnType<typeof createScheduler>;

  before(() => {
    scheduler = createScheduler(mockConfig);
  });

  it('should properly handle task execution failure', async () => {
    const result = await scheduler.next();
    assert(result !== null);
    assert.strictEqual(result.taskId, 'test-task');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Task execution error');
  });

  it('should update queue state on failure', async () => {
    const result = await scheduler.next();
    assert(result !== null);
    assert.strictEqual(result.success, false);
    assert.strictEqual(taskError, 'Task execution error');
  });

  it('logs and continues to next task even if current one fails', async () => {
    taskError = undefined;
    const results = await scheduler.loop();
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].success, false);
    assert.strictEqual(results[0].error, 'Task execution error');
  });
});
