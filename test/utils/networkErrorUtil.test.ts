import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { isNetworkError } from '../../src/utils/networkErrorUtil.js';
import type { NetworkError } from '../../src/utils/networkErrorUtil.js';

// File is in strict mode; all possible types of NetworkError must be explicitly handled

test('NetworkError with code ENOTFOUND', () => {
  const error: NetworkError = { code: 'ENOTFOUND' };
  assert.equal(isNetworkError(error), true);
});

test('NetworkError with code ECONNREFUSED', () => {
  const error: NetworkError = { code: 'ECONNREFUSED' };
  assert.equal(isNetworkError(error), true);
});

test('NetworkError with code ECONNRESET', () => {
  const error: NetworkError = { code: 'ECONNRESET' };
  assert.equal(isNetworkError(error), true);
});

test('NetworkError with code ETIMEDOUT', () => {
  const error: NetworkError = { code: 'ETIMEDOUT' };
  assert.equal(isNetworkError(error), true);
});

test('NetworkError with code EHOSTUNREACH', () => {
  const error: NetworkError = { code: 'EHOSTUNREACH' };
  assert.equal(isNetworkError(error), true);
});

test('NetworkError with code EPIPE', () => {
  const error: NetworkError = { code: 'EPIPE' };
  assert.equal(isNetworkError(error), true);
});

test('NetworkError with code ENETUNREACH', () => {
  const error: NetworkError = { code: 'ENETUNREACH' };
  assert.equal(isNetworkError(error), true);
});

test('NetworkError with timeout true', () => {
  const error: NetworkError = { timeout: true };
  assert.equal(isNetworkError(error), true);
});

test('NetworkError with missing code and timeout', () => {
  const error: NetworkError = {};
  assert.equal(isNetworkError(error), false);
});

test('Non-network error object', () => {
  const error = { message: 'Some error' };
  assert.equal(isNetworkError(error), false);
});

test('Primitive value as error', () => {
  assert.equal(isNetworkError(null), false);
  assert.equal(isNetworkError(undefined), false);
  assert.equal(isNetworkError(42), false);
  assert.equal(isNetworkError('Error'), false);
  assert.equal(isNetworkError(true), false);
  assert.equal(isNetworkError(false), false);
});

test('NetworkError with invalid code', () => {
  const error = { code: 'INVALID_CODE' as any };  // Casting to bypass strict check for test purposes
  assert.equal(isNetworkError(error), false);
});
