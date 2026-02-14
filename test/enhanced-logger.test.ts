import { strict as assert } from 'node:assert';
import test from 'node:test';
import fs from 'fs';
import path from 'path';
import { EnhancedLogger } from '../src/enhanced-logger.js';

test('EnhancedLogger retry mechanism works correctly', async (t) => {
  // Setup
  const logger = EnhancedLogger.getInstance('test.log');
  const logFilePath = path.resolve(process.cwd(), 'logs', 'test.log');
  let appendFileSyncOriginal = fs.appendFileSync;

  // Cleanup
  if (fs.existsSync(logFilePath)) {
    fs.unlinkSync(logFilePath);
  }

  // Test retry mechanism
  await t.test('Should retry when appendFileSync throws an error', (t) => {
    let attempt = 0;

    fs.appendFileSync = () => {
      attempt++;
      throw new Error('Simulated write error');
    };

    logger.logInfo('Test message');

    // Recover original appendFileSync
    fs.appendFileSync = appendFileSyncOriginal;

    assert.equal(attempt, logger.maxRetries, 'Logger should retry the correct number of times');
  });

  // Test successfully writing a message after retries
  await t.test('Should successfully write after retries', (t) => {
    fs.appendFileSync = function appendFileSyncMock(filePath, data, options) {
      if (attempt === 1) {
        throw new Error('Simulated write error on first attempt');
      }

      appendFileSyncOriginal(filePath, data, options);
    };

    logger.logInfo('Message after retry');

    // Recover original appendFileSync
    fs.appendFileSync = appendFileSyncOriginal;

    const logFileContent = fs.readFileSync(logFilePath, 'utf8');
    assert.match(logFileContent, /Message after retry/, 'The message should be written successfully after retry');
  });
});
