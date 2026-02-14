import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createAutonomousRunner } from '../src/autonomous-runner.js';
import type { AgentAdapter, AgentType } from '../src/types.js';

// Mock dependencies
const mockAdapter: AgentAdapter = {
  execute: async () => ({ success: true, output: '```typescript:path/to/file.ts\nconsole.log("Hello World");\n```' })
};

const mockDeps = {
  adapters: {
    mockAgent: mockAdapter
  },
  defaultAgent: 'mockAgent' as AgentType
};

// Setup
const runner = createAutonomousRunner(mockDeps);

describe('Autonomous Runner', () => {
  // Reset the execution environment before each test
  beforeEach(() => {
    // You can add setup code here if necessary for each test
  });

  test('should handle empty workflow', async () => {
    const workflowPath = 'path/to/empty-workflow.yml';
    const basePath = 'path/to/base';
    const result = await runner.run(workflowPath, basePath);
    assert.strictEqual(result.steps.length, 0);
    assert.strictEqual(result.status, 'completed');
  });

  test('should handle workflow with invalid steps', async () => {
    const workflowPath = 'path/to/invalid-steps-workflow.yml';
    const basePath = 'path/to/base';
    const result = await runner.run(workflowPath, basePath);
    assert.strictEqual(result.steps.length, 0);  // Assuming it skips invalid steps
    assert.strictEqual(result.status, 'completed');
  });

  test('should complete with valid steps', async () => {
    const workflowPath = 'path/to/valid-workflow.yml';
    const basePath = 'path/to/base';
    const overrides = { someVar: 'overrideValue' };
    const result = await runner.run(workflowPath, basePath, overrides);
    assert.ok(result.steps.length > 0);
    assert.strictEqual(result.status, 'completed');
  });

  test('should return failed status when step execution fails', async () => {
    const failingMockAdapter: AgentAdapter = {
      execute: async () => ({ success: false, output: '', error: 'Execution failed' })
    };

    const failingDeps = {
      adapters: {
        mockAgent: failingMockAdapter
      },
      defaultAgent: 'mockAgent' as AgentType
    };

    const failingRunner = createAutonomousRunner(failingDeps);
    const workflowPath = 'path/to/failing-workflow.yml';
    const basePath = 'path/to/base';
    const result = await failingRunner.run(workflowPath, basePath);
    assert.strictEqual(result.status, 'failed');
    assert.ok(result.steps.some(step => step.status === 'failed'));
  });
});
