import { test } from 'node:test';
import assert from 'node:assert';
import { getHealthStatus } from '../src/health.js';

// Mocking necessary modules and functions
const mockLogger = {
  error: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
};
let originalCreateLogger: Function;
let originalReadFileSync: Function;
let originalProcess: NodeJS.Process;

test('setup', () => {
  originalCreateLogger = (global as any).createLogger;
  (global as any).createLogger = () => mockLogger;

  originalReadFileSync = (global as any).readFileSync;
  (global as any).readFileSync = (path: string) => JSON.stringify({ version: '1.0.0' });

  originalProcess = process;
  process = { ...process, uptime: () => 123.456, memoryUsage: () => ({ heapUsed: 200000000 }) } as NodeJS.Process;
});

test('should return proper health status with valid package version', () => {
  const status = getHealthStatus();
  assert.strictEqual(status.status, 'ok');
  assert.strictEqual(status.uptime, 123.46);
  assert.strictEqual(status.memoryUsage, 190.73);
  assert.strictEqual(status.version, '1.0.0');
});

test('should handle missing package version gracefully', () => {
  (global as any).readFileSync = (path: string) => JSON.stringify({});
  
  const status = getHealthStatus();
  assert.strictEqual(status.status, 'ok');
  assert.strictEqual(status.version, undefined);
});

test('should handle invalid package.json format gracefully', () => {
  (global as any).readFileSync = (path: string) => '{ invalid json }';
  
  const status = getHealthStatus();
  assert.strictEqual(status.status, 'ok');
  assert.strictEqual(status.version, undefined);
});

test('should return NaN for memory usage in case of invalid heapUsed', () => {
  process = { ...process, memoryUsage: () => ({ heapUsed: NaN }) } as NodeJS.Process;
  
  const status = getHealthStatus();
  assert.ok(isNaN(status.memoryUsage));
});

test('should log warnings for high memory usage', () => {
  let logMessage = '';
  mockLogger.warn = (msg: string) => { logMessage = msg; };
  
  process = { ...process, memoryUsage: () => ({ heapUsed: 600000000 }) } as NodeJS.Process;
  
  getHealthStatus();
  assert.strictEqual(logMessage, 'High memory usage detected: 572.20 MB. Consider investigating memory usage.');
});

test('teardown', () => {
  (global as any).createLogger = originalCreateLogger;
  (global as any).readFileSync = originalReadFileSync;
  process = originalProcess;
});
