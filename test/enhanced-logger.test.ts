import { strict as assert } from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { EnhancedLogger } from '../src/enhanced-logger.js';

const fakeLogFileName = 'test-application.log';
const fakeLogDirectory = path.resolve(process.cwd(), 'logs');
const fakeLogFilePath = path.join(fakeLogDirectory, fakeLogFileName);

function removeTestLogs(): void {
  if (fs.existsSync(fakeLogFilePath)) {
    fs.unlinkSync(fakeLogFilePath);
  }
}

function simulateErrorDuringAppendFileSync(): void {
  // Simulate an error by mocking fs.appendFileSync
  jest.spyOn(fs, 'appendFileSync').mockImplementationOnce(() => {
    throw new Error('Simulated file system error');
  });
}

function simulateErrorDuringMkdirSync(): void {
  // Simulate a recovery error by mocking fs.mkdirSync
  jest.spyOn(fs, 'mkdirSync').mockImplementationOnce(() => {
    throw new Error('Simulated directory creation error');
  });
}

function restoreFsMethods(): void {
  jest.restoreAllMocks();
}

describe('EnhancedLogger Error Handling', () => {
  beforeEach(() => {
    removeTestLogs();
  });

  afterEach(() => {
    removeTestLogs();
    restoreFsMethods();
  });

  it('should log an error detail if the file writing fails', () => {
    const logger = EnhancedLogger.getInstance(fakeLogFileName);
    simulateErrorDuringAppendFileSync();

    assert.doesNotThrow(() => {
      logger.logError('This is a test error message');
    });

    assert(fs.existsSync(fakeLogFilePath), 'Log file should exist after recovery');
  });

  it('should attempt recovery if an error occurs during file writing', () => {
    const logger = EnhancedLogger.getInstance(fakeLogFileName);
    simulateErrorDuringAppendFileSync();

    assert.doesNotThrow(() => {
      logger.logInfo('This is a test info message');
    });

    assert(fs.existsSync(fakeLogFilePath), 'Log file should exist after recovery');
  });

  it('should log recovery attempt failures when both append and mkdir fail', () => {
    const logger = EnhancedLogger.getInstance(fakeLogFileName);
    simulateErrorDuringAppendFileSync();
    simulateErrorDuringMkdirSync();

    assert.doesNotThrow(() => {
      logger.logWarn('This is a test warn message');
    });

    assert(!fs.existsSync(fakeLogFilePath), 'Log file should not exist if recovery fails');
  });
});
