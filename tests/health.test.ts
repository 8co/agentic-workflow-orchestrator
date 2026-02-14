import { test } from 'node:test';
import assert from 'node:assert';
import { getHealthStatus } from '../src/health.js';
import { createLogger } from '../src/logger.js';

const logger = createLogger('health');
const originalMemoryUsage = process.memoryUsage;
const originalUptime = process.uptime;

function mockMemoryUsage(heapUsed: number) {
  process.memoryUsage = () => ({ heapUsed } as NodeJS.MemoryUsage);
}

function mockUptime(uptime: number) {
  process.uptime = () => uptime;
}

function resetMocks() {
  process.memoryUsage = originalMemoryUsage;
  process.uptime = originalUptime;
}

test('getHealthStatus: normal operation', () => {
  mockMemoryUsage(300 * 1048576); // 300 MB
  mockUptime(120); // 2 minutes

  const status = getHealthStatus();

  assert.strictEqual(status.status, 'ok');
  assert.ok(status.uptime > 0);
  assert.ok(status.memoryUsage <= 300);
  assert.ok(Date.parse(status.timestamp) > 0);
  assert.strictEqual(typeof status.version, 'string');
  
  resetMocks();
});

test('getHealthStatus: error when reading package.json', () => {
  const fsReadFileSyncOriginal = require('fs').readFileSync;
  require('fs').readFileSync = () => { throw new Error('File read error'); };

  mockMemoryUsage(300 * 1048576); // 300 MB
  mockUptime(120); // 2 minutes

  const status = getHealthStatus();

  assert.strictEqual(status.status, 'ok');
  assert.ok(status.uptime > 0);
  assert.ok(Date.parse(status.timestamp) > 0);

  require('fs').readFileSync = fsReadFileSyncOriginal;
  resetMocks();
});

test('getHealthStatus: error parsing package.json', () => {
  const fsReadFileSyncOriginal = require('fs').readFileSync;
  require('fs').readFileSync = () => '{ invalidJson }';

  mockMemoryUsage(300 * 1048576); // 300 MB
  mockUptime(120); // 2 minutes

  const status = getHealthStatus();

  assert.strictEqual(status.status, 'ok');
  assert.ok(status.uptime > 0);
  assert.ok(Date.parse(status.timestamp) > 0);
  
  require('fs').readFileSync = fsReadFileSyncOriginal;
  resetMocks();
});

test('logMemoryUsageWarnings: high memory usage', () => {
  mockMemoryUsage(550 * 1048576); // 550 MB
  mockUptime(120); // 2 minutes

  const logs: string[] = [];
  logger.warn = (message: string) => logs.push(message);

  getHealthStatus();

  assert(logs.some(log => log.includes('High memory usage')));

  resetMocks();
});

test('logMemoryUsageWarnings: critical memory usage', () => {
  mockMemoryUsage(750 * 1048576); // 750 MB
  mockUptime(120); // 2 minutes

  const logs: string[] = [];
  logger.error = (message: string) => logs.push(message);

  getHealthStatus();

  assert(logs.some(log => log.includes('Critical memory usage')));

  resetMocks();
});

test('logMemoryUsageWarnings: moderate memory usage', () => {
  mockMemoryUsage(350 * 1048576); // 350 MB
  mockUptime(120); // 2 minutes

  const logs: string[] = [];
  logger.info = (message: string) => logs.push(message);

  getHealthStatus();

  assert(logs.some(log => log.includes('Moderate memory usage')));

  resetMocks();
});

test('logMemoryUsageWarnings: normal memory usage', () => {
  mockMemoryUsage(250 * 1048576); // 250 MB
  mockUptime(120); // 2 minutes

  const logs: string[] = [];
  logger.info = (message: string) => logs.push(message);

  getHealthStatus();

  assert(logs.some(log => log.includes('Normal memory usage')));

  resetMocks();
});
