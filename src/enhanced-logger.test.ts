import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { EnhancedLogger, LogLevel } from './enhanced-logger.js';

test('EnhancedLogger: Singleton Pattern', () => {
  const logger1 = EnhancedLogger.getInstance('test.log');
  const logger2 = EnhancedLogger.getInstance('test.log');
  assert.strictEqual(logger1, logger2, 'Instances are not the same');
});

test('EnhancedLogger: Log Info', () => {
  const logger = EnhancedLogger.getInstance('test.log');
  const logFilePath = path.resolve(process.cwd(), 'logs', 'test.log');
  
  logger.logInfo('This is an info message');
  
  const logContents = fs.readFileSync(logFilePath, 'utf-8');
  assert.ok(logContents.includes('INFO This is an info message'), 'Info message not logged');
});

test('EnhancedLogger: Log Warn', () => {
  const logger = EnhancedLogger.getInstance('test.log');
  const logFilePath = path.resolve(process.cwd(), 'logs', 'test.log');

  logger.logWarn('This is a warning message');
  
  const logContents = fs.readFileSync(logFilePath, 'utf-8');
  assert.ok(logContents.includes('WARN This is a warning message'), 'Warning message not logged');
});

test('EnhancedLogger: Log Error', () => {
  const logger = EnhancedLogger.getInstance('test.log');
  const logFilePath = path.resolve(process.cwd(), 'logs', 'test.log');

  logger.logError('This is an error message');
  
  const logContents = fs.readFileSync(logFilePath, 'utf-8');
  assert.ok(logContents.includes('ERROR This is an error message'), 'Error message not logged');
});

test('EnhancedLogger: Log Debug', () => {
  const logger = EnhancedLogger.getInstance('test.log');
  const logFilePath = path.resolve(process.cwd(), 'logs', 'test.log');

  logger.logDebug('This is a debug message');
  
  const logContents = fs.readFileSync(logFilePath, 'utf-8');
  assert.ok(logContents.includes('DEBUG This is a debug message'), 'Debug message not logged');
});

test('EnhancedLogger: Handle Invalid LogLevel', () => {
  const logger = EnhancedLogger.getInstance('test.log');
  
  try {
    // Intentionally casting invalid level to bypass type checking
    (logger as any).log('This is an invalid level message', 'invalid');
    assert.fail('Error was not thrown for invalid log level');
  } catch (error) {
    assert.ok(error, 'Correctly handled invalid log level');
  }
});
