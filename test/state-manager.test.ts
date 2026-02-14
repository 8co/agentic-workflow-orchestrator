import { createStateManager } from '../src/state-manager.js';
import { strict as assert } from 'node:assert';
import { rm, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

type WorkflowExecution = {
  executionId: string;
  startedAt: string;
  [key: string]: unknown;
};

const BASE_PATH = './test-state';
const STATE_DIR = join(BASE_PATH, '.state');

const sampleExecution: WorkflowExecution = {
  executionId: 'testExec1',
  startedAt: new Date().toISOString(),
  sampleData: 'test data',
};

const corruptExecutionData = `{"executionId":"corruptExec`;

async function cleanStateDirectory() {
  await rm(STATE_DIR, { recursive: true, force: true });
}

beforeEach(async () => {
  await cleanStateDirectory();
});

afterEach(async () => {
  await cleanStateDirectory();
});

test('save() should persist execution to disk', async () => {
  const stateManager = createStateManager(BASE_PATH);
  await stateManager.save(sampleExecution);

  const filePath = join(STATE_DIR, `${sampleExecution.executionId}.json`);
  const data = JSON.parse(await readFile(filePath, 'utf-8')) as WorkflowExecution;

  assert.deepEqual(data, sampleExecution);
});

test('load() should return null for non-existent execution', async () => {
  const stateManager = createStateManager(BASE_PATH);
  const result = await stateManager.load('nonExistentExec');
  assert.equal(result, null);
});

test('load() should return the correct execution data', async () => {
  const stateManager = createStateManager(BASE_PATH);
  await stateManager.save(sampleExecution);
  const loadedExecution = await stateManager.load(sampleExecution.executionId);

  assert.deepEqual(loadedExecution, sampleExecution);
});

test('list() should handle an empty state directory', async () => {
  const stateManager = createStateManager(BASE_PATH);
  const executions = await stateManager.list();
  assert.deepEqual(executions, []);
});

test('list() should return all executions sorted by startedAt descending', async () => {
  const stateManager = createStateManager(BASE_PATH);
  
  const execution1: WorkflowExecution = {
    executionId: 'exec1',
    startedAt: new Date(Date.now() - 1000).toISOString(),
    sampleData: 'data1'
  };

  const execution2: WorkflowExecution = {
    executionId: 'exec2',
    startedAt: new Date().toISOString(),
    sampleData: 'data2'
  };
  
  await stateManager.save(execution1);
  await stateManager.save(execution2);

  const executions = await stateManager.list();
  assert.deepEqual(executions, [execution2, execution1]);
});

test('list() should skip corrupt execution files', async () => {
  const stateManager = createStateManager(BASE_PATH);
  await stateManager.save(sampleExecution);

  const corruptFilePath = join(STATE_DIR, 'corrupt.json');
  await writeFile(corruptFilePath, corruptExecutionData, 'utf-8');

  const executions = await stateManager.list();
  assert.equal(executions.length, 1);
  assert.deepEqual(executions[0], sampleExecution);
});
