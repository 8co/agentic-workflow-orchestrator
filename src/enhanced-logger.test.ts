import fs from 'fs';
import path from 'path';
import assert from 'node:assert';
import test from 'node:test';
import { EnhancedLogger } from './enhanced-logger.js';

const logFilePath = path.resolve(process.cwd(), 'logs', 'test.log');

test('EnhancedLogger: should correctly log info messages to console and file', () => {
  const originalConsoleInfo = console.info;
  let consoleOutput = '';
  console.info = (message?: any, ...optionalParams: any[]) => {
    consoleOutput += message + optionalParams.join(' ');
  };

  const logger = EnhancedLogger.getInstance('test.log');
  logger.logInfo('This is an info message');

  const logContent = fs.readFileSync(logFilePath, 'utf-8');
  assert(logContent.includes('INFO'));
  assert(consoleOutput.includes('INFO'));

  console.info = originalConsoleInfo;
});

test('EnhancedLogger: should correctly log warning messages to console and file', () => {
  const originalConsoleWarn = console.warn;
  let consoleOutput = '';
  console.warn = (message?: any, ...optionalParams: any[]) => {
    consoleOutput += message + optionalParams.join(' ');
  };

  const logger = EnhancedLogger.getInstance('test.log');
  logger.logWarn('This is a warning message');

  const logContent = fs.readFileSync(logFilePath, 'utf-8');
  assert(logContent.includes('WARN'));
  assert(consoleOutput.includes('WARN'));

  console.warn = originalConsoleWarn;
});

test('EnhancedLogger: should correctly log error messages to console and file', () => {
  const originalConsoleError = console.error;
  let consoleOutput = '';
  console.error = (message?: any, ...optionalParams: any[]) => {
    consoleOutput += message + optionalParams.join(' ');
  };

  const logger = EnhancedLogger.getInstance('test.log');
  logger.logError('This is an error message');

  const logContent = fs.readFileSync(logFilePath, 'utf-8');
  assert(logContent.includes('ERROR'));
  assert(consoleOutput.includes('ERROR'));

  console.error = originalConsoleError;
});

test('EnhancedLogger: should correctly log debug messages to console and file', () => {
  const originalConsoleDebug = console.debug;
  let consoleOutput = '';
  console.debug = (message?: any, ...optionalParams: any[]) => {
    consoleOutput += message + optionalParams.join(' ');
  };

  const logger = EnhancedLogger.getInstance('test.log');
  logger.logDebug('This is a debug message');

  const logContent = fs.readFileSync(logFilePath, 'utf-8');
  assert(logContent.includes('DEBUG'));
  assert(consoleOutput.includes('DEBUG'));

  console.debug = originalConsoleDebug;
});

test('EnhancedLogger: should handle errors when writing to a log file', () => {
  const originalConsoleError = console.error;
  let consoleOutput = '';
  console.error = (message?: any, ...optionalParams: any[]) => {
    consoleOutput += message + optionalParams.join(' ');
  };

  const logger = EnhancedLogger.getInstance('test.log');

  // Simulate an error by making the log file unwritable
  fs.chmodSync(logFilePath, 0o400); // read-only

  logger.logError('This is an unwritable file test');

  assert(consoleOutput.includes('[ERROR] Failed to write to log file'));

  console.error = originalConsoleError;

  // Restore permissions
  fs.chmodSync(logFilePath, 0o600); // normal writable
});
