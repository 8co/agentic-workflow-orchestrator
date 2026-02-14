import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createScheduler, TaskRunResult } from '../src/scheduler.js';
import { type SchedulerConfig } from '../src/scheduler.js';
import type { QueueTask } from '../src/queue-manager.js';

function mockQueueManager() {
  const tasks: QueueTask[] = [
    { id: 'task1', prompt: '', context_files: [], variables: {} },
    { id: 'task2', prompt: '', context_files: [], variables: {} },
  ];
  let nextIndex = 0;

  return {
    next: async () => {
      if (nextIndex < tasks.length) {
        return tasks[nextIndex++];
      }
      return null;
    },
    markRunning: async (taskId: string) => {},
    markCompleted: async (taskId: string, branch?: string) => {},
    markFailed: async (taskId: string, error: string) => {},
    print: async () => {},
    summary: async () => ({ pending: tasks.length - nextIndex }),
  };
}

function mockAutonomousRunner(result: any) {
  return {
    run: async (workflowPath: string, basePath: string) => result,
  };
}

test('Scheduler next mode with successful task', async () => {
  const queue = mockQueueManager();
  const runner = mockAutonomousRunner({ status: 'completed', branch: 'feature-branch' });

  const config: SchedulerConfig = {
    basePath: '/path/to/base',
    adapters: {},
    defaultAgent: 'agent-type',
  };

  const scheduler = createScheduler(config);

  const taskResult = await scheduler.next();

  assert(taskResult !== null);
  assert.equal(taskResult?.taskId, 'task1');
  assert.equal(taskResult?.success, true);
});

test('Scheduler next mode with failed task', async () => {
  const queue = mockQueueManager();
  const runner = mockAutonomousRunner({ status: 'failed', steps: [{ status: 'failed', error: 'Step error' }] });

  const config: SchedulerConfig = {
    basePath: '/path/to/base',
    adapters: {},
    defaultAgent: 'agent-type',
  };

  const scheduler = createScheduler(config);

  const taskResult = await scheduler.next();

  assert(taskResult !== null);
  assert.equal(taskResult?.taskId, 'task1');
  assert.equal(taskResult?.success, false);
  assert.equal(taskResult?.error, 'Step error');
});

test('Scheduler loop mode handles multiple tasks with one failure', async () => {
  const queue = mockQueueManager();
  const runner = mockAutonomousRunner({ status: 'completed', branch: 'feature-branch' });

  runner.run = async (workflowPath: string, basePath: string) => {
    return workflowPath.includes('task2') ? { status: 'failed', steps: [{ status: 'failed', error: 'Step error' }] } : { status: 'completed', branch: 'feature-branch' };
  };

  const config: SchedulerConfig = {
    basePath: '/path/to/base',
    adapters: {},
    defaultAgent: 'agent-type',
  };

  const scheduler = createScheduler(config);

  const results = await scheduler.loop();

  assert.equal(results.length, 2);
  assert.equal(results[0].taskId, 'task1');
  assert.equal(results[0].success, true);
  assert.equal(results[1].taskId, 'task2');
  assert.equal(results[1].success, false);
  assert.equal(results[1].error, 'Step error');
});

test('Scheduler watch mode continues running until interrupted', async () => {
  const queue = mockQueueManager();
  const runner = mockAutonomousRunner({ status: 'completed', branch: 'feature-branch' });

  const config: SchedulerConfig = {
    basePath: '/path/to/base',
    adapters: {},
    defaultAgent: 'agent-type',
  };

  const scheduler = createScheduler(config);

  const originalSetTimeout = setTimeout;
  let timeoutCalled = false;

  // Mock setTimeout to simulate immediate timeout for the test
  global.setTimeout = (callback, ms) => {
    timeoutCalled = true;
    callback();
    return originalSetTimeout(() => {}, ms);
  };

  await scheduler.watch();

  global.setTimeout = originalSetTimeout;

  assert(timeoutCalled, 'setTimeout should be called to simulate interval behavior');
});
