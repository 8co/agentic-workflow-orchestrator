import { test } from 'node:test';
import assert from 'node:assert';
import { getHealthStatus } from '../src/health.js';

// Mocking Required Modules and Functions
let mockPackageJsonVersion: string | undefined = '1.0.0';
let mockHeapUsed: number = 1024 * 1024 * 100;
let mockUptime: number = 1000;

// Mock readFileSync to return a fake package.json
import { readFileSync } from 'node:fs';
import { memoryUsage, uptime } from 'node:process';
import { join } from 'node:path';

jest.mock('node:fs', () => ({
  readFileSync: jest.fn(() => {
    if (mockPackageJsonVersion === undefined) {
      throw new Error('File not found');
    }
    return JSON.stringify({ version: mockPackageJsonVersion });
  }),
}));

// Mock process.memoryUsage and process.uptime
jest.mock('node:process', () => ({
  memoryUsage: jest.fn(() => ({
    heapUsed: mockHeapUsed,
  })),
  uptime: jest.fn(() => mockUptime),
}));


test('getHealthStatus should return a status with version and correct memory usage', () => {
  const healthStatus = getHealthStatus();
  assert.strictEqual(healthStatus.version, '1.0.0');
  assert.strictEqual(healthStatus.status, 'ok');
  assert(healthStatus.memoryUsage > 0);
  assert(healthStatus.uptime > 0);
  assert(new Date(healthStatus.timestamp).toISOString() === healthStatus.timestamp);
});

test('getHealthStatus should degrade status and not include version when package.json is missing', () => {
  mockPackageJsonVersion = undefined;
  const healthStatus = getHealthStatus();
  assert.strictEqual(healthStatus.version, undefined);
  assert.strictEqual(healthStatus.status, 'degraded');
});

test('getHealthStatus should degrade status when memoryUsage is NaN', () => {
  mockHeapUsed = NaN;
  const healthStatus = getHealthStatus();
  assert.strictEqual(healthStatus.status, 'degraded');
});

test('getHealthStatus should return down status when uptime is NaN', () => {
  mockUptime = NaN;
  const healthStatus = getHealthStatus();
  assert.strictEqual(healthStatus.status, 'down');
});

// Reset mocks
afterEach(() => {
  mockPackageJsonVersion = '1.0.0';
  mockHeapUsed = 1024 * 1024 * 100; // 100 MB
  mockUptime = 1000;
});
