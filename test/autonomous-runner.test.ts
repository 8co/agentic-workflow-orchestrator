import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAutonomousRunner, AutoWorkflow, AutoStepResult } from '../src/autonomous-runner.js';

const mockAgentAdapter = {
  execute: async ({ prompt }: { prompt: string }) => {
    if (prompt.includes('fail')) {
      return { success: false, output: '', error: 'Simulated failure' };
    }
    return { success: true, output: '```typescript:test-file.ts\nexport const value = 42;\n```' };
  },
};

const adapters = {
  mockAgent: mockAgentAdapter,
};

const autonomousRunner = createAutonomousRunner({ adapters, defaultAgent: 'mockAgent' });

test('createAutonomousRunner runs successfully with valid steps', async () => {
  const workflow: AutoWorkflow = {
    name: 'Test Workflow',
    target_dir: '/test/dir',
    steps: [
      { id: 'step1', prompt: 'Write code', agent: 'mockAgent' },
    ],
  };

  const result = await autonomousRunner.run('/test/workflow.yaml', '/test/base', {});

  assert.equal(result.status, 'completed');
  assert.equal(result.steps.length, 1);
  assert.equal(result.steps[0].status, 'completed');
});

test('createAutonomousRunner fails if adapter fails', async () => {
  const workflow: AutoWorkflow = {
    name: 'Test Workflow',
    target_dir: '/test/dir',
    steps: [
      { id: 'step1', prompt: 'fail this step', agent: 'mockAgent' },
    ],
  };

  const result = await autonomousRunner.run('/test/workflow.yaml', '/test/base', {});

  assert.equal(result.status, 'failed');
  assert.equal(result.steps.length, 1);
  assert.equal(result.steps[0].status, 'failed');
  assert.equal(result.steps[0].error, 'Simulated failure');
});

test('createAutonomousRunner handles missing adapter gracefully', async () => {
  const workflow: AutoWorkflow = {
    name: 'Test Workflow',
    target_dir: '/test/dir',
    steps: [
      { id: 'step1', prompt: 'Write code', agent: 'nonexistentAgent' },
    ],
  };

  const result = await autonomousRunner.run('/test/workflow.yaml', '/test/base', {});

  assert.equal(result.status, 'failed');
  assert.equal(result.steps.length, 1);
  assert.equal(result.steps[0].status, 'failed');
  assert.equal(result.steps[0].error, 'No adapter for agent: nonexistentAgent');
});
