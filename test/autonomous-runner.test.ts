import { test } from 'node:test';
import assert from 'node:assert';
import { createAutonomousRunner } from '../src/autonomous-runner.js';
import type { AgentAdapter, AutoWorkflow } from '../src/types.js';

const mockAdapter: AgentAdapter = {
  execute: async () => ({ success: true, output: '```ts:src/sample.ts\nconsole.log("Test");\n```' }),
};

const mockFailingAdapter: AgentAdapter = {
  execute: async () => ({ success: false, error: 'Mock execution failed' }),
};

const basePath = process.cwd();
const mockDeps = {
  adapters: {
    default: mockAdapter,
    failing: mockFailingAdapter,
  },
  defaultAgent: 'default',
};

const runner = createAutonomousRunner(mockDeps);

test('should load and execute a simple workflow', async () => {
  const workflow: AutoWorkflow = {
    name: 'Test Workflow',
    target_dir: 'test/target-dir',
    steps: [
      { id: 'step1', prompt: 'mock-prompt' },
    ],
  };

  const result = await runner.run('mock-workflow-path', basePath, workflow.variables);

  assert.strictEqual(result.status, 'completed');
  assert(result.steps.length > 0);
  assert.strictEqual(result.steps[0].status, 'completed');
});

test('should fail when agent is missing', async () => {
  const runnerWithMissingAgent = createAutonomousRunner({
    adapters: {},
    defaultAgent: 'non-existent',
  });

  const workflow: AutoWorkflow = {
    name: 'Test Workflow',
    target_dir: 'test/target-dir',
    steps: [
      { id: 'step1', prompt: 'mock-prompt' },
    ],
  };

  const result = await runnerWithMissingAgent.run('mock-workflow-path', basePath, workflow.variables);

  assert.strictEqual(result.status, 'failed');
  assert(result.steps[0].error!.includes('No adapter for agent'));
});

test('should fail when LLM output is invalid', async () => {
  const runnerWithFailingAdapter = createAutonomousRunner({
    adapters: {
      default: mockFailingAdapter,
    },
    defaultAgent: 'default',
  });

  const workflow: AutoWorkflow = {
    name: 'Test Workflow',
    target_dir: 'test/target-dir',
    steps: [
      { id: 'step1', prompt: 'mock-prompt' },
    ],
  };

  const result = await runnerWithFailingAdapter.run('mock-workflow-path', basePath, workflow.variables);

  assert.strictEqual(result.status, 'failed');
  assert(result.steps[0].error!.includes('Mock execution failed'));
});

test('should handle invalid configs gracefully', async () => {
  const workflow: AutoWorkflow = {
    name: 'Faulty Workflow',
    target_dir: 'test/target-dir',
    steps: [], // No steps provided to simulate invalid config
  };

  const result = await runner.run('mock-workflow-path', basePath, workflow.variables);

  assert.strictEqual(result.status, 'failed');
  assert.strictEqual(result.steps.length, 0);
});
