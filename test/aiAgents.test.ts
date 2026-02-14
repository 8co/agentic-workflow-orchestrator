import { test } from 'node:test';
import assert from 'node:assert';
import { connectToAIAgents, formatError, formatErrorWithDetails, handleConnectionError, getNetworkDetails } from '../src/aiAgents.js';

test('formatError should return Error if the argument is an Error', () => {
  const error = new Error('Test error');
  const result = formatError(error);
  assert.ok(result instanceof Error);
  assert.strictEqual(result.message, 'Test error');
});

test('formatError should return Error if the argument is a string', () => {
  const result = formatError('Test error string');
  assert.ok(result instanceof Error);
  assert.strictEqual(result?.message, 'Test error string');
});

test('formatError should return null if the argument is neither an Error nor a string', () => {
  const result = formatError(12345);
  assert.strictEqual(result, null);
});

test('formatErrorWithDetails should include additional host and port details', () => {
  const error = new Error('Original error message');
  const result = formatErrorWithDetails(error, 'test-host', 8080);
  assert.ok(result instanceof Error);
  assert.strictEqual(result.message, 'Host: test-host, Port: 8080, Error: Original error message');
});

test('handleConnectionError should log error details', (t) => {
  const error = new Error('Test error for logging');
  const originalConsoleError = console.error;
  console.error = (message: string) => {
    assert.ok(message.includes('Test error for logging'));
    assert.ok(message.includes('Network Details'));
    console.error = originalConsoleError;
  };
  handleConnectionError(error);
});

test('getNetworkDetails should return network configuration details', () => {
  const networkDetails = getNetworkDetails();
  assert.ok(networkDetails);
  assert.strictEqual(typeof networkDetails, 'object');
});

// Note: Testing network connection directly in `connectToAIAgents` could require integration/server mocking.
// This is a placeholder for testing network-specific functionality.
test('connectToAIAgents handles network errors gracefully', (t, done) => {
  const originalConsoleError = console.error;
  console.error = (message: string) => {
    assert.ok(message.includes('Error connecting to AI agent APIs'));
    console.error = originalConsoleError;
    done();
  };

  // Wrap the function to catch console errors as a form of failed connection handling
  connectToAIAgents();
});
