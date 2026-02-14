import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { createStateManager } from '../src/state-manager.js';
import { rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { WorkflowExecution } from '../src/types.js';

const TEST_DIR = './.test-state';
const stateManager = createStateManager(TEST_DIR);

const mockExecution: WorkflowExecution = {
  executionId: '123',
  startedAt: new Date().toISOString(),
  workflowName: 'Test Workflow',
  state: 'InProgress'
};

describe('State Manager', () => {
  before(async () => {
    // Clean up test directory before running tests
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it('should save a workflow execution state', async () => {
    await stateManager.save(mockExecution);
    const loadedExecution = await stateManager.load('123');
    assert.deepEqual(loadedExecution, mockExecution);
  });

  it('should return null for a non-existent workflow execution state', async () => {
    const result = await stateManager.load('non-existent-id');
    assert.strictEqual(result, null);
  });

  it('should handle file access error during save', async () => {
    const invalidPathStateManager = createStateManager('/root/invalid-path');
    try {
      await invalidPathStateManager.save(mockExecution);
      assert.fail('Expected error not thrown');
    } catch (error) {
      assert.strictEqual((error as NodeJS.ErrnoException).code, 'EACCES');
    }
  });

  it('should return a list of workflow executions sorted by startedAt', async () => {
    const exec1: WorkflowExecution = { executionId: '1', startedAt: new Date('2023-01-02').toISOString(), workflowName: 'First', state: 'Completed' };
    const exec2: WorkflowExecution = { executionId: '2', startedAt: new Date('2023-01-01').toISOString(), workflowName: 'Second', state: 'InProgress' };

    await stateManager.save(exec1);
    await stateManager.save(exec2);

    const list = await stateManager.list();
    assert.strictEqual(list.length, 3);
    assert.strictEqual(list[0].executionId, '1');
    assert.strictEqual(list[1].executionId, '123');
    assert.strictEqual(list[2].executionId, '2');
  });

  it('should skip corrupt state files while listing', async () => {
    const corruptFilePath = resolve(TEST_DIR, '.state/corrupt.json');
    await writeFile(corruptFilePath, '{"invalidJson"', 'utf-8');

    const list = await stateManager.list();
    list.forEach(execution => assert.notStrictEqual(execution.executionId, 'corrupt'));
  });
});
