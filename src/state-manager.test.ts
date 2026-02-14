import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStateManager } from './state-manager.js';
import type { WorkflowExecution } from './types.js';

describe('StateManager', () => {
  let basePath: string;
  let stateManager: ReturnType<typeof createStateManager>;

  beforeEach(async () => {
    basePath = await mkdtemp(join(tmpdir(), 'state-manager-test-'));
    stateManager = createStateManager(basePath);
  });

  async function createSampleExecution(
    executionId: string,
    startedAt: string
  ): Promise<WorkflowExecution> {
    const execution = {
      executionId,
      startedAt,
    } as WorkflowExecution;
    await stateManager.save(execution);
    return execution;
  }

  it('should save and load a workflow execution', async () => {
    const execution = await createSampleExecution('test-execution-id', new Date().toISOString());
    const loadedExecution = await stateManager.load('test-execution-id');
    assert.deepEqual(loadedExecution, execution);
  });

  it('should return null for non-existent workflow executions', async () => {
    const loadedExecution = await stateManager.load('non-existent-id');
    assert.equal(loadedExecution, null);
  });

  it('should list all saved workflow executions', async () => {
    const execution1 = await createSampleExecution('execution1', new Date(2023, 0, 1).toISOString());
    const execution2 = await createSampleExecution('execution2', new Date(2023, 0, 2).toISOString());

    const executions = await stateManager.list();
    assert.equal(executions.length, 2);
    assert.deepEqual(executions, [execution2, execution1]); // Sorted by startedAt descending
  });

  it('should ignore non-JSON and corrupted files in list', async () => {
    await createSampleExecution('execution1', new Date(2023, 0, 1).toISOString());

    const filePath = join(basePath, '.state', 'corrupted-file.json');
    await writeFile(filePath, '{ this is: not: valid json }', 'utf-8');

    const files = await stateManager.list();
    assert.equal(files.length, 1);
    assert.equal(files[0].executionId, 'execution1');
  });

  it('should create state directory if it does not exist', async () => {
    const stateDir = join(basePath, '.state');
    await rm(stateDir, { recursive: true, force: true });

    const execution = await createSampleExecution('execution1', new Date().toISOString());
    const loadedExecution = await stateManager.load('execution1');
    assert.deepEqual(loadedExecution, execution);
  });
});
