import fs from 'fs';
import path from 'path';
import assert from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { EnhancedLogger } from '../src/enhanced-logger.js';

describe('EnhancedLogger', () => {
  const logFileName = 'test.log';
  const logDirectory = path.resolve(process.cwd(), 'logs');
  const logFilePath = path.join(logDirectory, logFileName);

  beforeEach(() => {
    if (fs.existsSync(logFilePath)) {
      fs.unlinkSync(logFilePath);
    }
  });

  afterEach(() => {
    if (fs.existsSync(logFilePath)) {
      fs.unlinkSync(logFilePath);
    }
  });

  const captureConsoleOutput = (callback: () => void): string => {
    const originalConsole = console;
    let output = '';

    const fakeConsole = {
      info: (message: string) => (output += message),
      warn: (message: string) => (output += message),
      error: (message: string) => (output += message),
      debug: (message: string) => (output += message),
    };
    
    (console as any) = fakeConsole;

    try {
      callback();
    } finally {
      (console as any) = originalConsole;
    }

    return output;
  };

  it('should log info messages to console and file', () => {
    const logger = EnhancedLogger.getInstance(logFileName);
    const message = 'This is an info message';
    const output = captureConsoleOutput(() => logger.logInfo(message));

    const logContent = fs.readFileSync(logFilePath, 'utf8');
    assert.match(output, new RegExp(`INFO\\] ${message}`));
    assert.match(logContent, new RegExp(`INFO\\] ${message}`));
  });

  it('should log warn messages to console and file', () => {
    const logger = EnhancedLogger.getInstance(logFileName);
    const message = 'This is a warning message';
    const output = captureConsoleOutput(() => logger.logWarn(message));

    const logContent = fs.readFileSync(logFilePath, 'utf8');
    assert.match(output, new RegExp(`WARN\\] ${message}`));
    assert.match(logContent, new RegExp(`WARN\\] ${message}`));
  });

  it('should log error messages to console and file', () => {
    const logger = EnhancedLogger.getInstance(logFileName);
    const message = 'This is an error message';
    const output = captureConsoleOutput(() => logger.logError(message));

    const logContent = fs.readFileSync(logFilePath, 'utf8');
    assert.match(output, new RegExp(`ERROR\\] ${message}`));
    assert.match(logContent, new RegExp(`ERROR\\] ${message}`));
  });

  it('should log debug messages to console and file', () => {
    const logger = EnhancedLogger.getInstance(logFileName);
    const message = 'This is a debug message';
    const output = captureConsoleOutput(() => logger.logDebug(message));

    const logContent = fs.readFileSync(logFilePath, 'utf8');
    assert.match(output, new RegExp(`DEBUG\\] ${message}`));
    assert.match(logContent, new RegExp(`DEBUG\\] ${message}`));
  });

  it('should reuse the same logger instance', () => {
    const logger1 = EnhancedLogger.getInstance(logFileName);
    const logger2 = EnhancedLogger.getInstance(logFileName);

    assert.strictEqual(logger1, logger2);
  });
});
