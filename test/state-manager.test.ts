import { strict as assert } from 'node:assert';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createStateManager } from '../src/state-manager.js';
import type { WorkflowExecution } from '../src/types.js';

const tempDir = './temp';
const stateDir = `${tempDir}/.state`;

async function setupTempDir() {
  await mkdir(tempDir, { recursive: true });
}

async function cleanupTempDir() {
  await rm(tempDir, { recursive: true, force: true });
}

async function createStateFile(executionId: string, content: string) {
  await writeFile(`${stateDir}/${executionId}.json`, content);
}

setupTempDir()
  .then(() => {
    const stateManager = createStateManager(tempDir);

    // Test when the file is missing
    test('load() should return null when the state file is missing', async () => {
      const result = await stateManager.load('missing-execution');
      assert.strictEqual(result, null);
    });

    // Test when the file is empty
    test('load() should return null when the state file is empty', async () => {
      await mkdir(stateDir, { recursive: true });
      await createStateFile('empty-execution', '');

      const result = await stateManager.load('empty-execution');
      assert.strictEqual(result, null);
    });

    // Test when the file is corrupted (invalid JSON)
    test('load() should return null when the state file is corrupted', async () => {
      await createStateFile('corrupted-execution', '{ invalid json }');

      const result = await stateManager.load('corrupted-execution');
      assert.strictEqual(result, null);
    });

    // Test a valid workflow execution
    test('load() should return the execution when the state file is valid', async () => {
      const validExecution: WorkflowExecution = { executionId: 'valid-execution', startedAt: new Date().toISOString() };
      await createStateFile('valid-execution', JSON.stringify(validExecution));

      const result = await stateManager.load('valid-execution');
      assert.deepStrictEqual(result, validExecution);
    });
  })
  .finally(() => {
    cleanupTempDir();
  });
