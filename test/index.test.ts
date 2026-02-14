import { main } from '../src/index.js';
import assert from 'node:assert';
import { captureStderr, captureStdout } from './testUtils.js'; // Utility functions to capture console output

// Mocking imported functions
let initializeCalled = false;
let loadConfigCalled = false;
let connectCalled = false;

jest.mock('../src/orchestrationEngine.js', () => ({
  initializeOrchestrationEngine: () => {
    initializeCalled = true;
  }
}));

jest.mock('../src/workflowConfig.js', () => ({
  loadWorkflowConfigurations: () => {
    loadConfigCalled = true;
  }
}));

jest.mock('../src/aiAgents.js', () => ({
  connectToAIAgents: () => {
    connectCalled = true;
  }
}));

// Reset mock call trackers before each test
beforeEach(() => {
  initializeCalled = false;
  loadConfigCalled = false;
  connectCalled = false;
});

describe('main function', () => {

  it('should initialize all components successfully', () => {
    const output = captureStdout(main);

    assert.strictEqual(initializeCalled, true, 'Orchestration engine should be initialized');
    assert.strictEqual(loadConfigCalled, true, 'Workflow configurations should be loaded');
    assert.strictEqual(connectCalled, true, 'AI agents should be connected');

    assert.match(output, /System initialized/, 'Success message should be logged');
  });

  it('should log error if initialization fails', () => {
    const originalFn = connectToAIAgents;
    connectToAIAgents = () => {
      throw new Error('Initializaton error');
    };

    const errorOutput = captureStderr(main);

    assert.match(errorOutput, /Error during system initialization/, 'Error message should be logged');

    // Restore the original function
    connectToAIAgents = originalFn;
  });
});
