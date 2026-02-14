import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { networkInterfaces } from 'os';
import { connectToAIAgents, formatError, getNetworkDetails, handleConnectionError } from '../src/aiAgents.js';

test('connectToAIAgents should handle connection errors', () => {
  assert.doesNotThrow(() => {
    connectToAIAgents();
  }, 'connectToAIAgents should not throw an unhandled exception');
});

test('formatError returns a formatted error for Error instance', () => {
  const error = new Error('Test error');
  assert.deepEqual(formatError(error), error, 'formatError should return the error as is if it is an instance of Error');
});

test('formatError returns a formatted error for string error', () => {
  const error = 'Test error string';
  const result = formatError(error);
  assert(result instanceof Error, 'formatError should return an Error instance for a string input');
  assert.equal(result?.message, error, 'formatError should preserve the error message');
});

test('formatError returns null for unknown error types', () => {
  const error = 12345; // Not an Error instance or string
  assert.equal(formatError(error), null, 'formatError should return null for non-Error, non-string error types');
});

test('handleConnectionError logs error details', () => {
  const originalConsoleError = console.error;
  console.error = (message: string) => {
    assert(message.includes('❌ Error connecting to AI agent APIs:'), 'Error message should start with known error message');
    assert(message.includes('Stack trace:'), 'Error message should include stack trace');
    assert(message.includes('Network Details:'), 'Error message should include network details');
  };
  
  handleConnectionError(new Error('Simulated error'));
  
  console.error = originalConsoleError;
});

test('getNetworkDetails returns correct network details', () => {
  const originalNetworkInterfaces = networkInterfaces;
  networkInterfaces = () => ({
    lo: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
    eth0: [{ address: '192.168.1.1', family: 'IPv4', internal: false }],
  });
  
  const result = getNetworkDetails();
  assert.deepEqual(result, { eth0: ['192.168.1.1'] }, 'getNetworkDetails should only return non-internal IPv4 addresses');

  networkInterfaces = originalNetworkInterfaces;
});
