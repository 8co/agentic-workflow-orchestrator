import fs from 'fs';
import path from 'path';
import { test, mock } from 'node:test';
import assert from 'node:assert';
import { EnhancedLogger } from '../src/enhanced-logger.js';

test('EnhancedLogger should log messages to a file and console at different levels', () => {
  const logger = EnhancedLogger.getInstance('test.log');

  const consoleInfoSpy = mock.spy(console, 'info');
  const consoleWarnSpy = mock.spy(console, 'warn');
  const consoleErrorSpy = mock.spy(console, 'error');
  const consoleDebugSpy = mock.spy(console, 'debug');

  logger.logInfo('Information message');
  logger.logWarn('Warning message');
  logger.logError('Error message');
  logger.logDebug('Debug message');

  assert.ok(consoleInfoSpy.calledWithMatch(/\[INFO\] Information message/));
  assert.ok(consoleWarnSpy.calledWithMatch(/\[WARN\] Warning message/));
  assert.ok(consoleErrorSpy.calledWithMatch(/\[ERROR\] Error message/));
  assert.ok(consoleDebugSpy.calledWithMatch(/\[DEBUG\] Debug message/));

  consoleInfoSpy.restore();
  consoleWarnSpy.restore();
  consoleErrorSpy.restore();
  consoleDebugSpy.restore();
});

test('EnhancedLogger should handle a failure to write to the log file gracefully', () => {
  const logger = EnhancedLogger.getInstance('failing-test.log');

  const fsAppendFileSyncMock = mock.fn(fs, 'appendFileSync', () => {
    throw new Error('Simulated file write failure');
  });

  const consoleErrorSpy = mock.spy(console, 'error');

  logger.logError('This should trigger a file write failure');

  assert.ok(consoleErrorSpy.calledWithMatch(/Failed to write to log file/));
  assert.ok(consoleErrorSpy.calledWithMatch(/Simulated file write failure/));

  fsAppendFileSyncMock.restore();
  consoleErrorSpy.restore();
});

test('EnhancedLogger should retry creating directory and writing to file upon failure', () => {
  const logger = EnhancedLogger.getInstance('retry-test.log');

  const fakeExistsSync = mock.fn(fs, 'existsSync', () => false);
  const fakeMkdirSync = mock.fn(fs, 'mkdirSync', () => { });
  const fakeAppendFileSync = mock.fn(fs, 'appendFileSync', () => { });

  logger.logInfo('Testing retry mechanism');

  assert.ok(fakeExistsSync.called);
  assert.ok(fakeMkdirSync.called);
  assert.strictEqual(fakeAppendFileSync.callCount, 2, 'appendFileSync should be retried once');

  fakeExistsSync.restore();
  fakeMkdirSync.restore();
  fakeAppendFileSync.restore();
});
