import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatErrorMessage } from './errorUtility.js';

describe('formatErrorMessage', () => {
  it('should return the user-friendly message followed by error details if error is an instance of Error', () => {
    const error = new Error('Test error');
    const userFriendlyMessage = 'A friendly message';
    const result = formatErrorMessage(error, userFriendlyMessage);
    assert.strictEqual(result, `${userFriendlyMessage}\nError Details: ${error.message}`);
  });

  it('should return only the user-friendly message if error is not an instance of Error', () => {
    const error = { unknown: 'object' };
    const userFriendlyMessage = 'A friendly message';
    const result = formatErrorMessage(error, userFriendlyMessage);
    assert.strictEqual(result, userFriendlyMessage);
  });

  it('should return the default message if user-friendly message is not provided and error is not an instance of Error', () => {
    const error = { unknown: 'object' };
    const result = formatErrorMessage(error);
    assert.strictEqual(result, 'An unexpected error occurred.');
  });

  it('should return the default user-friendly message followed by error details when error is an instance of Error and no message is provided', () => {
    const error = new Error('Test error');
    const result = formatErrorMessage(error);
    assert.strictEqual(result, `An unexpected error occurred.\nError Details: ${error.message}`);
  });

  it('should work with actual Error instances containing stack traces', () => {
    const error = new Error('Another test error');
    const customMessage = 'Custom message';
    const result = formatErrorMessage(error, customMessage);
    assert.strictEqual(result, `${customMessage}\nError Details: ${error.message}`);
  });
});
