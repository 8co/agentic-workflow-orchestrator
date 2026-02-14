import test from 'node:test';
import assert from 'node:assert/strict';
import { connectToAIAgents } from '../src/aiAgents.js';

test('connectToAIAgents logs the correct messages', () => {
  const consoleOutput: string[] = [];
  const originalConsoleLog = console.log;
  
  console.log = (message: string): void => {
    consoleOutput.push(message);
  };

  connectToAIAgents();

  assert.strictEqual(consoleOutput.length, 2);
  assert.strictEqual(consoleOutput[0], "🔗 Connecting to AI agent APIs...");
  assert.strictEqual(consoleOutput[1], "🔗 Connected to AI agent APIs.");
  
  console.log = originalConsoleLog; // Restore original console.log
});
