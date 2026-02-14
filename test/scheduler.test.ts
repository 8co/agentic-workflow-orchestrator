import { test, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createScheduler, SchedulerConfig } from '../src/scheduler.js';
import { AgentAdapter, AgentType } from '../src/types.js';

type MockQueueTask = {
  id: string;
  prompt: string;
  context_files: string[];
  variables: Record<string, any>;
};

// Mock implementations
const mockQueueManager = {
  next: async () => null as MockQueueTask | null,
  markRunning: async (id: string) => {},
  markCompleted: async (id: string, branch: string) => {},
  markFailed: async (id: string, error: string) => {},
  summary: async () => ({ pending: 0 }),
  print: async () => {},
};

const mockAutonomousRunner = {
  run: async (workflowPath: string, basePath: string) => ({
    status: 'completed',
    branch: 'auto/mock-branch',
    steps: [],
  }),
};

let mockQueue: typeof mockQueueManager;
let mockRunner: typeof mockAutonomousRunner;

const mockCreateQueueManager = () => ({
  ...mockQueueManager,
});

const mockCreateAutonomousRunner = () => ({
  ...mockAutonomousRunner,
});

beforeEach(() => {
  mockQueue = { ...mockQueueManager };
  mockRunner = { ...mockAutonomousRunner };
});

// Replace module dependencies with mocks
jest.mock('../src/queue-manager.js', () => ({
  createQueueManager: mockCreateQueueManager,
}));

jest.mock('../src/autonomous-runner.js', () => ({
  createAutonomousRunner: mockCreateAutonomousRunner,
}));

jest.mock('../src/git-ops.js', () => ({
  commitChanges: async (basePath: string, message: string) => {},
}));

jest.mock('../src/verify-runner.js', () => ({
  runVerification: async (cmds: string[], basePath: string) => ({
    allPassed: true,
  }),
  defaultVerifyCommands: () => [],
}));

const config: SchedulerConfig = {
  basePath: '/mock/path',
  adapters: {} as Record<string, AgentAdapter>,
  defaultAgent: {} as AgentType,
};

test('createScheduler.next() should return null if no task is available', async () => {
  const scheduler = createScheduler(config);
  const result = await scheduler.next();
  assert.strictEqual(result, null);
});

test('createScheduler.loop() should return empty array if no tasks are pending', async () => {
  const scheduler = createScheduler(config);
  const result = await scheduler.loop();
  assert.deepStrictEqual(result, []);
});

test('createScheduler.watch() should run without throwing errors', async () => {
  const scheduler = createScheduler(config);

  // Run watch and immediately stop it
  const watchPromise = scheduler.watch();
  setTimeout(() => {
    process.emit('SIGINT', 'SIGINT');
  }, 1000);

  await assert.doesNotReject(watchPromise);
});

test('createScheduler.status() should print queue status without error', async () => {
  const scheduler = createScheduler(config);
  await assert.doesNotThrow(() => scheduler.status());
});
