import { strict as assert } from 'node:assert';
import { createQueueManager, QueueTask } from '../src/queue-manager.js';
import { promises as fs } from 'node:fs';
import { join, resolve } from 'node:path';

const basePath = resolve('.');
const queueFilePath = join(basePath, 'tasks/queue.yaml');

const mockQueue: QueueTask[] = [
  { id: '1', status: 'pending', workflow: 'build', prompt: 'Prompt 1' },
  { id: '2', status: 'completed', workflow: 'test', prompt: 'Prompt 2' },
  { id: '3', status: 'failed', workflow: 'deploy', prompt: 'Prompt 3', error: 'Some error' },
];

async function setupMockQueueFile(tasks: QueueTask[] = mockQueue) {
  const content = `
tasks:
${tasks.map(task => `
  - id: ${task.id}
    status: ${task.status}
    workflow: ${task.workflow}
    prompt: ${task.prompt}
    ${task.error ? `error: ${task.error}` : ''}
    ${task.branch ? `branch: ${task.branch}` : ''}
`).join('')}
  `;
  await fs.mkdir(resolve(basePath, 'tasks'), { recursive: true });
  await fs.writeFile(queueFilePath, content.trim(), 'utf8');
}

async function cleanupMockQueueFile() {
  await fs.unlink(queueFilePath).catch(() => {});
}

(async () => {
  await cleanupMockQueueFile();

  const queueManager = createQueueManager(basePath);

  process.on('exit', async () => {
    await cleanupMockQueueFile();
  });

  test('list() should return all tasks', async () => {
    await setupMockQueueFile();

    const tasks = await queueManager.list();
    assert.equal(tasks.length, mockQueue.length);
    assert.deepEqual(tasks, mockQueue);

    await cleanupMockQueueFile();
  });

  test('next() should return the first pending task', async () => {
    await setupMockQueueFile(mockQueue);

    const nextTask = await queueManager.next();
    assert.equal(nextTask?.id, '1');

    await cleanupMockQueueFile();
  });

  test('summary() should return correct summary', async () => {
    await setupMockQueueFile(mockQueue);

    const summary = await queueManager.summary();
    assert.deepEqual(summary, { pending: 1, running: 0, completed: 1, failed: 1, skipped: 0 });

    await cleanupMockQueueFile();
  });

  test('markRunning() should update the task status to running', async () => {
    await setupMockQueueFile(mockQueue);

    await queueManager.markRunning('1');
    const task = (await queueManager.list()).find(t => t.id === '1');
    assert.equal(task?.status, 'running');
    assert.ok(task?.started_at);

    await cleanupMockQueueFile();
  });

  test('markCompleted() should update the task status to completed and set the branch', async () => {
    await setupMockQueueFile(mockQueue);

    await queueManager.markCompleted('1', 'feature-branch');
    const task = (await queueManager.list()).find(t => t.id === '1');
    assert.equal(task?.status, 'completed');
    assert.ok(task?.completed_at);
    assert.equal(task?.branch, 'feature-branch');

    await cleanupMockQueueFile();
  });

  test('markFailed() should update the task status to failed with error', async () => {
    await setupMockQueueFile(mockQueue);

    await queueManager.markFailed('1', 'Unexpected error');
    const task = (await queueManager.list()).find(t => t.id === '1');
    assert.equal(task?.status, 'failed');
    assert.ok(task?.completed_at);
    assert.equal(task?.error, 'Unexpected error');

    await cleanupMockQueueFile();
  });

  test('resetTask() should reset the task to pending', async () => {
    await setupMockQueueFile(mockQueue);

    await queueManager.resetTask('3');
    const task = (await queueManager.list()).find(t => t.id === '3');
    assert.equal(task?.status, 'pending');
    assert.ok(!task?.error);
    assert.ok(!task?.started_at);
    assert.ok(!task?.completed_at);

    await cleanupMockQueueFile();
  });

  test('should handle non-existent task file gracefully', async () => {
    await queueManager.resetTask('3').catch((err: Error) => {
      assert.equal(err.message, 'Task not found: 3');
    });
  });

  test('should handle tasks with missing fields gracefully', async () => {
    await setupMockQueueFile([{ id: '4', status: 'pending', workflow: 'test', prompt: '' }]);

    const task = await queueManager.next();
    assert.equal(task?.id, '4');
    assert.equal(task?.prompt, '');

    await cleanupMockQueueFile();
  });

})();
