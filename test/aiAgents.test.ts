import { strict as assert } from 'node:assert';
import test from 'node:test';
import { connectToAIAgents } from '../src/aiAgents.js';

// Mock `console.log` to verify logging output
function mockConsoleLog() {
  const originalConsoleLog = console.log;
  const logMessages: string[] = [];
  console.log = (message: string) => {
    logMessages.push(message);
  };
  return {
    getLogMessages(): string[] {
      return logMessages;
    },
    reset() {
      console.log = originalConsoleLog;
    }
  };
}

test('connectToAIAgents - should log connection messages', (t) => {
  const consoleMock = mockConsoleLog();

  connectToAIAgents();

  const logMessages = consoleMock.getLogMessages();
  consoleMock.reset();

  assert.strictEqual(logMessages.length, 2);
  assert.strictEqual(logMessages[0], '🔗 Connecting to AI agent APIs...');
  assert.strictEqual(logMessages[1], '🔗 Connected to AI agent APIs.');
});
