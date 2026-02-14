import { createStateManager } from '../src/state-manager.js';
import assert from 'node:assert';
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { sep } from 'node:path';

type WorkflowExecution = {
  executionId: string;
  startedAt: string;
};

(async () => {
  const tempDir = await mkdtemp(`${tmpdir()}${sep}`);
  const stateManager = createStateManager(tempDir);

  try {
    await (async () => {
      // Test saving and loading a valid execution
      const execution: WorkflowExecution = { executionId: 'test1', startedAt: new Date().toISOString() };
      await stateManager.save(execution);
      
      const loadedExecution = await stateManager.load('test1');
      assert.deepEqual(loadedExecution, execution, 'Should load the saved execution correctly');
    })();

    await (async () => {
      // Test loading non-existent execution
      const nonExistentExecution = await stateManager.load('nonexistent');
      assert.strictEqual(nonExistentExecution, null, 'Should return null for non-existent execution');
    })();

    await (async () => {
      // Simulating file permission issue during save
      const readOnlyStateManager = createStateManager('/');
      const execution: WorkflowExecution = { executionId: 'test2', startedAt: new Date().toISOString() };
      try {
        await readOnlyStateManager.save(execution);
        assert.fail('Expected an error due to file permission issues');
      } catch (error) {
        assert.ok(error instanceof Error, 'Expected file permission error');
      }
    })();

    await (async () => {
      // Test malformed JSON handling
      await writeFile(`${tempDir}/malformed.json`, '{invalid json}', 'utf-8');
      const malformedExecution = await stateManager.load('malformed');
      assert.strictEqual(malformedExecution, null, 'Should return null for malformed JSON files');
    })();

    await (async () => {
      // Test listing executions with malformed files present
      const validExecution: WorkflowExecution = { executionId: 'list_test', startedAt: new Date().toISOString() };
      await stateManager.save(validExecution);
      const executions = await stateManager.list();
      assert.ok(executions.some(exec => exec.executionId === 'list_test'), 'List should include valid executions');
      assert.ok(!executions.some(exec => exec.executionId === 'malformed'), 'List should not include malformed executions');
    })();
  } finally {
    // Cleanup
    await rm(tempDir, { recursive: true, force: true });
  }
})();
