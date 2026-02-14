import { test } from 'node:test';
import assert from 'node:assert';
import { initializeOrchestrationEngine } from '../src/orchestrationEngine.js';
import { loadWorkflowConfigurations } from '../src/workflowConfig.js';
import { connectToAIAgents } from '../src/aiAgents.js';
import { main } from '../src/index.js';

test('main function should call all initialization functions', () => {
  let orchestrationEngineInitialized = false;
  let workflowsLoaded = false;
  let aiAgentsConnected = false;

  function mockInitializeOrchestrationEngine() {
    orchestrationEngineInitialized = true;
  }

  function mockLoadWorkflowConfigurations() {
    workflowsLoaded = true;
  }

  function mockConnectToAIAgents() {
    aiAgentsConnected = true;
  }

  // Mock the functions
  (initializeOrchestrationEngine as unknown) = mockInitializeOrchestrationEngine;
  (loadWorkflowConfigurations as unknown) = mockLoadWorkflowConfigurations;
  (connectToAIAgents as unknown) = mockConnectToAIAgents;

  main();

  assert.strictEqual(orchestrationEngineInitialized, true, 'Orchestration engine should be initialized');
  assert.strictEqual(workflowsLoaded, true, 'Workflow configurations should be loaded');
  assert.strictEqual(aiAgentsConnected, true, 'AI agents should be connected');
});
