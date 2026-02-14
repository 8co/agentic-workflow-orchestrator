import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { EnhancedLogger } from '../src/enhanced-logger.js';

// Mock the console methods to suppress output during testing
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
console.error = () => {};
console.warn = () => {};

test('EnhancedLogger should log a message to the file', () => {
  const logger = EnhancedLogger.getInstance('test-log.log');
  const logFilePath = path.join(process.cwd(), 'logs', 'test-log.log');
  
  // Clean up any existing file
  if (fs.existsSync(logFilePath)) {
    fs.unlinkSync(logFilePath);
  }

  const message = 'This is a test message';
  logger.logInfo(message);

  const loggedContent = fs.readFileSync(logFilePath, { encoding: 'utf8' });
  assert.ok(loggedContent.includes("INFO") && loggedContent.includes(message));

  // Clean up after test
  fs.unlinkSync(logFilePath);
});

test('EnhancedLogger should retry writing to the log file and succeed within max retries', () => {
  const logger = EnhancedLogger.getInstance('test-log.log');
  const logFilePath = path.join(process.cwd(), 'logs', 'test-log.log');

  // Clean up any existing file
  if (fs.existsSync(logFilePath)) {
    fs.unlinkSync(logFilePath);
  }

  // Mock fs.appendFileSync to fail on the first two attempts
  let failAttempts = 0;
  const originalAppendFileSync = fs.appendFileSync;
  fs.appendFileSync = (...args) => {
    if (failAttempts < 2) {
      failAttempts++;
      throw new Error('Mocked file system error');
    } else {
      originalAppendFileSync(...args);
    }
  };

  const message = 'This is a message that should eventually be logged';
  logger.logInfo(message);

  const loggedContent = fs.readFileSync(logFilePath, { encoding: 'utf8' });
  assert.ok(loggedContent.includes("INFO") && loggedContent.includes(message));

  // Clean up and restore fs.appendFileSync
  fs.unlinkSync(logFilePath);
  fs.appendFileSync = originalAppendFileSync;
});

test('EnhancedLogger should fail to write after max retries and log a fatal error to the console', () => {
  const logger = EnhancedLogger.getInstance('test-log.log');

  // Mock console.error to capture output
  let consoleOutput = '';
  console.error = (message: string) => {
    consoleOutput += message;
  };

  // Mock fs.appendFileSync to always fail
  const originalAppendFileSync = fs.appendFileSync;
  fs.appendFileSync = () => {
    throw new Error('Mocked persistent file system error');
  };

  const message = 'This is a message that should fail writing';
  logger.logInfo(message);

  // Check that the fatal error was logged to the console
  assert.ok(consoleOutput.includes('FATAL ERROR') && consoleOutput.includes('Mocked persistent file system error'));

  // Restore fs.appendFileSync and console.error
  fs.appendFileSync = originalAppendFileSync;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
