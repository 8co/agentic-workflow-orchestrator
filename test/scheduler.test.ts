import { test } from 'node:test';
import assert from 'node:assert';
import { createScheduler, SchedulerConfig, TaskRunResult } from '../src/scheduler.js';
import { QueueTask } from '../src/queue-manager.js';
import { SinonStub, stub } from 'sinon';

// Mocking necessary components
let mockQueueManager: {
  next: SinonStub;
  summary: SinonStub;
  markRunning: SinonStub;
  markCompleted: SinonStub;
  markFailed: SinonStub;
  print: SinonStub;
};

let mockRunner: {
  run: SinonStub;
};

function setupMocks() {
  mockQueueManager = {
    next: stub(),
    summary: stub(),
    markRunning: stub(),
    markCompleted: stub(),
    markFailed: stub(),
    print: stub(),
  };
  
  mockRunner = {
    run: stub(),
  };
  
  // Stub external imports
  stub(import('../src/queue-manager.js'), 'createQueueManager').returns(mockQueueManager);
  stub(import('../src/autonomous-runner.js'), 'createAutonomousRunner').returns(mockRunner);
  stub(import('../src/git-ops.js'), 'commitChanges');
  stub(import('node:fs/promises'), 'writeFile');
  stub(import('node:fs/promises'), 'unlink');
}

// Test Configuration
const config: SchedulerConfig = {
  basePath: '/base/path',
  adapters: {},
  defaultAgent: 'agentType',
  queuePath: '/queue/path',
};

// Test Tasks
const task1: QueueTask = {
  id: 'task-1',
  prompt: 'Task 1 prompt',
  context_files: [],
  variables: {},
};

const task2: QueueTask = {
  id: 'task-2',
  prompt: 'Task 2 prompt',
  context_files: [],
  variables: {},
};

// Tests
setupMocks();

test('Scheduler: Processes single task', async () => {
  const scheduler = createScheduler(config);
  
  mockQueueManager.next.onCall(0).resolves(task1);
  mockQueueManager.next.onCall(1).resolves(null);
  mockRunner.run.resolves({ status: 'completed', branch: 'auto/task-1', steps: [] });

  const result = await scheduler.next();
  
  assert.ok(result);
  assert.strictEqual(result.taskId, 'task-1');
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.branch, 'auto/task-1');
});

test('Scheduler: No pending tasks', async () => {
  const scheduler = createScheduler(config);
  
  mockQueueManager.next.resolves(null);

  const result = await scheduler.next();

  assert.strictEqual(result, null);
});

test('Scheduler: Handle failed tasks', async () => {
  const scheduler = createScheduler(config);

  mockQueueManager.next.onCall(0).resolves(task1);
  mockQueueManager.next.onCall(1).resolves(null);
  mockRunner.run.resolves({ status: 'error', steps: [{ status: 'failed', error: 'Failure reason' }] });

  const result = await scheduler.next();
  
  assert.ok(result);
  assert.strictEqual(result.taskId, 'task-1');
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'Failure reason');
});

test('Scheduler: Process tasks in correct order', async () => {
  const scheduler = createScheduler(config);

  mockQueueManager.next.onCall(0).resolves(task1);
  mockQueueManager.next.onCall(1).resolves(task2);
  mockQueueManager.next.onCall(2).resolves(null);
  mockRunner.run.onFirstCall().resolves({ status: 'completed', branch: 'auto/task-1', steps: [] });
  mockRunner.run.onSecondCall().resolves({ status: 'completed', branch: 'auto/task-2', steps: [] });

  const results = await scheduler.loop();

  assert.strictEqual(results.length, 2);
  assert.strictEqual(results[0].taskId, 'task-1');
  assert.strictEqual(results[1].taskId, 'task-2');
});
