import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { createStateManager } from '../src/state-manager.js';
import { resolve } from 'node:path';
import { rm } from 'node:fs/promises';
import type { WorkflowExecution } from '../src/types.js';

const TEMP_DIR = 'temp-state-test';

// Helper function to clean up test directory
async function cleanTestDir() {
  await rm(resolve(TEMP_DIR), { recursive: true, force: true });
}

test('StateManager.load returns null for non-existent files', async (t) => {
  await t.test('should return null when the file does not exist', async () => {
    const stateManager = createStateManager(TEMP_DIR);
    const result = await stateManager.load('non-existent-id');
    assert.strictEqual(result, null);
  });

  // Ensure cleanup after tests
  await cleanTestDir();
});

test('StateManager list returns an empty array when there are no state files', async (t) => {
  await t.test('should return an empty array when there are no files', async () => {
    const stateManager = createStateManager(TEMP_DIR);
    const executions = await stateManager.list();
    assert.deepEqual(executions, []);
  });

  // Ensure cleanup after tests
  await cleanTestDir();
});
