import { isNetworkError } from '../../src/utils/networkErrorUtil.js';
import assert from 'node:assert';
import test from 'node:test';

test('isNetworkError should return true for network error codes', () => {
  assert.strictEqual(isNetworkError({ code: 'ENOTFOUND' }), true);
  assert.strictEqual(isNetworkError({ code: 'ECONNREFUSED' }), true);
  assert.strictEqual(isNetworkError({ code: 'ECONNRESET' }), true);
  assert.strictEqual(isNetworkError({ code: 'ETIMEDOUT' }), true);
  assert.strictEqual(isNetworkError({ code: 'EHOSTUNREACH' }), true);
  assert.strictEqual(isNetworkError({ code: 'EPIPE' }), true);
  assert.strictEqual(isNetworkError({ code: 'ENETUNREACH' }), true);
});

test('isNetworkError should return true for timeout errors', () => {
  assert.strictEqual(isNetworkError({ timeout: true }), true);
});

test('isNetworkError should return false for non-network error codes', () => {
  assert.strictEqual(isNetworkError({ code: 'ENOENT' }), false);
  assert.strictEqual(isNetworkError({ code: 'EACCES' }), false);
});

test('isNetworkError should return false for non-object or null inputs', () => {
  assert.strictEqual(isNetworkError(null), false);
  assert.strictEqual(isNetworkError(undefined), false);
  assert.strictEqual(isNetworkError(123), false);
  assert.strictEqual(isNetworkError('error'), false);
  assert.strictEqual(isNetworkError(true), false);
  assert.strictEqual(isNetworkError(false), false);
});

test('isNetworkError should return false for objects without error codes or timeout', () => {
  assert.strictEqual(isNetworkError({}), false);
  assert.strictEqual(isNetworkError({ foo: 'bar' }), false);
});
