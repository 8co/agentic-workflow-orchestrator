import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatErrorMessage, logErrorDetails } from './errorUtility.js';

test('formatErrorMessage should return a user-friendly message with error details if error is an instance of Error', () => {
  const error = new Error('Sample error message');
  const userFriendlyMessage = 'Something went wrong.';
  const result = formatErrorMessage(error, userFriendlyMessage);

  assert.strictEqual(
    result, 
    `${userFriendlyMessage}\nError Details: ${error.message}`
  );
});

test('formatErrorMessage should return only user-friendly message if error is not an instance of Error', () => {
  const error = 'Non-error string';
  const userFriendlyMessage = 'Something went wrong.';
  const result = formatErrorMessage(error, userFriendlyMessage);

  assert.strictEqual(result, userFriendlyMessage);
});

test('formatErrorMessage should default to a generic message if no user-friendly message is provided', () => {
  const error = new Error('Sample error message');
  const result = formatErrorMessage(error);

  assert.strictEqual(
    result, 
    `An unexpected error occurred.\nError Details: ${error.message}`
  );
});

test('logErrorDetails should return error details with additional data when error is an instance of Error', () => {
  const error = new Error('Sample error message');
  const additionalData = { info: 'Extra information' };
  const errorDetails = logErrorDetails(error, additionalData);

  assert.strictEqual(errorDetails.message, error.message);
  assert.strictEqual(typeof errorDetails.timestamp, 'string');
  assert.strictEqual(errorDetails.stack, error.stack);
  assert.strictEqual(errorDetails.info, additionalData.info);
});

test('logErrorDetails should handle unknown error by returning appropriate message', () => {
  const error = 'Unknown error';
  const errorDetails = logErrorDetails(error);

  assert.strictEqual(errorDetails.message, 'Unknown error');
  assert.strictEqual(typeof errorDetails.timestamp, 'string');
  assert.strictEqual(errorDetails.stack, undefined);
});

test('logErrorDetails should include additional data in error details', () => {
  const error = new Error('Sample error message');
  const additionalData = { info: 'Extra information', code: 500 };
  const errorDetails = logErrorDetails(error, additionalData);

  assert.strictEqual(errorDetails.info, additionalData.info);
  assert.strictEqual(errorDetails.code, additionalData.code);
});
