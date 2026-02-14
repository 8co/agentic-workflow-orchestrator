import assert from 'node:assert';
import test from 'node:test';
import { getHealthStatus } from '../src/health.js';

test('getHealthStatus returns valid HealthStatus object', () => {
  const status = getHealthStatus();

  assert.strictEqual(typeof status, 'object');
  assert.strictEqual(status.status, 'ok');
  assert.strictEqual(typeof status.uptime, 'number');
  assert.strictEqual(typeof status.memoryUsage, 'number');
  assert.ok(new Date(status.timestamp).toString() !== 'Invalid Date');
  if (status.version !== undefined) {
    assert.strictEqual(typeof status.version, 'string');
  }
});

test('getHealthStatus calculates uptime correctly', () => {
  const initialUptime = process.uptime();
  const status = getHealthStatus();
  const laterUptime = process.uptime();

  assert.ok(status.uptime >= initialUptime && status.uptime <= laterUptime);
});

test('getHealthStatus calculates memory usage accurately', () => {
  const status = getHealthStatus();
  const expectedMemoryUsage = process.memoryUsage().heapUsed / 1048576;

  assert.strictEqual(status.memoryUsage, Number(expectedMemoryUsage.toFixed(2)));
});

test('getHealthStatus handles missing package.json gracefully', () => {
  const originalCwd = process.cwd;
  process.cwd = () => '/invalid/path';
  
  const status = getHealthStatus();
  
  assert.strictEqual(status.version, undefined);

  process.cwd = originalCwd;
});
