import { strict as assert } from 'node:assert';
import test from 'node:test';
import { connectToAIAgents, formatError, formatErrorWithDetails, getNetworkDetails } from '../src/aiAgents.js';
import { execSync } from 'node:child_process';

test('connectToAIAgents should not throw on successful connection', () => {
  assert.doesNotThrow(() => {
    connectToAIAgents();
  }, 'connectToAIAgents threw an unexpected error on successful connection');
});

test('formatError should return an Error object for string input', () => {
  const errorMessage = 'A simple error message';
  const error = formatError(errorMessage);

  assert(error instanceof Error, 'formatError did not return an Error object');
  assert.strictEqual(error?.message, errorMessage, 'formatError returned an Error with incorrect message');
});

test('formatError should return an Error object for object with message property', () => {
  const errorObject = { message: 'An object error message' };
  const error = formatError(errorObject);

  assert(error instanceof Error, 'formatError did not return an Error object');
  assert.strictEqual(error?.message, errorObject.message, 'formatError returned an Error with incorrect message');
});

test('formatError should return null for non-object and non-string input', () => {
  assert.strictEqual(formatError(42), null, 'formatError did not return null for a non-object and non-string input');
});

test('formatErrorWithDetails should include host and port in error message', () => {
  const error = new Error('Test error');
  const host = 'localhost';
  const port = 3000;
  const detailedError = formatErrorWithDetails(error, host, port);

  assert(detailedError.message.includes(`Host: ${host}, Port: ${port}`), 'formatErrorWithDetails did not include host and port in message');
});

test('getNetworkDetails should return an object with network interfaces', () => {
  const details = getNetworkDetails();

  assert(typeof details === 'object', 'getNetworkDetails did not return an object');
});

test('checkNetworkPermissions throws if it does not have permissions', () => {
  const isRoot = execSync('id -u').toString().trim() === '0';
  if (!isRoot) {
    assert.throws(() => {
      connectToAIAgents();
    }, 'checkNetworkPermissions did not throw as expected');
  }
});
