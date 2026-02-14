import assert from 'node:assert';
import { createQueueManager, QueueTask } from '../src/queue-manager.js';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';

// Mock file operations
const basePath = '/mock/path';
let mockTasks: QueueTask[] = [
  { id: '1', status: 'pending', workflow: 'wf1', prompt: 'Do something' },
  { id: '2', status: 'running', workflow: 'wf2', prompt: 'Do something else' },
  { id: '3', status: 'completed', workflow: 'wf3', prompt: 'Do another thing', completed_at: new Date().toISOString() },
];

const queueManager = createQueueManager(basePath);

before(async () => {
  const fullPath = resolve(basePath, 'tasks/queue.yaml');
  await writeFile(fullPath, '');
});

async function loadMock() {
  return { tasks: [...mockTasks] };
}

async function saveMock(tasks: QueueTask[]) {
  mockTasks = [...tasks];
}

test('Test queueManager.list', async (t) => {
  readFile.mockImplementationOnce(async () => JSON.stringify(loadMock()));
  writeFile.mockImplementationOnce(async () => saveMock(mockTasks));

  const tasks = await queueManager.list();
  assert.deepEqual(tasks, mockTasks);
});

test('Test queueManager.next', async (t) => {
  readFile.mockImplementationOnce(async () => JSON.stringify(loadMock()));
  writeFile.mockImplementationOnce(async () => saveMock(mockTasks));

  const nextTask = await queueManager.next();
  assert.deepEqual(nextTask, mockTasks[0]);
});

test('Test queueManager.summary', async (t) => {
  readFile.mockImplementationOnce(async () => JSON.stringify(loadMock()));
  writeFile.mockImplementationOnce(async () => saveMock(mockTasks));

  const summary = await queueManager.summary();
  assert.deepEqual(summary, { pending: 1, running: 1, completed: 1, failed: 0, skipped: 0 });
});

test('Test queueManager.markRunning', async (t) => {
  readFile.mockImplementationOnce(async () => JSON.stringify(loadMock()));
  writeFile.mockImplementationOnce(async () => saveMock(mockTasks));

  await queueManager.markRunning('1');
  assert.equal(mockTasks[0].status, 'running');
  assert.ok(mockTasks[0].started_at);
});

test('Test queueManager.markCompleted', async (t) => {
  readFile.mockImplementationOnce(async () => JSON.stringify(loadMock()));
  writeFile.mockImplementationOnce(async () => saveMock(mockTasks));

  await queueManager.markCompleted('2', 'main');
  assert.equal(mockTasks[1].status, 'completed');
  assert.ok(mockTasks[1].completed_at);
  assert.equal(mockTasks[1].branch, 'main');
});

test('Test queueManager.markFailed', async (t) => {
  readFile.mockImplementationOnce(async () => JSON.stringify(loadMock()));
  writeFile.mockImplementationOnce(async () => saveMock(mockTasks));

  const errorMessage = 'Unexpected Error';
  await queueManager.markFailed('1', errorMessage);
  assert.equal(mockTasks[0].status, 'failed');
  assert.ok(mockTasks[0].completed_at);
  assert.equal(mockTasks[0].error, errorMessage);
});

test('Test queueManager.resetTask', async (t) => {
  readFile.mockImplementationOnce(async () => JSON.stringify(loadMock()));
  writeFile.mockImplementationOnce(async () => saveMock(mockTasks));

  await queueManager.resetTask('1');
  assert.equal(mockTasks[0].status, 'pending');
  assert.strictEqual(mockTasks[0].error, undefined);
  assert.strictEqual(mockTasks[0].started_at, undefined);
  assert.strictEqual(mockTasks[0].completed_at, undefined);
});
