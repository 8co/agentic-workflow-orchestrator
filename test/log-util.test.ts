import { describe, it } from 'node:test';
import assert from 'node:assert';
import { LogUtil } from '../src/log-util.js';
import { LogLevel } from '../src/logger.js';

// Mock logger
const mockLogger = {
  info: (message: string) => message,
  warn: (message: string) => message,
  error: (message: string) => message,
  debug: (message: string) => message,
};

// Mock createLogger function
const createLoggerMock = (name: string) => mockLogger;

// Override createLogger in LogUtil
jest.mock('../src/logger.js', () => ({
  createLogger: (name: string) => createLoggerMock(name),
  LogLevel: jest.requireActual('../src/logger.js').LogLevel,
}));

describe('LogUtil', () => {

  const logUtil = LogUtil.getInstance();

  it('should log info messages correctly', () => {
    const message = 'Info message';
    const logMessage = logUtil.logInfo(message);
    assert.strictEqual(logMessage, message);
  });

  it('should log warn messages correctly', () => {
    const message = 'Warning message';
    const logMessage = logUtil.logWarn(message);
    assert.strictEqual(logMessage, message);
  });

  it('should log error messages correctly without error', () => {
    const message = 'Error message';
    const logMessage = logUtil.logError(message);
    assert.strictEqual(logMessage, message);
  });

  it('should log error messages correctly with error', () => {
    const message = 'Error message';
    const error = new Error('An error occurred');
    const logMessage = logUtil.logError(message, error);
    assert.strictEqual(logMessage, `${message} - Error: ${error.message}`);
  });

  it('should log debug messages correctly', () => {
    const message = 'Debug message';
    const logMessage = logUtil.logDebug(message);
    assert.strictEqual(logMessage, message);
  });

  it('should handle invalid log level', () => {
    const message = 'Invalid log level';
    try {
      // @ts-expect-error
      logUtil.log('invalid', message);
    } catch (error) {
      assert.strictEqual(
        (mockLogger.error as any).mock.calls[0][0],
        `Logging failed for original message: ${message}. Error: Invalid log level: invalid`
      );
    }
  });
});
