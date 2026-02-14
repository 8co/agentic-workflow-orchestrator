import { test } from 'node:test';
import assert from 'node:assert/strict';
import { main } from './index.js';
import { initializeOrchestrationEngine } from './orchestrationEngine.js';
import { loadWorkflowConfigurations } from './workflowConfig.js';
import { connectToAIAgents } from './aiAgents.js';

// Mock the imported modules
let initializeOrchestrationEngineCalled = false;
let loadWorkflowConfigurationsCalled = false;
let connectToAIAgentsCalled = false;

function mockInitializeOrchestrationEngine() {
  initializeOrchestrationEngineCalled = true;
}

function mockLoadWorkflowConfigurations() {
  loadWorkflowConfigurationsCalled = true;
}

function mockConnectToAIAgents() {
  connectToAIAgentsCalled = true;
}

// Replace actual functions with mocks
(global as any).initializeOrchestrationEngine = mockInitializeOrchestrationEngine;
(global as any).loadWorkflowConfigurations = mockLoadWorkflowConfigurations;
(global as any).connectToAIAgents = mockConnectToAIAgents;

test('main should initialize the system correctly', () => {
  initializeOrchestrationEngineCalled = false;
  loadWorkflowConfigurationsCalled = false;
  connectToAIAgentsCalled = false;
  
  main();

  assert.ok(initializeOrchestrationEngineCalled, 'initializeOrchestrationEngine should be called');
  assert.ok(loadWorkflowConfigurationsCalled, 'loadWorkflowConfigurations should be called');
  assert.ok(connectToAIAgentsCalled, 'connectToAIAgents should be called');
});

test('main should handle errors in initializeOrchestrationEngine', () => {
  (global as any).initializeOrchestrationEngine = () => { throw new Error('Initialization Error'); };

  const consoleErrorMock = (global as any).console.error = (error: string) => {
    assert.match(error, /❌ Error during orchestration engine initialization:/, 'Error should be logged for initialization');
  };
  
  main();

  assert.strictEqual(loadWorkflowConfigurationsCalled, false, 'loadWorkflowConfigurations should not be called');
  assert.strictEqual(connectToAIAgentsCalled, false, 'connectToAIAgents should not be called');

  // Restore the original function
  console.error = consoleErrorMock;
});

test('main should handle errors in loadWorkflowConfigurations', () => {
  (global as any).initializeOrchestrationEngine = mockInitializeOrchestrationEngine;
  (global as any).loadWorkflowConfigurations = () => { throw new Error('Configuration Error'); };

  const consoleErrorMock = (global as any).console.error = (error: string) => {
    assert.match(error, /❌ Error during workflow configurations loading:/, 'Error should be logged for configuration loading');
  };
  
  main();

  assert.strictEqual(connectToAIAgentsCalled, false, 'connectToAIAgents should not be called');

  // Restore the original function
  console.error = consoleErrorMock;
});

test('main should handle errors in connectToAIAgents', () => {
  (global as any).initializeOrchestrationEngine = mockInitializeOrchestrationEngine;
  (global as any).loadWorkflowConfigurations = mockLoadWorkflowConfigurations;
  (global as any).connectToAIAgents = () => { throw new Error('Connection Error'); };

  const consoleErrorMock = (global as any).console.error = (error: string) => {
    assert.match(error, /❌ Error during AI agents connection:/, 'Error should be logged for AI agents connection');
  };
  
  main();

  // Restore the original function
  console.error = consoleErrorMock;
});
