import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { EnhancedLogger } from './enhanced-logger.js';

function readFileContent(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

test('EnhancedLogger should create log directory and file', () => {
  const logger = EnhancedLogger.getInstance('test.log');
  const logFile = path.resolve(process.cwd(), 'logs', 'test.log');

  // Ensure directory and file are created
  assert.strictEqual(fs.existsSync(logFile), true);
});

test('EnhancedLogger should correctly log info level messages', () => {
  const message = 'This is an info message';
  const logger = EnhancedLogger.getInstance('info.log');
  const logFile = path.resolve(process.cwd(), 'logs', 'info.log');

  logger.logInfo(message);
  const content = readFileContent(logFile);

  assert.match(content, new RegExp(`\\[INFO\\] ${message}`));
});

test('EnhancedLogger should correctly log warn level messages', () => {
  const message = 'This is a warning';
  const logger = EnhancedLogger.getInstance('warn.log');
  const logFile = path.resolve(process.cwd(), 'logs', 'warn.log');

  logger.logWarn(message);
  const content = readFileContent(logFile);

  assert.match(content, new RegExp(`\\[WARN\\] ${message}`));
});

test('EnhancedLogger should correctly log error level messages', () => {
  const message = 'This is an error';
  const logger = EnhancedLogger.getInstance('error.log');
  const logFile = path.resolve(process.cwd(), 'logs', 'error.log');

  logger.logError(message);
  const content = readFileContent(logFile);

  assert.match(content, new RegExp(`\\[ERROR\\] ${message}`));
});

test('EnhancedLogger should correctly log debug level messages', () => {
  const message = 'This is a debug message';
  const logger = EnhancedLogger.getInstance('debug.log');
  const logFile = path.resolve(process.cwd(), 'logs', 'debug.log');

  logger.logDebug(message);
  const content = readFileContent(logFile);

  assert.match(content, new RegExp(`\\[DEBUG\\] ${message}`));
});
