import { test } from 'node:test';
import assert from 'node:assert';
import { getHealthStatus } from '../src/health.js';
import { readFileSync } from 'node:fs';

// Mocking the necessary components
const originalReadFileSync = readFileSync;
const mockLogger = {
  debug: () => {},
  error: () => {},
  info: () => {},
  warn: () => {},
};

function createLogger() {
  return mockLogger;
}

// Inject the mocked logger
import * as loggerModule from '../src/logger.js';
loggerModule.createLogger = createLogger;

test('getHealthStatus: should return health status with valid package.json', () => {
  const mockPackageJson = JSON.stringify({ version: '1.0.0' });
  readFileSync = () => mockPackageJson;

  const status = getHealthStatus();
  assert.strictEqual(status.version, '1.0.0');
  assert.strictEqual(status.status, 'ok');

  // Restore original readFileSync
  readFileSync = originalReadFileSync;
});

test('getHealthStatus: should handle missing package.json', () => {
  readFileSync = () => { throw new Error('File not found'); };

  const status = getHealthStatus();
  assert.strictEqual(status.version, undefined);
  assert.strictEqual(status.status, 'ok');

  // Restore original readFileSync
  readFileSync = originalReadFileSync;
});

test('getHealthStatus: should handle invalid JSON in package.json', () => {
  readFileSync = () => 'invalid json';

  const status = getHealthStatus();
  assert.strictEqual(status.version, undefined);
  assert.strictEqual(status.status, 'ok');

  // Restore original readFileSync
  readFileSync = originalReadFileSync;
});

test('getHealthStatus: should report high memory usage', () => {
  const originalProcessMemoryUsage = process.memoryUsage;
  process.memoryUsage = () => ({ heapUsed: 600 * 1024 * 1024 });

  const status = getHealthStatus();
  assert.strictEqual(status.status, 'ok');
  assert.ok(status.memoryUsage > 500);

  // Restore original process.memoryUsage
  process.memoryUsage = originalProcessMemoryUsage;
});

test('getHealthStatus: should handle low uptime', () => {
  const originalProcessUptime = process.uptime;
  process.uptime = () => 0.01;

  const status = getHealthStatus();
  assert.strictEqual(status.uptime, 0.01);

  // Restore original process.uptime
  process.uptime = originalProcessUptime;
});
