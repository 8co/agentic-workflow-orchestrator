import { main } from '../src/index.js';
import assert from 'node:assert';
import { test } from 'node:test';

test('main function should call initializeOrchestrationEngine, loadWorkflowConfigurations, and connectToAIAgents', () => {
  let orchestrationInitialized = false;
  let configurationsLoaded = false;
  let aiAgentsConnected = false;

  // Mock functions
  const initializeOrchestrationEngine = () => { orchestrationInitialized = true; };
  const loadWorkflowConfigurations = () => { configurationsLoaded = true; };
  const connectToAIAgents = () => { aiAgentsConnected = true; };

  // Inject mocks
  const rewire = require('rewire');
  const index = rewire('../src/index.js');
  index.__set__('initializeOrchestrationEngine', initializeOrchestrationEngine);
  index.__set__('loadWorkflowConfigurations', loadWorkflowConfigurations);
  index.__set__('connectToAIAgents', connectToAIAgents);

  // Invoke the main function
  main();

  // Assert whether each function was called
  assert.strictEqual(orchestrationInitialized, true, 'initializeOrchestrationEngine should be called');
  assert.strictEqual(configurationsLoaded, true, 'loadWorkflowConfigurations should be called');
  assert.strictEqual(aiAgentsConnected, true, 'connectToAIAgents should be called');
});
