import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { createStateManager } from './state-manager.js';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Mock interface based on the expected properties from the code
interface MockWorkflowExecution {
  executionId: string;
  startedAt: string;
  workflowName: string;
  status: string;
  steps: string[];
  variables: { [key: string]: any };
}

const TEST_DIR = '.test_state';

async function setupDummyExecution(executionId: string, data: Partial<MockWorkflowExecution>, corruptJson: boolean = false) {
  const dataToWrite = corruptJson ? '{"executionId":' : JSON.stringify(data, null, 2);
  await writeFile(join(TEST_DIR, `${executionId}.json`), dataToWrite, 'utf-8');
}

test('StateManager loads valid execution', async () => {
  const executionId = 'validExecution';
  const stateMgr = createStateManager(TEST_DIR);
  const validExecution: MockWorkflowExecution = {
    executionId,
    startedAt: new Date().toISOString(),
    workflowName: 'TestWorkflow',
    status: 'running',
    steps: [],
    variables: {}
  };
  await mkdir(TEST_DIR, { recursive: true });
  await setupDummyExecution(executionId, validExecution);

  const loadedExecution = await stateMgr.load(executionId);
  assert.deepEqual(loadedExecution, validExecution);

  await rm(TEST_DIR, { recursive: true, force: true });
});

test('StateManager returns null for non-existent file', async () => {
  const stateMgr = createStateManager(TEST_DIR);
  const executionId = 'nonExistentExecution';

  const loadedExecution = await stateMgr.load(executionId);
  assert.equal(loadedExecution, null);
});

test('StateManager returns null for file with invalid JSON', async () => {
  const executionId = 'corruptExecution';
  const stateMgr = createStateManager(TEST_DIR);
  await mkdir(TEST_DIR, { recursive: true });
  await setupDummyExecution(executionId, {}, true);

  const loadedExecution = await stateMgr.load(executionId);
  assert.equal(loadedExecution, null);

  await rm(TEST_DIR, { recursive: true, force: true });
});

// Simulate permission error by attempting to access a restricted directory
test('StateManager handles permission error gracefully', async () => {
  const restrictedDir = '/root/restricted_state';
  const stateMgr = createStateManager(restrictedDir);
  const executionId = 'restrictedExecution';

  try {
    const loadedExecution = await stateMgr.load(executionId);
    assert.equal(loadedExecution, null);
  } catch (error) {
    assert.fail('Expected null result, but an exception was thrown');
  }
});
