import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getHealthStatus } from '../src/health.js';

test('getHealthStatus should accurately fetch system health', () => {
  const originalUptime = process.uptime;
  const originalMemoryUsage = process.memoryUsage;
  
  process.uptime = () => 120; // Setting uptime to 120 seconds
  process.memoryUsage = () => ({ heapUsed: 1024 * 1024 * 250 }); // 250 MB usage
  
  const healthStatus = getHealthStatus();
  
  assert.strictEqual(healthStatus.status, 'ok');
  assert(healthStatus.uptime >= 120);
  assert(healthStatus.memoryUsage <= 250);
  assert(new Date(healthStatus.timestamp).getTime() <= Date.now());
  
  // Restore original functions
  process.uptime = originalUptime;
  process.memoryUsage = originalMemoryUsage;
});

test('getHealthStatus should handle missing package.json', () => {
  const originalReadFileSync = readFileSync as unknown as () => string;
  
  readFileSync = () => { throw new Error('File not found'); };
  
  const healthStatus = getHealthStatus();
  
  assert.strictEqual(healthStatus.version, 'unknown');
  
  // Restore original function
  readFileSync = originalReadFileSync as unknown as typeof readFileSync;
});

test('getHealthStatus should extract version from package.json', () => {
  const mockVersion = '1.0.0';
  const originalReadFileSync = readFileSync as unknown as () => string;
  
  readFileSync = (path: string) => {
    if (path === join(process.cwd(), 'package.json')) {
      return JSON.stringify({ version: mockVersion });
    }
    return '{}';
  };
  
  const healthStatus = getHealthStatus();
  
  assert.strictEqual(healthStatus.version, mockVersion);
  
  // Restore original function
  readFileSync = originalReadFileSync as unknown as typeof readFileSync;
});
