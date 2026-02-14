import assert from 'node:assert';
import { test } from 'node:test';
import fs from 'fs';
import path from 'path';
import { HealthLogger } from '../src/health-logger.js';

const logDirectory = path.resolve(process.cwd(), 'health_logs');
const logFilePath = path.join(logDirectory, 'health.log');

test('HealthLogger should create a singleton instance', () => {
  const instance1 = HealthLogger.getInstance();
  const instance2 = HealthLogger.getInstance();
  assert.strictEqual(instance1, instance2);
});

test('HealthLogger should log status messages to console and file', () => {
  const logger = HealthLogger.getInstance('health.test.log');
  const logSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
  logger.logStatus('Test status message');

  const content = fs.readFileSync(logFilePath, 'utf-8');
  assert(content.includes('[STATUS] Test status message'), 'Log file should contain the status message');
  assert(logSpy.mock.calls.length === 1, 'Console should have logged one status message');

  logSpy.mockRestore();
  fs.unlinkSync(logFilePath);
});

test('HealthLogger should log alert messages to console and file', () => {
  const logger = HealthLogger.getInstance('health.test.log');
  const logSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  logger.logAlert('Test alert message');

  const content = fs.readFileSync(logFilePath, 'utf-8');
  assert(content.includes('[ALERT] Test alert message'), 'Log file should contain the alert message');
  assert(logSpy.mock.calls.length === 1, 'Console should have logged one alert message');

  logSpy.mockRestore();
  fs.unlinkSync(logFilePath);
});

test('HealthLogger should handle directory creation failures gracefully', () => {
  const originalMkdirSync = fs.mkdirSync;
  const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockImplementationOnce(() => {
    throw new Error('Failed to create directory');
  });

  const logger = HealthLogger.getInstance('health.test.log');
  const logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
  logger.logStatus('Testing directory failure handling');

  assert(logSpy.mock.calls.some((call) => call[0].includes('Recovery attempt failed')), 'Console should display recovery error messages');

  logSpy.mockRestore();
  mkdirSpy.mockRestore();

  fs.mkdirSync = originalMkdirSync;
  fs.unlinkSync(logFilePath);
});

test('HealthLogger should handle file write failures gracefully', () => {
  const originalAppendFileSync = fs.appendFileSync;
  const writeFileSpy = jest.spyOn(fs, 'appendFileSync').mockImplementation(() => {
    throw new Error('Failed to write to file');
  });

  const logger = HealthLogger.getInstance('health.test.log');
  const logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  logger.logAlert('Testing file write failure handling');

  assert(logSpy.mock.calls.length > 1, 'Console should log errors for each retry');

  logSpy.mockRestore();
  writeFileSpy.mockRestore();
  fs.unlinkSync(logFilePath);
});
