import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createAutonomousRunner } from '../src/autonomous-runner.js';
import type { AgentAdapter, AutoWorkflow } from '../src/types.js';
import { stub } from 'sinon';

describe('createAutonomousRunner', () => {
  let mockAdapters: Record<string, AgentAdapter>;
  let runner: ReturnType<typeof createAutonomousRunner>;

  beforeEach(() => {
    mockAdapters = {
      mockAgent: {
        execute: stub().resolves({ success: true, output: '```typescript:path/to/file.ts\nconsole.log("Hello World");\n```' }),
      },
    };
    runner = createAutonomousRunner({ adapters: mockAdapters, defaultAgent: 'mockAgent' });
  });

  test('should execute an AutoWorkflow successfully', async () => {
    const mockWorkflow: AutoWorkflow = {
      name: 'TestWorkflow',
      target_dir: './some-dir',
      steps: [{
        id: 'step1',
        prompt: './prompt1.txt',
      }],
    };

    const result = await runner.run('mock/workflow/path.yaml', __dirname);

    assert.strictEqual(result.status, 'completed');
    assert.strictEqual(result.steps.length, 1);
    assert.strictEqual(result.steps[0].status, 'completed');
    assert.strictEqual(result.executionId.length, 36);  // UUID length
  });

  test('should handle errors in the workflow execution', async () => {
    const mockErrorAdapters = {
      mockAgent: {
        execute: stub().resolves({ success: false, error: 'LLM Error' }),
      },
    };
    const errorRunner = createAutonomousRunner({ adapters: mockErrorAdapters, defaultAgent: 'mockAgent' });

    const mockWorkflow: AutoWorkflow = {
      name: 'TestWorkflow',
      target_dir: './some-dir',
      steps: [{
        id: 'step1',
        prompt: './prompt1.txt',
      }],
    };

    const result = await errorRunner.run('mock/workflow/path.yaml', __dirname);

    assert.strictEqual(result.status, 'failed');
    assert.strictEqual(result.steps[0].status, 'failed');
    assert.strictEqual(result.steps[0].error, 'LLM Error');
  });

  test('should properly branch if specified in the workflow', async () => {
    const createBranchStub = stub().resolves({ success: true });
    const getCurrentBranchStub = stub().resolves('main');

    const mockGitOps = {
      createBranch: createBranchStub,
      getCurrentBranch: getCurrentBranchStub,
    };

    Object.assign(global, mockGitOps);

    const mockWorkflow: AutoWorkflow = {
      name: 'TestWorkflow',
      target_dir: './some-dir',
      branch: 'feature/new-feature',
      steps: [{
        id: 'step1',
        prompt: './prompt1.txt',
      }],
    };

    const result = await runner.run('mock/workflow/path.yaml', __dirname);

    assert.strictEqual(result.branch, 'feature/new-feature');
  });
});
