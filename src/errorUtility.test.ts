import { test } from 'node:test';
import assert from 'node:assert';
import { formatErrorMessage, logErrorDetails } from './errorUtility.js';

test('formatErrorMessage with Error instance', () => {
  const error = new Error('Test error');
  const result = formatErrorMessage(error, 'A user-friendly error occurred.');
  assert.strictEqual(result, 'A user-friendly error occurred.\nError Details: Test error');
});

test('formatErrorMessage with non-Error object', () => {
  const result = formatErrorMessage({ some: 'object' }, 'Default error message.');
  assert.strictEqual(result, 'Default error message.');
});

test('formatErrorMessage with null', () => {
  const result = formatErrorMessage(null, 'Null input encountered.');
  assert.strictEqual(result, 'Null input encountered.');
});

test('logErrorDetails with Error instance', () => {
  const error = new Error('Test error');
  const errorDetails = logErrorDetails(error);

  assert.strictEqual(typeof errorDetails.timestamp, 'string');
  assert.strictEqual(errorDetails.message, 'Test error');
  assert.ok(typeof errorDetails.stack === 'string');
});

test('logErrorDetails with additional data', () => {
  const error = new Error('Test error');
  const additionalData = { code: 500, context: 'UnitTest' };
  const errorDetails = logErrorDetails(error, additionalData);

  assert.strictEqual(errorDetails.message, 'Test error');
  assert.strictEqual(errorDetails.code, 500);
  assert.strictEqual(errorDetails.context, 'UnitTest');
});

test('logErrorDetails with non-Error object', () => {
  const errorDetails = logErrorDetails('string error', { some: 'data' });

  assert.strictEqual(errorDetails.message, 'Unknown error');
  assert.strictEqual(typeof errorDetails.timestamp, 'string');
  assert.strictEqual(errorDetails.stack, undefined);
  assert.strictEqual(errorDetails.some, 'data');
});

test('logErrorDetails with null', () => {
  const errorDetails = logErrorDetails(null);

  assert.strictEqual(errorDetails.message, 'Unknown error');
  assert.strictEqual(typeof errorDetails.timestamp, 'string');
  assert.strictEqual(errorDetails.stack, undefined);
});
