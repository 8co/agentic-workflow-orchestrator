import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { createStateManager } from './state-manager.js';
import { writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

type WorkflowExecution = {
  executionId: string;
  startedAt: string;
  // more fields if needed
};

const TEST_BASE_PATH = resolve('.test_state');
const TEST_STATE_DIR = resolve(TEST_BASE_PATH, '.state');

test('load should return correct WorkflowExecution for a valid file', async (t) => {
  const stateManager = createStateManager(TEST_BASE_PATH);
  const executionId = 'test-execution-id';
  const execution: WorkflowExecution = {
    executionId,
    startedAt: new Date().toISOString(),
  };

  await writeFile(join(TEST_STATE_DIR, `${executionId}.json`), JSON.stringify(execution), 'utf-8');
  const loadedExecution = await stateManager.load(executionId);

  assert.deepEqual(loadedExecution, execution);
});

test('load should return null if file does not exist', async (t) => {
  const stateManager = createStateManager(TEST_BASE_PATH);
  const nonExistentExecutionId = 'non-existent-id';

  const loadedExecution = await stateManager.load(nonExistentExecutionId);

  assert.strictEqual(loadedExecution, null);
});

test('load should return null for a corrupt JSON file', async (t) => {
  const stateManager = createStateManager(TEST_BASE_PATH);
  const corruptExecutionId = 'corrupt-execution';
  const corruptContent = '{ "executionId": "invalid, "startedAt": "invalid json"'; // missing } to make it invalid

  await writeFile(join(TEST_STATE_DIR, `${corruptExecutionId}.json`), corruptContent, 'utf-8');
  const loadedExecution = await stateManager.load(corruptExecutionId);

  assert.strictEqual(loadedExecution, null);
});
