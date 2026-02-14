import { test } from 'node:test';
import assert from 'node:assert';
import { isTimeoutError, handleNetworkError } from './networkErrorUtil.js';

test('should identify a timeout error correctly', () => {
  const error = { timeout: 5000, message: 'Request timed out' };
  assert.strictEqual(isTimeoutError(error), true);
});

test('should not identify a non-timeout error as a timeout error', () => {
  const error = { statusCode: 500, message: 'Internal Server Error' };
  assert.strictEqual(isTimeoutError(error), false);
});

test('should log correct message for a timeout error', () => {
  const error = { timeout: 3000, message: 'Connection lost' };
  const consoleSpy = {
    error: (msg: unknown) => {
      assert.strictEqual(msg, `Timeout Error: Waited 3000ms - Connection lost`);
    }
  };
  console.error = consoleSpy.error;
  handleNetworkError(error);
});

test('should handle unknown error', () => {
  const error = { unexpected: 'property' };
  const consoleSpy = {
    error: (msg: unknown, err: unknown) => {
      assert.strictEqual(msg, 'Unknown error:');
      assert.strictEqual(err, error);
    }
  };
  console.error = consoleSpy.error;
  handleNetworkError(error);
});
