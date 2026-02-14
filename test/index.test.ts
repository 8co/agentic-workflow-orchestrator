import { strict as assert } from 'node:assert';
import test from 'node:test';
import { main } from '../src/index.js';
import { initializeOrchestrationEngine } from '../src/orchestrationEngine.js';
import { loadWorkflowConfigurations } from '../src/workflowConfig.js';
import { connectToAIAgents } from '../src/aiAgents.js';

test('main function - successful execution', () => {
  let logOutput: string[] = [];
  const originalLog = console.log;

  console.log = (message: string) => logOutput.push(message);

  try {
    main();
  } finally {
    console.log = originalLog; // restore the original console.log
  }

  assert.deepEqual(
    logOutput, 
    [
      '🤖 Agentic Workflow Orchestrator - Starting...',
      '✅ System initialized'
    ],
    'Log output should indicate successful start and initialization'
  );
});

test('main function - error handling in initializeOrchestrationEngine', () => {
  const originalInitialize = initializeOrchestrationEngine;
  initializeOrchestrationEngine = () => {
    throw new Error('Initialization failed');
  };

  let logOutput: string[] = [];
  const originalLog = console.error;

  console.error = (message: string) => logOutput.push(message);

  try {
    main();
  } catch (e) {
    // expecting an error
  } finally {
    console.error = originalLog;
    initializeOrchestrationEngine = originalInitialize; // restore original function
  }

  assert(logOutput.includes('Initialization failed'), 'Should log initialization error');
});

test('main function - error handling in loadWorkflowConfigurations', () => {
  const originalLoadConfig = loadWorkflowConfigurations;
  loadWorkflowConfigurations = () => {
    throw new Error('Configuration load failed');
  };

  let logOutput: string[] = [];
  const originalLog = console.error;

  console.error = (message: string) => logOutput.push(message);

  try {
    main();
  } catch (e) {
    // expecting an error
  } finally {
    console.error = originalLog;
    loadWorkflowConfigurations = originalLoadConfig; // restore original function
  }

  assert(logOutput.includes('Configuration load failed'), 'Should log configuration load error');
});

test('main function - error handling in connectToAIAgents', () => {
  const originalConnect = connectToAIAgents;
  connectToAIAgents = () => {
    throw new Error('AI Agent connection failed');
  };

  let logOutput: string[] = [];
  const originalLog = console.error;

  console.error = (message: string) => logOutput.push(message);

  try {
    main();
  } catch (e) {
    // expecting an error
  } finally {
    console.error = originalLog;
    connectToAIAgents = originalConnect; // restore original function
  }

  assert(logOutput.includes('AI Agent connection failed'), 'Should log AI agent connection error');
});
