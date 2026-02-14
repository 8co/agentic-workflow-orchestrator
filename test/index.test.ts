import { main } from '../src/index.js';
import { strict as assert } from 'node:assert';
import { test, beforeEach } from 'node:test';

import * as orchestrationEngine from '../src/orchestrationEngine.js';
import * as workflowConfig from '../src/workflowConfig.js';
import * as aiAgents from '../src/aiAgents.js';

let consoleLogSpy: jest.SpyInstance;
let consoleErrorSpy: jest.SpyInstance;

beforeEach(() => {
  consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  jest.spyOn(orchestrationEngine, 'initializeOrchestrationEngine');
  jest.spyOn(workflowConfig, 'loadWorkflowConfigurations');
  jest.spyOn(aiAgents, 'connectToAIAgents');
});

test('main initializes all components successfully', () => {
  orchestrationEngine.initializeOrchestrationEngine.mockImplementation(() => {});
  workflowConfig.loadWorkflowConfigurations.mockImplementation(() => {});
  aiAgents.connectToAIAgents.mockImplementation(() => {});

  main();
  
  assert.ok(orchestrationEngine.initializeOrchestrationEngine.mock.calls.length > 0, 'initializeOrchestrationEngine should be called');
  assert.ok(workflowConfig.loadWorkflowConfigurations.mock.calls.length > 0, 'loadWorkflowConfigurations should be called');
  assert.ok(aiAgents.connectToAIAgents.mock.calls.length > 0, 'connectToAIAgents should be called');
  
  assert(consoleLogSpy.mock.calls.some(call => call[0] === '✅ System initialized'), 'System initialized message should be logged');
});

test('main handles initialization error', () => {
  const error = new Error('Initialization failed');
  orchestrationEngine.initializeOrchestrationEngine.mockImplementation(() => { throw error; });

  main();

  assert(consoleErrorSpy.mock.calls.some(call => call[0] === '❌ Error during system initialization:' && call[1] === error), 'Error during system initialization should be logged');
});

afterEach(() => {
  jest.restoreAllMocks();
});
