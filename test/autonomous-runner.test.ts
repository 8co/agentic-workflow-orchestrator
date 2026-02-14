import { strict as assert } from 'node:assert';
import { createAutonomousRunner, AutoStep, AutoWorkflow } from '../src/autonomous-runner.js';
import type { AgentAdapter, AgentRequest } from '../src/types.js';

const mockAdapter: AgentAdapter = {
  execute: async (request: AgentRequest) => ({ success: false, error: 'Mock error', output: undefined })
};

const mockDeps = {
  adapters: {
    mockAgent: mockAdapter
  },
  defaultAgent: 'mockAgent'
};

const runner = createAutonomousRunner(mockDeps);

async function testExecuteStepRetries() {
  const workflow: AutoWorkflow = {
    name: 'Test Workflow',
    target_dir: 'test-dir',
    steps: [{
      id: 'step1',
      prompt: 'mock-prompt',
      max_attempts: 5
    }],
    steps: []
  };

  const step: AutoStep = workflow.steps[0];
  const result = await runner.run('workflowPath','basePath');

  assert.equal(result.steps[0].attempts, 5, 'Expected 5 attempts for the execution step');
  assert.equal(result.steps[0].status, 'failed', 'Expected step execution to fail');
  assert.equal(result.steps[0].error, 'LLM returned no output', 'Expected a specific error message');
}

testExecuteStepRetries().then(() => {
  console.log('Test for executeStep retry logic passed.');
}).catch(err => {
  console.error('Test for executeStep retry logic failed:', err);
});
