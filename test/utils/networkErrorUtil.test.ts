import { strict as assert } from 'node:assert';
import test from 'node:test';
import { isNetworkError, isTimeoutError, handleNetworkError, networkOperation, NetworkError, TimeoutError } from '../../src/utils/networkErrorUtil.js';

// Mock console.error to capture log outputs for assertions
let consoleOutput: string[] = [];
const mockedError = (output: string) => consoleOutput.push(output);
console.error = mockedError;

test('isNetworkError should correctly identify a valid NetworkError', () => {
  const error: NetworkError = { statusCode: 404, message: 'Not Found' };
  assert.equal(isNetworkError(error), true);
});

test('isNetworkError should return false for invalid NetworkError objects', () => {
  assert.equal(isNetworkError({ statusCode: '404', message: 'Not Found' }), false);
  assert.equal(isNetworkError({ statusCode: 404 }), false);
  assert.equal(isNetworkError({ message: 'Not Found' }), false);
  assert.equal(isNetworkError(null), false);
});

test('isTimeoutError should correctly identify a valid TimeoutError', () => {
  const error: TimeoutError = { timeout: 1000, message: 'Request timed out' };
  assert.equal(isTimeoutError(error), true);
});

test('isTimeoutError should return false for invalid TimeoutError objects', () => {
  assert.equal(isTimeoutError({ timeout: '1000', message: 'Request timed out' }), false);
  assert.equal(isTimeoutError({ timeout: 1000 }), false);
  assert.equal(isTimeoutError({ message: 'Request timed out' }), false);
  assert.equal(isTimeoutError(null), false);
});

test('handleNetworkError should log the correct message for NetworkError', () => {
  consoleOutput = [];
  const error: NetworkError = { statusCode: 404, message: 'Not Found' };
  handleNetworkError(error);
  assert.deepEqual(consoleOutput, ['Network Error: 404 - Not Found']);
});

test('handleNetworkError should log the correct message for TimeoutError', () => {
  consoleOutput = [];
  const error: TimeoutError = { timeout: 1000, message: 'Request timed out' };
  handleNetworkError(error);
  assert.deepEqual(consoleOutput, ['Timeout Error: Waited 1000ms - Request timed out']);
});

test('handleNetworkError should log "Unknown error" message for unknown errors', () => {
  consoleOutput = [];
  handleNetworkError({ error: 'unknown' });
  assert.deepEqual(consoleOutput, ['Unknown error:', { error: 'unknown' }]);
});

test('networkOperation should log the correct error message', async () => {
  consoleOutput = [];
  await networkOperation();
  assert.deepEqual(consoleOutput, ['Network Error: 404 - Resource not found']);
});
