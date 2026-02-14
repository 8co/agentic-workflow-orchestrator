import { test } from 'node:test';
import assert from 'node:assert';
import { getHealthStatus } from '../src/health.js';
import { createLogger } from '../src/logger.js';

// Mocking the logger
createLogger as jest.Mock;
jest.mock('../src/logger.js');

function setupMockedProcess(memoryUsageMock: () => { heapUsed: number }) {
  global.process.memoryUsage = memoryUsageMock;
}

test('getHealthStatus should return status "ok" when memory usage and version extraction succeed', () => {
  setupMockedProcess(() => ({ heapUsed: 300 * 1024 * 1024 })); // 300MB
  const healthStatus = getHealthStatus();
  assert.strictEqual(healthStatus.status, 'ok');
});

test('getHealthStatus should return status "degraded" when memory usage retrieval fails', () => {
  setupMockedProcess(() => ({ heapUsed: NaN })); // Simulating failure
  const healthStatus = getHealthStatus();
  assert.strictEqual(healthStatus.status, 'degraded');
});

test('getHealthStatus should return status "degraded" when version extraction fails', () => {
  jest.spyOn(global.JSON, 'parse').mockImplementationOnce(() => { throw new Error('Invalid JSON'); });
  const healthStatus = getHealthStatus();
  assert.strictEqual(healthStatus.status, 'degraded');
});

test('getHealthStatus should correctly calculate memory usage in MB', () => {
  setupMockedProcess(() => ({ heapUsed: 10485760 })); // 10MB
  const healthStatus = getHealthStatus();
  assert.strictEqual(healthStatus.memoryUsage, 10);
});
