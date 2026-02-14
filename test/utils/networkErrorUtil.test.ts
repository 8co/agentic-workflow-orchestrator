import { strict as assert } from 'node:assert';
import test from 'node:test';

import {
  isNetworkError,
  isTimeoutError,
  handleNetworkError,
  NetworkError,
  TimeoutError
} from '../../src/utils/networkErrorUtil.js';

// Define a helper function to mock console.error for testing
function mockConsoleError(fn: () => void) {
  const originalConsoleError = console.error;
  const mockLogs: string[] = [];
  console.error = (message: string) => {
    mockLogs.push(message);
  };
  fn();
  console.error = originalConsoleError;
  return mockLogs;
}

test('isNetworkError should correctly identify network errors', () => {
  const networkError: NetworkError = { statusCode: 404, message: 'Not Found' };
  const result = isNetworkError(networkError);
  assert.equal(result, true);

  const invalidError = { status: 404, msg: 'Not Found' };
  const invalidResult = isNetworkError(invalidError as unknown);
  assert.equal(invalidResult, false);
});

test('isTimeoutError should correctly identify timeout errors', () => {
  const timeoutError: TimeoutError = { timeout: 3000, message: 'Request timed out' };
  const result = isTimeoutError(timeoutError);
  assert.equal(result, true);

  const invalidError = { time: 3000, msg: 'Request timed out' };
  const invalidResult = isTimeoutError(invalidError as unknown);
  assert.equal(invalidResult, false);
});

test('handleNetworkError should log correct messages for network errors', () => {
  const networkError: NetworkError = { statusCode: 500, message: 'Internal Server Error' };
  const logs = mockConsoleError(() => handleNetworkError(networkError));
  assert.deepEqual(logs, ['Network Error: 500 - Internal Server Error']);
});

test('handleNetworkError should log correct messages for timeout errors', () => {
  const timeoutError: TimeoutError = { timeout: 10000, message: 'Timeout occurred' };
  const logs = mockConsoleError(() => handleNetworkError(timeoutError));
  assert.deepEqual(logs, ['Timeout Error: Waited 10000ms - Timeout occurred']);
});

test('handleNetworkError should log "Unknown error" for unsupported errors', () => {
  const unknownError = { code: 'ECONNREFUSED', detail: 'Connection refused' };
  const logs = mockConsoleError(() => handleNetworkError(unknownError as unknown));
  assert.deepEqual(logs, ['Unknown error:', unknownError]);
});

test('networkOperation should handle an example network operation error', async () => {
  const logs = mockConsoleError(async () => await networkOperation());
  assert.deepEqual(logs, ['Network Error: 404 - Resource not found']);
});
