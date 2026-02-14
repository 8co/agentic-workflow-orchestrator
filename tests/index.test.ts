import { main } from '../src/index.js';
import assert from 'node:assert';
import test from 'node:test';

test('main function initializes without errors', async (t) => {
  // Test setup: Mock console.log to capture logs
  const logs: string[] = [];
  const originalConsoleLog = console.log;
  console.log = (message: string) => logs.push(message);

  // Mock the imported functions to ensure they are called
  let orchestrationInitialized = false;
  let configurationsLoaded = false;
  let agentsConnected = false;

  const mockInitializeOrchestrationEngine = () => {
    orchestrationInitialized = true;
  };
  
  const mockLoadWorkflowConfigurations = () => {
    configurationsLoaded = true;
  };

  const mockConnectToAIAgents = () => {
    agentsConnected = true;
  };

  // Inject mock functions
  (global as any).initializeOrchestrationEngine = mockInitializeOrchestrationEngine;
  (global as any).loadWorkflowConfigurations = mockLoadWorkflowConfigurations;
  (global as any).connectToAIAgents = mockConnectToAIAgents;

  // Execute main function
  main();

  // Assertions
  assert.strictEqual(orchestrationInitialized, true, 'Orchestration engine should be initialized');
  assert.strictEqual(configurationsLoaded, true, 'Configurations should be loaded');
  assert.strictEqual(agentsConnected, true, 'AI Agents should be connected');
  assert.strictEqual(logs[0], '🤖 Agentic Workflow Orchestrator - Starting...', 'Should log starting message');
  assert.strictEqual(logs[logs.length - 1], '✅ System initialized', 'Should log initialized message');

  // Restore original console.log
  console.log = originalConsoleLog;
});
