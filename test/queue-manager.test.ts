import { test } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { createQueueManager, QueueTask } from '../src/queue-manager.js';
import { stringify as stringifyYaml } from 'yaml';

const testBasePath = './test-data';
const testQueuePath = 'queue.yaml';
const fullPath = resolve(testBasePath, testQueuePath);

async function setupTestFile(tasks: QueueTask[]) {
  const yamlContent = stringifyYaml({ tasks }, { lineWidth: 120 });
  await fs.writeFile(fullPath, yamlContent, 'utf-8');
}

async function cleanupTestFile() {
  await fs.rm(fullPath, { force: true });
}

test('Queue Manager - list', async () => {
  const tasks: QueueTask[] = [
    { id: '1', status: 'pending', workflow: 'flow1', prompt: 'prompt1' },
    { id: '2', status: 'completed', workflow: 'flow2', prompt: 'prompt2' },
  ];
  await setupTestFile(tasks);

  const manager = createQueueManager(testBasePath);
  const result = await manager.list();

  assert.deepStrictEqual(result, tasks);
  await cleanupTestFile();
});

test('Queue Manager - next', async () => {
  const tasks: QueueTask[] = [
    { id: '1', status: 'completed', workflow: 'flow1', prompt: 'prompt1' },
    { id: '2', status: 'pending', workflow: 'flow2', prompt: 'prompt2' },
    { id: '3', status: 'running', workflow: 'flow3', prompt: 'prompt3' },
  ];
  await setupTestFile(tasks);

  const manager = createQueueManager(testBasePath);
  const nextTask = await manager.next();

  assert.strictEqual(nextTask?.id, '2');
  await cleanupTestFile();
});

test('Queue Manager - summary', async () => {
  const tasks: QueueTask[] = [
    { id: '1', status: 'pending', workflow: 'flow1', prompt: 'prompt1' },
    { id: '2', status: 'completed', workflow: 'flow2', prompt: 'prompt2' },
    { id: '3', status: 'failed', workflow: 'flow3', prompt: 'prompt3' },
    { id: '4', status: 'running', workflow: 'flow4', prompt: 'prompt4' },
  ];
  await setupTestFile(tasks);

  const manager = createQueueManager(testBasePath);
  const summary = await manager.summary();

  assert.deepStrictEqual(summary, { pending: 1, running: 1, completed: 1, failed: 1, skipped: 0 });
  await cleanupTestFile();
});

test('Queue Manager - markRunning', async () => {
  const tasks: QueueTask[] = [
    { id: '1', status: 'pending', workflow: 'flow1', prompt: 'prompt1' },
  ];
  await setupTestFile(tasks);

  const manager = createQueueManager(testBasePath);
  await manager.markRunning('1');
  const result = await manager.list();

  assert.strictEqual(result[0].status, 'running');
  assert.ok(result[0].started_at);
  await cleanupTestFile();
});

test('Queue Manager - markCompleted', async () => {
  const tasks: QueueTask[] = [
    { id: '1', status: 'running', workflow: 'flow1', prompt: 'prompt1' },
  ];
  await setupTestFile(tasks);

  const manager = createQueueManager(testBasePath);
  await manager.markCompleted('1', 'main-branch');
  const result = await manager.list();

  assert.strictEqual(result[0].status, 'completed');
  assert.ok(result[0].completed_at);
  assert.strictEqual(result[0].branch, 'main-branch');
  await cleanupTestFile();
});

test('Queue Manager - markFailed', async () => {
  const tasks: QueueTask[] = [
    { id: '1', status: 'running', workflow: 'flow1', prompt: 'prompt1' },
  ];
  await setupTestFile(tasks);

  const manager = createQueueManager(testBasePath);
  await manager.markFailed('1', 'Some error occurred');
  const result = await manager.list();

  assert.strictEqual(result[0].status, 'failed');
  assert.ok(result[0].completed_at);
  assert.strictEqual(result[0].error, 'Some error occurred');
  await cleanupTestFile();
});

test('Queue Manager - resetTask', async () => {
  const tasks: QueueTask[] = [
    { id: '1', status: 'failed', workflow: 'flow1', prompt: 'prompt1', error: 'Some error' },
  ];
  await setupTestFile(tasks);

  const manager = createQueueManager(testBasePath);
  await manager.resetTask('1');
  const result = await manager.list();

  assert.strictEqual(result[0].status, 'pending');
  assert.strictEqual(result[0].error, undefined);
  await cleanupTestFile();
});

test('Queue Manager - error handling on corrupted file', async () => {
  await fs.writeFile(fullPath, 'corrupted content', 'utf-8');

  const manager = createQueueManager(testBasePath);

  try {
    await manager.list();
    assert.fail('Expected an error due to corrupted file');
  } catch (error) {
    assert.ok(error instanceof Error);
  }

  await cleanupTestFile();
});
