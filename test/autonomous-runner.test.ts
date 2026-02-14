import assert from 'node:assert';
import { test } from 'node:test';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { createAutonomousRunner, AutoRunnerDeps } from '../src/autonomous-runner.js';
import type { AgentAdapter, AgentRequest } from '../src/types.js';

const mockAdapter: AgentAdapter = {
  execute: async (_request: AgentRequest) => ({
    success: true,
    output: "```typescript:path/to/file.ts\nconsole.log('Hello World');\n```",
  }),
};

const mockVerifyRunner = {
  runVerification: async () => ({
    allPassed: true,
  }),
  defaultVerifyCommands: () => [],
};

const mockGitOps = {
  commitChanges: async () => ({ success: true }),
  revertChanges: async () => {},
  hasChanges: async () => false,
  getChangedFiles: async () => [],
  getCurrentBranch: async () => 'main',
  createBranch: async () => ({ success: true }),
};

const mockDeps: AutoRunnerDeps = {
  adapters: { 'default': mockAdapter },
  defaultAgent: 'default',
  ...mockVerifyRunner,
  ...mockGitOps,
};

test('createAutonomousRunner: should load a valid workflow and execute successfully', async () => {
  const runner = createAutonomousRunner(mockDeps);
  const basePath = resolve(process.cwd(), 'test_fixtures');
  const workflowPath = 'valid-workflow.yaml';
  const loadWorkflow = async () => ({
    name: 'Test Workflow',
    target_dir: './',
    steps: [{ id: 'step1', prompt: 'Prompt', max_attempts: 1 }],
  });

  runner.loadWorkflow = loadWorkflow; // Overriding the loadWorkflow function
  const result = await runner.run(workflowPath, basePath);

  assert.equal(result.status, 'completed');
  assert.equal(result.steps.length, 1);
  assert.equal(result.steps[0].status, 'completed');
});

test('createAutonomousRunner: should handle failed verification and retry', async () => {
  const failingDeps = {
    ...mockDeps,
    runVerification: async () => ({ allPassed: false, errorSummary: 'Verification failed' }),
  };

  const runner = createAutonomousRunner(failingDeps);
  const basePath = resolve(process.cwd(), 'test_fixtures');
  const workflowPath = 'valid-workflow.yaml';
  const loadWorkflow = async () => ({
    name: 'Test Workflow',
    target_dir: './',
    steps: [{ id: 'step1', prompt: 'Prompt', max_attempts: 2 }],
  });

  runner.loadWorkflow = loadWorkflow;
  const result = await runner.run(workflowPath, basePath);

  assert.equal(result.status, 'failed');
  assert.equal(result.steps.length, 1);
  assert.equal(result.steps[0].status, 'failed');
  assert.equal(result.steps[0].attempts, 2);
});

test('createAutonomousRunner: should handle adapter failure with no output', async () => {
  const failingAdapter: AgentAdapter = {
    execute: async () => ({ success: false, error: 'Adapter error' }),
  };

  const failingDeps = {
    ...mockDeps,
    adapters: { 'default': failingAdapter },
  };

  const runner = createAutonomousRunner(failingDeps);
  const basePath = resolve(process.cwd(), 'test_fixtures');
  const workflowPath = 'valid-workflow.yaml';
  const loadWorkflow = async () => ({
    name: 'Test Workflow',
    target_dir: './',
    steps: [{ id: 'step1', prompt: 'Prompt', max_attempts: 2 }],
  });

  runner.loadWorkflow = loadWorkflow;
  const result = await runner.run(workflowPath, basePath);

  assert.equal(result.status, 'failed');
  assert.equal(result.steps.length, 1);
  assert.equal(result.steps[0].status, 'failed');
  assert.equal(result.steps[0].error, 'Adapter error');
});
