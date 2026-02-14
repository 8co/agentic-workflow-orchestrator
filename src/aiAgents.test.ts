// Import the necessary modules for testing
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectToAIAgents } from './aiAgents.js';

// Mock console.error to capture error messages
const originalConsoleError = console.error;
let consoleErrorOutput: string[] = [];

console.error = (message: string) => {
  consoleErrorOutput.push(message);
};

test('connectToAIAgents should log an error with network details on connection failure', () => {
  consoleErrorOutput = []; // Reset consoleErrorOutput
  connectToAIAgents();

  // Check that the error message was logged
  assert(consoleErrorOutput.length > 0, 'Expected error message to be logged');
  const loggedMessage = consoleErrorOutput.join('\n');
  assert.match(loggedMessage, /❌ Error connecting to AI agent APIs: Simulation of a connection error\./);
  assert.match(loggedMessage, /Stack trace:/);
  assert.match(loggedMessage, /Network Details: \{.*\}/);
});

// Restore original console.error
console.error = originalConsoleError;
