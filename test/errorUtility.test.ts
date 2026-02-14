import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { formatErrorMessage, logErrorDetails } from '../src/errorUtility.js';
import { unlink } from 'node:fs/promises';

test('formatErrorMessage with Error object', () => {
  const error = new Error('Test error');
  const userFriendlyMessage = 'A user-friendly message.';
  const formattedMessage = formatErrorMessage(error, userFriendlyMessage);

  assert.strictEqual(
    formattedMessage,
    `${userFriendlyMessage}\nError Details: ${error.message}`
  );
});

test('formatErrorMessage with non-Error object', () => {
  const userFriendlyMessage = 'A user-friendly message.';
  const formattedMessage = formatErrorMessage('Non-error object', userFriendlyMessage);

  assert.strictEqual(formattedMessage, userFriendlyMessage);
});

test('logErrorDetails with Error object', async () => {
  const error = new Error('Test error');
  const additionalData = { user: 'testUser' };
  const errorDetails = logErrorDetails(error, additionalData);

  assert.strictEqual(errorDetails.message, error.message);
  assert(errorDetails.stack !== undefined);
  assert(errorDetails.timestamp !== undefined);
  assert.strictEqual(errorDetails.user, additionalData.user);

  // Clean up log file
  await unlink('error.log');
});

test('logErrorDetails with non-Error object', async () => {
  const additionalData = { operation: 'testOperation' };
  const errorDetails = logErrorDetails('Non-error object', additionalData);

  assert.strictEqual(errorDetails.message, 'Unknown error');
  assert.strictEqual(errorDetails.stack, undefined);
  assert(errorDetails.timestamp !== undefined);
  assert.strictEqual(errorDetails.operation, additionalData.operation);

  // Clean up log file
  await unlink('error.log');
});
