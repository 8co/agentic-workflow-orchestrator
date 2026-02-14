import { test } from 'node:test';
import assert from 'node:assert';
import { isNetworkError } from '../../src/utils/networkErrorUtil.js';

test('isNetworkError identifies network errors with code ENOTFOUND', () => {
  const error = { code: 'ENOTFOUND' };
  assert.strictEqual(isNetworkError(error), true);
});

test('isNetworkError returns false for null input', () => {
  const error = null;
  assert.strictEqual(isNetworkError(error), false);
});

test('isNetworkError returns false for non-object input', () => {
  const error = 'string';
  assert.strictEqual(isNetworkError(error), false);
});

test('isNetworkError returns false for objects without code property', () => {
  const error = { message: 'Not found' };
  assert.strictEqual(isNetworkError(error), false);
});

test('isNetworkError returns false for objects with non-ENOTFOUND code', () => {
  const error = { code: 'ECONNREFUSED' };
  assert.strictEqual(isNetworkError(error), false);
});

test('isNetworkError returns false for empty object', () => {
  const error = {};
  assert.strictEqual(isNetworkError(error), false);
});
