import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { getHealthStatus } from './health.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createLogger } from './logger.js';

type MemoryUsageFn = () => {
  heapUsed: number;
  rss: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
};

// Mock the logger
const loggerOutput: string[] = [];
const logger = createLogger('health');
logger.error = (message: string) => loggerOutput.push(`ERROR: ${message}`);
logger.warn = (message: string) => loggerOutput.push(`WARN: ${message}`);
logger.info = (message: string) => loggerOutput.push(`INFO: ${message}`);
logger.debug = (message: string) => loggerOutput.push(`DEBUG: ${message}`);

// Helper functions to simulate errors
function mockMemoryUsageError() {
  (process.memoryUsage as unknown as MemoryUsageFn) = () => {
    throw new Error('Heap used is NaN');
  };
}

function mockReadFileSyncThrow() {
  (readFileSync as unknown as (filePath: string, encoding: string) => string) = () => {
    throw new Error('Failed to read file');
  };
}

test('should handle version extraction error', () => {
  mockReadFileSyncThrow();
  
  const status = getHealthStatus();
  assert.equal(status.version, undefined);
  assert(loggerOutput.some(output => output.includes('Version extraction error: Failed to parse package.json for version. Failed to read file')));
});

test('should handle memory usage retrieval error', () => {
  mockMemoryUsageError();

  const status = getHealthStatus();
  assert.equal(status.memoryUsage, 0);
  assert(loggerOutput.some(output => output.includes('Memory usage retrieval error: Unable to calculate memory usage. Heap used is NaN')));
});
