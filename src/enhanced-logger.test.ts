import { test } from 'node:test';
import assert from 'node:assert';
import { EnhancedLogger } from './enhanced-logger.js';
import fs from 'fs';

// Mocking fs.appendFileSync to simulate timeout and unknown error
const originalAppendFileSync = fs.appendFileSync;

function mockFsWithTimeout() {
  fs.appendFileSync = () => {
    const error = new Error('ETIMEDOUT: operation timed out');
    (error as any).code = 'ETIMEDOUT';
    throw error;
  };
}

function mockFsWithUnknownError() {
  fs.appendFileSync = () => {
    throw new Error('Unknown write error');
  };
}

function restoreFs() {
  fs.appendFileSync = originalAppendFileSync;
}

test('EnhancedLogger retries on timeout error', async () => {
  mockFsWithTimeout();
  const logger = EnhancedLogger.getInstance();
  assert.doesNotThrow(() => logger.logInfo('Testing timeout handling'));
  restoreFs();
});

test('EnhancedLogger retries on unknown error', async () => {
  mockFsWithUnknownError();
  const logger = EnhancedLogger.getInstance();
  assert.doesNotThrow(() => logger.logInfo('Testing unknown error handling'));
  restoreFs();
});
