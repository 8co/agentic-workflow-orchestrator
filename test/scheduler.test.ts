import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createScheduler, SchedulerConfig } from '../src/scheduler.js';
import type { QueueTask, QueueManager } from '../src/queue-manager.js';
import type { AgentAdapter } from '../src/types.js';
import type { AutoWorkflow } from '../src/autonomous-runner.js';

const mockQueueManager = (): QueueManager => {
  let tasks: QueueTask[] = [];
  return {
    next: async () => tasks.shift() || null,
    summary: async () => ({ pending: tasks.length }),
    add: (task: QueueTask) => { tasks.push(task); },
    markRunning: async (taskId: string) => {},
    markCompleted: async (taskId: string, branch: string) => {},
    markFailed: async (taskId: string, error: string) => {},
    print: async () => {}
  };
};

const mockRunner = {
  run: async (workflowPath: string, basePath: string) => {
    const workflow: AutoWorkflow = { name: '', description: '', target_dir: '', branch: '', steps: [] };
    return { status: 'completed', branch: 'test-branch', workflow };
  }
};

const mockGitCmd = async (args: string[], cwd: string): Promise<{ success: boolean; output: string }> => {
  return { success: true, output: '' };
};

test('Scheduler: "next" mode runs a single task', async () => {
  const queueManager = mockQueueManager();
  queueManager.add({ id: 'task1', prompt: 'Prompt 1', context_files: [], variables: [] });

  const scheduler = createScheduler({
    basePath: '',
    adapters: {},
    defaultAgent: 'mockAgentType' as AgentAdapter,
    queuePath: ''
  });

  (scheduler as any).queue = queueManager;
  (scheduler as any).runner = mockRunner;
  (scheduler as any).gitCmd = mockGitCmd;

  const result = await scheduler.next();
  assert.strictEqual(result?.taskId, 'task1');
  assert.strictEqual(result?.success, true);
});

test('Scheduler: "loop" mode executes all tasks in order', async () => {
  const queueManager = mockQueueManager();
  queueManager.add({ id: 'task1', prompt: 'Prompt 1', context_files: [], variables: [] });
  queueManager.add({ id: 'task2', prompt: 'Prompt 2', context_files: [], variables: [] });

  const scheduler = createScheduler({
    basePath: '',
    adapters: {},
    defaultAgent: 'mockAgentType' as AgentAdapter,
    queuePath: ''
  });

  (scheduler as any).queue = queueManager;
  (scheduler as any).runner = mockRunner;
  (scheduler as any).gitCmd = mockGitCmd;

  const results = await scheduler.loop();
  assert.strictEqual(results.length, 2);
  assert.strictEqual(results[0].taskId, 'task1');
  assert.strictEqual(results[1].taskId, 'task2');
});

test('Scheduler: "watch" mode respects pollIntervalMs', async (t) => {
  const queueManager = mockQueueManager();
  queueManager.add({ id: 'task1', prompt: 'Prompt 1', context_files: [], variables: [] });

  const schedulerConfig: SchedulerConfig = {
    basePath: '',
    adapters: {},
    defaultAgent: 'mockAgentType' as AgentAdapter,
    queuePath: '',
    pollIntervalMs: 100 // setting small interval for the test
  };

  const scheduler = createScheduler(schedulerConfig);

  (scheduler as any).queue = queueManager;
  (scheduler as any).runner = mockRunner;
  (scheduler as any).gitCmd = mockGitCmd;
  
  let taskExecuted = false;

  const watchPromise = new Promise<void>((resolve) => {
    (scheduler as any).runPending = async () => {
      taskExecuted = true;
      resolve();
    };
  });

  setTimeout(() => process.emit('SIGINT'), 500); // Stop after 500ms

  await Promise.all([
    scheduler.watch(),
    watchPromise
  ]);

  assert.strictEqual(taskExecuted, true, 'Task should have been executed in watch mode');
});

test('Scheduler: no tasks present should return null in next mode', async () => {
  const queueManager = mockQueueManager();

  const scheduler = createScheduler({
    basePath: '',
    adapters: {},
    defaultAgent: 'mockAgentType' as AgentAdapter,
    queuePath: ''
  });

  (scheduler as any).queue = queueManager;

  const result = await scheduler.next();
  assert.strictEqual(result, null, 'Expected next to return null when no tasks are pending');
});
