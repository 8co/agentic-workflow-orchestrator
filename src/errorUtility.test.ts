import assert from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { promises as fs } from 'node:fs';
import { formatErrorMessage, logErrorDetails } from './errorUtility.js';

describe('Error Utility', () => {
  const errorLogPath = 'error.log';

  beforeEach(async () => {
    await fs.writeFile(errorLogPath, '', 'utf-8');
  });

  afterEach(async () => {
    await fs.unlink(errorLogPath);
  });

  describe('formatErrorMessage', () => {
    it('should format message for standard Error', () => {
      const error = new Error('An error occurred');
      const formattedMessage = formatErrorMessage(error, 'Oops!');
      assert.strictEqual(formattedMessage, 'Oops!\nError Details: An error occurred');
    });

    it('should return user-friendly message if error is unknown', () => {
      const formattedMessage = formatErrorMessage('unknown error', 'Oops!');
      assert.strictEqual(formattedMessage, 'Oops!');
    });

    it('should use default user-friendly message if none is provided', () => {
      const error = new Error('An error occurred');
      const formattedMessage = formatErrorMessage(error);
      assert.strictEqual(formattedMessage, 'An unexpected error occurred.\nError Details: An error occurred');
    });
  });

  describe('logErrorDetails', () => {
    it('should log error details for a standard Error', async () => {
      const error = new Error('Test error');
      const details = logErrorDetails(error, { customField: 'testValue' });

      assert.strictEqual(details.message, 'Test error');
      assert.strictEqual(details.customField, 'testValue');
      assert.ok(details.timestamp);

      const logContent = await fs.readFile(errorLogPath, 'utf-8');
      assert.ok(logContent.includes('Test error'));
      assert.ok(logContent.includes('customField'));
    });

    it('should handle logging unknown error types', async () => {
      const details = logErrorDetails('unknown error type', { level: 'critical' });

      assert.strictEqual(details.message, 'Unknown error');
      assert.strictEqual(details.level, 'critical');
      assert.ok(details.timestamp);

      const logContent = await fs.readFile(errorLogPath, 'utf-8');
      assert.ok(logContent.includes('Unknown error'));
      assert.ok(logContent.includes('critical'));
    });

    it('should handle writing error to file even if file writing fails', async () => {
      await fs.chmod(errorLogPath, 0o000); // Change permissions to simulate write failure

      const error = new Error('Test error');
      logErrorDetails(error);

      await fs.chmod(errorLogPath, 0o666); // Restore write permissions
    });
  });
});
