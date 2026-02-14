import assert from 'node:assert';
import { test } from 'node:test';
import { createStateManager } from '../src/state-manager.js';
import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { WorkflowExecution } from '../src/types.js';

const TEMP_DIR = '.test-state';

test('StateManager - save and load workflow execution', async () => {
  const manager = createStateManager(TEMP_DIR);
  const execution: WorkflowExecution = {
    executionId: '123',
    startedAt: new Date().toISOString(),
    // other necessary fields
  };

  await manager.save(execution);

  const loadedExecution = await manager.load('123');
  assert.deepStrictEqual(loadedExecution, execution);

  await rm(TEMP_DIR, { recursive: true, force: true });
});

test('StateManager - load non-existent execution ID returns null', async () => {
  const manager = createStateManager(TEMP_DIR);

  const loadedExecution = await manager.load('non-existent-id');
  assert.strictEqual(loadedExecution, null);

  await rm(TEMP_DIR, { recursive: true, force: true });
});

test('StateManager - corrupted state file is ignored', async () => {
  const manager = createStateManager(TEMP_DIR);
  const stateDir = join(TEMP_DIR, '.state');
  await rm(stateDir, { recursive: true, force: true });

  await manager.save({ executionId: 'valid', startedAt: new Date().toISOString() });
  await writeFile(join(stateDir, 'corrupt.json'), '{invalid json content', 'utf-8');

  const executions = await manager.list();
  assert.strictEqual(executions.length, 1);
  assert.strictEqual(executions[0].executionId, 'valid');

  await rm(TEMP_DIR, { recursive: true, force: true });
});

test('StateManager - disk write failure on save', async () => {
  const manager = createStateManager('/unwritable-directory');

  const execution: WorkflowExecution = {
    executionId: '456',
    startedAt: new Date().toISOString(),
    // other necessary fields
  };

  try {
    await manager.save(execution);
    assert.fail('Expected operation to fail');
  } catch (error) {
    assert.ok(error instanceof Error);
  }
});

test('StateManager - list executions sorted by startedAt desc', async () => {
  const manager = createStateManager(TEMP_DIR);
  const executions: WorkflowExecution[] = [
    { executionId: '1', startedAt: new Date('2021-01-01').toISOString() },
    { executionId: '2', startedAt: new Date('2022-01-01').toISOString() },
    { executionId: '3', startedAt: new Date('2020-01-01').toISOString() },
  ];

  for (const execution of executions) {
    await manager.save(execution);
  }

  const sortedExecutions = await manager.list();
  assert.strictEqual(sortedExecutions.length, 3);
  assert.strictEqual(sortedExecutions[0].executionId, '2');
  assert.strictEqual(sortedExecutions[1].executionId, '1');
  assert.strictEqual(sortedExecutions[2].executionId, '3');

  await rm(TEMP_DIR, { recursive: true, force: true });
});
