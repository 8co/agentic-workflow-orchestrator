import { strict as assert } from 'node:assert';
import test from 'node:test';
import { getHealthStatus } from '../src/health.js';
import { createLogger } from '../src/logger.js';

// Mock logger to suppress logs during testing
createLogger.mockImplementation(() => ({
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
}));

test('getHealthStatus - normal conditions', () => {
  const healthStatus = getHealthStatus();
  assert.equal(healthStatus.status, 'ok');
  assert.ok(healthStatus.uptime > 0, 'Uptime should be greater than 0');
  assert.ok(healthStatus.memoryUsage > 0, 'Memory usage should be greater than 0');
  assert.match(healthStatus.timestamp, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/, 'Timestamp should be in ISO format');
});

test('getHealthStatus - uptime retrieval fails', () => {
  // Mocking uptime failure
  process.uptime = () => NaN;
  const healthStatus = getHealthStatus();
  assert.equal(healthStatus.status, 'down');
  assert.equal(healthStatus.uptime, 0);
});

test('getHealthStatus - high memory usage', () => {
  // Mocking high memory usage
  process.memoryUsage = () => ({ heapUsed: 800 * 1048576 });
  const healthStatus = getHealthStatus();
  assert.equal(healthStatus.status, 'ok');
  assert.equal(healthStatus.memoryUsage, 800);
});

test('getHealthStatus - memory usage is NaN', () => {
  // Mocking NaN memory usage
  process.memoryUsage = () => ({ heapUsed: NaN });
  assert.throws(() => getHealthStatus(), { message: 'Heap used is NaN' });
});

test('getHealthStatus - extractPackageVersion failure', () => {
  // Mocking package.json read failure
  const originalReadFileSync = require('node:fs').readFileSync;
  require('node:fs').readFileSync = () => { throw new Error('File not found'); };

  const healthStatus = getHealthStatus();
  assert.equal(healthStatus.version, undefined);

  // Restore the original function
  require('node:fs').readFileSync = originalReadFileSync;
});
