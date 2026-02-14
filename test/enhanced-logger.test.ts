import { EnhancedLogger } from '../src/enhanced-logger';
import assert from 'node:assert';
import { test } from 'node:test';

// Test suite for the EnhancedLogger
test('EnhancedLogger Singleton Test', (t) => {
  const logger1 = EnhancedLogger.getInstance();
  const logger2 = EnhancedLogger.getInstance();

  assert.strictEqual(logger1, logger2, 'getInstance should return a singleton instance');
});

test('Logging Methods Test - Console and File', (t) => {
  const logger = EnhancedLogger.getInstance('test.log');

  // Mock console and file system methods
  const originalConsoleInfo = console.info;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  const originalConsoleDebug = console.debug;

  console.info = function(message: string) {
    assert.match(message, /\[INFO\] Test message/, 'Info log should be called with the correct message');
  };
  
  console.warn = function(message: string) {
    assert.match(message, /\[WARN\] Test message/, 'Warning log should be called with the correct message');
  };
  
  console.error = function(message: string) {
    assert.match(message, /\[ERROR\] Test message/, 'Error log should be called with the correct message');
  };
  
  console.debug = function(message: string) {
    assert.match(message, /\[DEBUG\] Test message/, 'Debug log should be called with the correct message');
  };

  const logFilePath = `logs/test.log`;
  const originalAppendFileSync = fs.appendFileSync;
  fs.appendFileSync = function(filePath: fs.PathLike | fd: fs-like, data: string | Uint8Array, options?: fs.WriteFileOptions): void {
    assert.strictEqual(filePath, logFilePath, 'Log should be written to the correct file path');
  };

  // Test each logging level
  logger.logInfo('Test message');
  logger.logWarn('Test message');
  logger.logError('Test message');
  logger.logDebug('Test message');

  // Restore the original methods
  console.info = originalConsoleInfo;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
  console.debug = originalConsoleDebug;
  fs.appendFileSync = originalAppendFileSync;
});

test('Error Handling Test', (t) => {
  const logger = EnhancedLogger.getInstance('invalid_path/test.log');

  // Mock console error method
  const originalConsoleError = console.error;
  console.error = function(message: string) {
    assert.match(message, /\[ERROR\] Failed to write to log file/, 'Should log error message about failed file write');
  };

  // Mock fs methods to simulate directory and file errors
  const originalMkdirSync = fs.mkdirSync;
  const originalExistSync = fs.existsSync;
  fs.mkdirSync = function() {
    throw new Error('Mock mkdir error');
  };
  fs.existsSync = function() {
    return false;
  };

  try {
    logger.logInfo('Test message that will fail');
  } finally {
    // Restore the original methods
    fs.mkdirSync = originalMkdirSync;
    fs.existsSync = originalExistSync;
    console.error = originalConsoleError;
  }
});
