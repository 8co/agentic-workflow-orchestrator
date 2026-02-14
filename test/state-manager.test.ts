import { strict as assert } from 'node:assert';
import { mkdir, readFile, writeFile, readdir, rmdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createStateManager } from '../src/state-manager.js';
import type { WorkflowExecution } from '../src/types.js';

const TEST_BASE_PATH = resolve('test-state-dir');
const TEST_STATE_DIR = resolve(TEST_BASE_PATH, '.state');
const SAMPLE_EXECUTION: WorkflowExecution = {
  executionId: 'test-execution-id',
  startedAt: new Date().toISOString(),
  // Add other necessary properties as needed by WorkflowExecution type
};

async function cleanStateDir() {
  try {
    const files = await readdir(TEST_STATE_DIR);
    for (const file of files) {
      await rm(resolve(TEST_STATE_DIR, file));
    }
    await rmdir(TEST_STATE_DIR);
  } catch {
    // Ignore errors, as the directory might not exist
  }
}

await (async function tests() {
  await cleanStateDir();

  const stateManager = createStateManager(TEST_BASE_PATH);

  // Test createStateManager and directory creation
  await stateManager.save(SAMPLE_EXECUTION);
  const savedExecution = await stateManager.load('test-execution-id');
  assert.deepEqual(savedExecution, SAMPLE_EXECUTION, 'Execution should be saved and loaded correctly');

  // Test error handling for non-existent execution
  const nonExistentExecution = await stateManager.load('non-existent-id');
  assert.strictEqual(nonExistentExecution, null, 'Non-existent executionId should return null');

  // Test list on empty/no valid executions
  let executionsList = await stateManager.list();
  assert.deepEqual(executionsList, [SAMPLE_EXECUTION], 'Execution list should contain the saved execution');

  // Test corrupted state file handling
  await writeFile(resolve(TEST_STATE_DIR, 'corrupt.json'), 'not-a-json');
  executionsList = await stateManager.list();
  assert.deepEqual(executionsList, [SAMPLE_EXECUTION], 'List should skip corrupt files');

  // Test invalid JSON data
  const corruptExecution: Partial<WorkflowExecution> = { startedAt: 'invalid-date' };
  await writeFile(resolve(TEST_STATE_DIR, 'invalid.json'), JSON.stringify(corruptExecution));
  executionsList = await stateManager.list();
  assert.deepEqual(executionsList, [SAMPLE_EXECUTION], 'List should skip files with invalid data');

  // Test handling write error (simulation)
  const originalWriteFile = writeFile;
  try {
    (writeFile as any) = () => Promise.reject(new Error('Simulated write error'));
    await assert.rejects(stateManager.save(SAMPLE_EXECUTION), /Simulated write error/, 'Should handle write errors');
  } finally {
    (writeFile as any) = originalWriteFile;
  }

  // Clean up
  await cleanStateDir();
})();
