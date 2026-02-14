import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { getHealthStatus } from '../src/health.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createLogger } from '../src/logger.js';

const loggerMock = {
  info: () => {},
  warn: () => {},
  error: () => {},
};

const originalProcessCwd = process.cwd;
const originalProcessUptime = process.uptime;
const originalProcessMemoryUsage = process.memoryUsage;
const originalReadFileSync = readFileSync;
const originalLoggerCreate = createLogger;

createLogger = () => loggerMock as ReturnType<typeof createLogger>;

test('getHealthStatus returns correct status with valid package.json', () => {
  const mockCwd = '/mocked-path';
  const mockVersion = '1.0.0';
  process.cwd = () => mockCwd;
  readFileSync = (path: string, encoding: string) => {
    if (path === join(mockCwd, 'package.json')) {
      return JSON.stringify({ version: mockVersion });
    }
    return '';
  };
  process.uptime = () => 120.56;
  process.memoryUsage = () => ({ heapUsed: 200 * 1024 * 1024 });
  
  const status = getHealthStatus();

  assert.equal(status.status, 'ok');
  assert.equal(status.version, mockVersion);
  assert.ok(status.uptime >= 0);
  assert.ok(status.memoryUsage >= 0);
  assert.ok(Date.parse(status.timestamp) > 0);
});

test('getHealthStatus handles missing package.json gracefully', () => {
  process.cwd = () => '/invalid-path';
  readFileSync = () => { throw new Error('File not found'); };
  
  const status = getHealthStatus();

  assert.equal(status.status, 'ok');
  assert.equal(status.version, 'unknown');
});

test('getHealthStatus handles invalid JSON in package.json gracefully', () => {
  const mockCwd = '/mocked-path';
  process.cwd = () => mockCwd;
  readFileSync = () => '{ invalid JSON ';
  
  const status = getHealthStatus();

  assert.equal(status.status, 'ok');
  assert.equal(status.version, 'unknown');
});

test('getHealthStatus logs warning for high memory usage', () => {
  let warningLogged = false;
  loggerMock.warn = () => { warningLogged = true; };
  process.memoryUsage = () => ({ heapUsed: 600 * 1024 * 1024 });

  const status = getHealthStatus();

  assert.equal(status.status, 'ok');
  assert.ok(warningLogged);
});

// Restore mocked functions
process.cwd = originalProcessCwd;
process.uptime = originalProcessUptime;
process.memoryUsage = originalProcessMemoryUsage;
readFileSync = originalReadFileSync;
createLogger = originalLoggerCreate;
