import { main } from './index.js';
import assert from 'node:assert';
import test from 'node:test';

// Mock implementations for the imported functions
function mockInitializeOrchestrationEngine(shouldThrow: boolean = false) {
  return shouldThrow ? () => { throw new Error("Initialization Error") } : () => {};
}

function mockLoadWorkflowConfigurations(shouldThrow: boolean = false) {
  return shouldThrow ? () => { throw new Error("Configuration Error") } : () => {};
}

function mockConnectToAIAgents(shouldThrow: boolean = false) {
  return shouldThrow ? () => { throw new Error("Connection Error") } : () => {};
}

// Override the original implementations with the mocks for testing
await import('./orchestrationEngine.js').then(module => {
  Object.defineProperty(module, 'initializeOrchestrationEngine', {
    value: mockInitializeOrchestrationEngine(),
    writable: true
  });
});

await import('./workflowConfig.js').then(module => {
  Object.defineProperty(module, 'loadWorkflowConfigurations', {
    value: mockLoadWorkflowConfigurations(),
    writable: true
  });
});

await import('./aiAgents.js').then(module => {
  Object.defineProperty(module, 'connectToAIAgents', {
    value: mockConnectToAIAgents(),
    writable: true
  });
});

test('main function - successful initialization', () => {
  assert.doesNotThrow(() => {
    main();
  });
});

test('main function - orchestration engine error', () => {
  Object.defineProperty(import('./orchestrationEngine.js'), 'initializeOrchestrationEngine', {
    value: mockInitializeOrchestrationEngine(true)
  });

  assert.throws(() => {
    main();
  }, new Error('Initialization Error'));
});

test('main function - workflow configuration error', () => {
  Object.defineProperty(import('./workflowConfig.js'), 'loadWorkflowConfigurations', {
    value: mockLoadWorkflowConfigurations(true)
  });

  assert.throws(() => {
    main();
  }, new Error('Configuration Error'));
});

test('main function - AI agent connection error', () => {
  Object.defineProperty(import('./aiAgents.js'), 'connectToAIAgents', {
    value: mockConnectToAIAgents(true)
  });

  assert.throws(() => {
    main();
  }, new Error('Connection Error'));
});
