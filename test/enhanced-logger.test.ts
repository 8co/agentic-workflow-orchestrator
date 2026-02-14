import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { EnhancedLogger } from '../src/enhanced-logger.js';

test('EnhancedLogger should create instance and log info messages', () => {
  const logger = EnhancedLogger.getInstance('test.log');
  const message = 'Info level log message';
  logger.logInfo(message);

  const logDirectory = path.resolve(process.cwd(), 'logs');
  const logFilePath = path.join(logDirectory, 'test.log');
  const logContent = fs.readFileSync(logFilePath, 'utf-8');
  
  assert.match(logContent, new RegExp(`\\[INFO\\] ${message}`));
});

test('EnhancedLogger should log messages at different levels', () => {
  const logger = EnhancedLogger.getInstance('test.log');

  const messages = {
    info: 'Info message',
    warn: 'Warning message',
    error: 'Error message',
    debug: 'Debug message',
  };

  logger.logInfo(messages.info);
  logger.logWarn(messages.warn);
  logger.logError(messages.error);
  logger.logDebug(messages.debug);
  
  const logDirectory = path.resolve(process.cwd(), 'logs');
  const logFilePath = path.join(logDirectory, 'test.log');
  const logContent = fs.readFileSync(logFilePath, 'utf-8');

  Object.entries(messages).forEach(([level, message]) => {
    const regex = new RegExp(`\\[${level.toUpperCase()}\\] ${message}`);
    assert.match(logContent, regex);
  });
});

test('EnhancedLogger should handle log file write errors gracefully', () => {
  const logger = EnhancedLogger.getInstance('test-error.log');
  const message = 'This is an error handling test';

  // Temporarily make log directory unwritable
  const logDirectory = path.resolve(process.cwd(), 'logs');
  fs.chmodSync(logDirectory, '0444'); // Read-only

  try {
    logger.logError(message);
    assert.ok(true, 'Logger should not throw');
  } finally {
    // Restore directory permissions
    fs.chmodSync(logDirectory, '0755');
  }
});
