import { strict as assert } from 'node:assert';
import { createQueueManager, QueueTask } from '../src/queue-manager.js';
import { writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp } from 'node:fs/promises';

const sampleTaskQueue: QueueTask[] = [
  { id: '1', status: 'pending', workflow: 'wf-1', prompt: 'Test Prompt 1' },
  { id: '2', status: 'running', workflow: 'wf-2', prompt: 'Test Prompt 2' },
  { id: '3', status: 'completed', workflow: 'wf-3', prompt: 'Test Prompt 3' },
  { id: '4', status: 'failed', workflow: 'wf-4', prompt: 'Test Prompt 4', error: 'Some error' },
];

async function prepareQueueFile(tasks: QueueTask[]): Promise<string> {
  const dir = await mkdtemp(resolve(tmpdir(), 'queue-manager-test-'));
  const filepath = resolve(dir, 'queue.yaml');
  const content = `tasks:\n${tasks.map((task) => `  - id: '${task.id}'\n    status: '${task.status}'\n    workflow: '${task.workflow}'\n    prompt: '${task.prompt}'\n${task.error ? `    error: '${task.error}'\n` : ''}${task.started_at ? `    started_at: '${task.started_at}'\n` : ''}${task.completed_at ? `    completed_at: '${task.completed_at}'\n` : ''}${task.branch ? `    branch: '${task.branch}'\n` : ''}`).join('')}`;
  await writeFile(filepath, content);
  return dir;
}

async function readQueueFile(filepath: string): Promise<QueueTask[]> {
  const raw = await readFile(resolve(filepath, 'queue.yaml'), 'utf-8');
  return JSON.parse(raw.replace(/(\w+): /g, '"$1": ').replace(/\n/g, ',').replace(/,]/, ']').replace(/},]/, '}]'));
}

(async () => {
  const basePath = await prepareQueueFile(sampleTaskQueue);
  const queueManager = createQueueManager(basePath);

  // Test list
  const tasks = await queueManager.list();
  assert.equal(tasks.length, 4);
  assert.equal(tasks[0].id, '1');

  // Test next
  const nextTask = await queueManager.next();
  assert.equal(nextTask?.id, '1');
  assert.equal(nextTask?.status, 'pending');

  // Test summary
  const summary = await queueManager.summary();
  assert.equal(summary.pending, 1);
  assert.equal(summary.running, 1);
  assert.equal(summary.completed, 1);
  assert.equal(summary.failed, 1);

  // Test markRunning
  await queueManager.markRunning('1');
  const tasksAfterRunning = await readQueueFile(basePath);
  assert.equal(tasksAfterRunning[0].status, 'running');
  assert.notEqual(tasksAfterRunning[0].started_at, undefined);

  // Test markCompleted
  await queueManager.markCompleted('2', 'main-branch');
  const tasksAfterCompleted = await readQueueFile(basePath);
  assert.equal(tasksAfterCompleted[1].status, 'completed');
  assert.equal(tasksAfterCompleted[1].branch, 'main-branch');
  assert.notEqual(tasksAfterCompleted[1].completed_at, undefined);

  // Test markFailed
  await queueManager.markFailed('3', 'Another error');
  const tasksAfterFailed = await readQueueFile(basePath);
  assert.equal(tasksAfterFailed[2].status, 'failed');
  assert.equal(tasksAfterFailed[2].error, 'Another error');
  assert.notEqual(tasksAfterFailed[2].completed_at, undefined);

  // Test resetTask
  await queueManager.resetTask('4');
  const tasksAfterReset = await readQueueFile(basePath);
  assert.equal(tasksAfterReset[3].status, 'pending');
  assert.equal(tasksAfterReset[3].error, undefined);
  assert.equal(tasksAfterReset[3].started_at, undefined);
  assert.equal(tasksAfterReset[3].completed_at, undefined);

  console.log('All tests passed successfully.');
})();
