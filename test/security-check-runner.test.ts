import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { spawn } from 'node:child_process';
import { promises as fsPromises } from 'node:fs';
import { resolve } from 'node:path';
import { scanCode, formatViolations, requiresSecurityScan, type SecurityScanResult } from '../src/security-scanner.js';

// Mocking dependencies
import { mockSpawn, mockReadFile, resetMocks } from './mocks.js';

// Mocked modules
jest.mock('node:child_process', () => ({
  spawn: jest.fn(),
}));

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
}));

// Test cases
test('should exit with code 0 when no files are changed', async () => {
  mockSpawn({ stdout: '\n', code: 0 });  // Simulating no changed files in git
  const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit called'); });

  try {
    await import('../src/security-check-runner.js');
  } catch (e) {
    expect(e.message).toBe('process.exit called');
  }

  expect(exitSpy).toHaveBeenCalledWith(0);
  resetMocks();
});

test('should exit with code 0 when no security-critical files are detected', async () => {
  mockSpawn({ stdout: 'file1.txt\nfile2.md\n', code: 0 });  // Simulating changed files
  jest.spyOn(require('../src/security-scanner.js'), 'requiresSecurityScan').mockReturnValue(false);
  const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit called'); });

  try {
    await import('../src/security-check-runner.js');
  } catch (e) {
    expect(e.message).toBe('process.exit called');
  }

  expect(exitSpy).toHaveBeenCalledWith(0);
  resetMocks();
});

test('should handle unexpected errors in git commands', async () => {
  mockSpawn({ error: new Error('git command error') });  // Simulating git command error
  const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit called'); });

  try {
    await import('../src/security-check-runner.js');
  } catch (e) {
    expect(e.message).toBe('process.exit called');
  }

  expect(exitSpy).toHaveBeenCalledWith(1);
  resetMocks();
});

test('should handle file reading errors gracefully', async () => {
  mockSpawn({ stdout: 'critical-file.js\n', code: 0 });  // Simulating changed critical file
  jest.spyOn(require('../src/security-scanner.js'), 'requiresSecurityScan').mockReturnValue(true);
  mockReadFile({ error: new Error('File read error') });  // Simulating file read error
  const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit called'); });

  try {
    await import('../src/security-check-runner.js');
  } catch (e) {
    expect(e.message).toBe('process.exit called');
  }

  expect(exitSpy).toHaveBeenCalledWith(1);
  resetMocks();
});
