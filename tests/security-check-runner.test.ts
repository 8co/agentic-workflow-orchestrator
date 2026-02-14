import { strict as assert } from 'node:assert';
import { spawn } from 'node:child_process';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import * as mockFS from 'mock-fs';

// Mock the imported functions
// Assuming security-scanner exports mocked methods:
import {
  scanCode,
  formatViolations,
  requiresSecurityScan,
  type SecurityScanResult,
} from '../src/security-scanner.js';

// Mock implementations
scanCode.mockImplementation((code: string, file: string): SecurityScanResult => {
  if (file.includes('unsafe')) {
    return { safe: false, violations: [{ message: 'Unsafe code detected' }] };
  }
  return { safe: true, violations: [] };
});

formatViolations.mockImplementation(
  (result: SecurityScanResult, file: string): string => {
    return result.violations.map(v => `${file}: ${v.message}`).join('\n');
  }
);

requiresSecurityScan.mockImplementation((file: string): boolean => {
  return file.endsWith('.js');
});

test('getChangedFiles returns empty list if git command fails', async () => {
  const originalSpawn = spawn;
  let gitCommandExecuted = false;

  Object.assign(spawn, () => {
    const events = {
      on: (event: string, callback: (...args: any[]) => void) => {
        if (event === 'error') {
          callback(new Error('spawn ENOENT'));
        }
      },
    };
    gitCommandExecuted = true;
    return events;
  });

  const cwd = process.cwd();
  assert.deepEqual(await require('../src/security-check-runner.ts').getChangedFiles(cwd), []);
  assert.ok(gitCommandExecuted);

  Object.assign(spawn, originalSpawn);
});

test('handles readFile error', async () => {
  mockFS({
    'file1.js': 'console.log("Hello World");',
    'unsafe-file.js': 'console.log("This is unsafe");',
  });

  const originalReadFile = readFile;
  Object.assign(readFile, async (filePath: string, encoding: string) => {
    if (path.basename(filePath) === 'unsafe-file.js') {
      throw new Error('Permission denied');
    }
    return await originalReadFile(filePath, encoding);
  });

  await import('../src/security-check-runner.ts');

  Object.assign(readFile, originalReadFile);
  mockFS.restore();
});
