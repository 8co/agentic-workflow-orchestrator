import { createStateManager } from '../src/state-manager.js';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

const TEMP_DIR = '.test_temp';

type WorkflowExecution = {
  executionId: string;
  startedAt: string;
};

// After running tests the temporary directory is removed
afterEach(async () => {
  await rm(TEMP_DIR, { recursive: true, force: true });
});

// Create a test directory for each test
beforeEach(async () => {
  await mkdir(TEMP_DIR, { recursive: true });
});

test('save and load a workflow execution', async () => {
  const stateManager = createStateManager(TEMP_DIR);

  const execution: WorkflowExecution = {
    executionId: 'test-execution',
    startedAt: new Date().toISOString(),
  };

  await stateManager.save(execution);

  const loadedExecution = await stateManager.load(execution.executionId);

  assert.deepStrictEqual(loadedExecution, execution);
});

test('load returns null for nonexistent execution', async () => {
  const stateManager = createStateManager(TEMP_DIR);

  const loadedExecution = await stateManager.load('nonexistent-execution');

  assert.strictEqual(loadedExecution, null);
});

test('list returns sorted workflow executions', async () => {
  const stateManager = createStateManager(TEMP_DIR);

  const executions: WorkflowExecution[] = [
    { executionId: '1', startedAt: new Date(2023, 1, 1).toISOString() },
    { executionId: '2', startedAt: new Date(2023, 1, 2).toISOString() },
  ];

  for (const execution of executions) {
    await stateManager.save(execution);
  }

  const loadedExecutions = await stateManager.list();

  assert.strictEqual(loadedExecutions.length, executions.length);
  assert.strictEqual(loadedExecutions[0].executionId, '2');
  assert.strictEqual(loadedExecutions[1].executionId, '1');
});

test('list skips corrupt or empty state files', async () => {
  const stateManager = createStateManager(TEMP_DIR);

  const validExecution: WorkflowExecution = {
    executionId: 'valid',
    startedAt: new Date().toISOString(),
  };

  await stateManager.save(validExecution);

  // Write a corrupt file
  const corruptFilePath = join(TEMP_DIR, '.state', 'corrupt.json');
  await writeFile(corruptFilePath, 'not-json-content', 'utf-8');

  const loadedExecutions = await stateManager.list();

  assert.strictEqual(loadedExecutions.length, 1);
  assert.strictEqual(loadedExecutions[0].executionId, 'valid');
});

test('handles base path with non-existent directory', async () => {
  const nonExistentDir = resolve(TEMP_DIR, 'non-existent');
  const stateManager = createStateManager(nonExistentDir);

  const execution: WorkflowExecution = {
    executionId: 'test-execution',
    startedAt: new Date().toISOString(),
  };

  await stateManager.save(execution);

  const loadedExecution = await stateManager.load(execution.executionId);

  assert.deepStrictEqual(loadedExecution, execution);
});
