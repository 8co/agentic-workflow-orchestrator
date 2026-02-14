import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { test } from 'node:test';
import { EnhancedLogger } from '../src/enhanced-logger.js';

// Utility to mock fs methods
function mockFsMethod(method: keyof typeof fs, implementation: (...args: any[]) => any) {
  const originalMethod = (fs as any)[method];
  (fs as any)[method] = implementation;
  return () => {
    (fs as any)[method] = originalMethod;
  };
}

// Clean up log files after tests
function cleanupLogs() {
  const logDirectory = path.resolve(process.cwd(), 'logs');
  if (fs.existsSync(logDirectory)) {
    fs.rmdirSync(logDirectory, { recursive: true });
  }
}

test('should create and write to a log file successfully', () => {
  const logger = EnhancedLogger.getInstance('test.log');
  logger.logInfo('Test info message');

  const logFilePath = path.resolve(process.cwd(), 'logs', 'test.log');
  const logContents = fs.readFileSync(logFilePath, 'utf8');
  assert.match(logContents, /\[INFO\] Test info message/);
  
  cleanupLogs();
});

test('should retry and eventually succeed in logging when initial write fails', () => {
  let callCount = 0;

  const restoreAppendFileSync = mockFsMethod('appendFileSync', (filePath: string, data: string, options: { flag: string, encoding: string }) => {
    if (callCount++ < 2) {
      throw new Error('Fake write error');
    }
    return fs.appendFileSync(filePath, data, options);
  });

  const logger = EnhancedLogger.getInstance('retry-test.log');
  logger.logWarn('Test warn message');

  const logFilePath = path.resolve(process.cwd(), 'logs', 'retry-test.log');
  const logContents = fs.readFileSync(logFilePath, 'utf8');
  assert.match(logContents, /\[WARN\] Test warn message/);
  
  restoreAppendFileSync();
  cleanupLogs();
});

test('should handle failure and not crash after max retries for log writing', () => {
  mockFsMethod('appendFileSync', () => {
    throw new Error('Persistent write error');
  });

  const logger = EnhancedLogger.getInstance('fail-test.log');
  assert.doesNotThrow(() => {
    logger.logError('Test error message');
  });

  cleanupLogs();
});

test('should attempt to recover log directory on error', () => {
  const restoreMkdirSync = mockFsMethod('mkdirSync', () => {
    throw new Error('Fake mkdir error');
  });

  const logger = EnhancedLogger.getInstance('recovery-test.log');
  assert.doesNotThrow(() => {
    logger.logDebug('Test debug message');
  });

  restoreMkdirSync();
  cleanupLogs();
});
