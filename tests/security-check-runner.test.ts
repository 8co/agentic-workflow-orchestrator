import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, it, before, mock } from 'node:test';
import assert from 'node:assert';
import {
  scanCode,
  formatViolations,
  requiresSecurityScan,
  type SecurityScanResult
} from '../src/security-scanner.js';
import { main, getChangedFiles } from '../src/security-check-runner.js';

// Mock the dependencies: spawn, readFile, and security scanner methods
let mockSpawn: typeof spawn;
let mockReadFile: typeof readFile;

before(() => {
  mockSpawn = spawn;
  mockReadFile = readFile;

  globalThis.spawn = mock.fn((command, args, options) => {
    let mockStdout = '';
    if (options && options.cwd) {
      // Simulating git in a non-repo or with no changes
      if (options.cwd.includes('empty')) {
        return {
          stdout: { on: (_, callback) => { callback(Buffer.from('')); } },
          on: (_, callback) => { callback(1); }
        };
      }
      // Simulating git returning changed files
      if (options.cwd.includes('changed')) {
        mockStdout = 'file1.ts\nfile2.ts';
      }
    }
    return {
      stdout: { on: (_, callback) => { callback(Buffer.from(mockStdout)); } },
      on: (_, callback) => { callback(0); }
    };
  });

  globalThis.readFile = mock.fn((path: string, encoding: string) => {
    if (path.includes('file1.ts')) {
      return Promise.resolve('const a = 1;');
    }
    if (path.includes('file2.ts')) {
      return Promise.resolve('dangerous code');
    }
    return Promise.resolve('');
  });

  globalThis.scanCode = mock.fn((code: string, file: string) => {
    if (file.includes('file1.ts')) {
      return { safe: true };
    }
    if (file.includes('file2.ts')) {
      return { safe: false, violations: [{ message: 'Security issue detected' }] };
    }
    return { safe: true };
  });

  globalThis.requiresSecurityScan = mock.fn((file: string) => {
    return file.endsWith('.ts');
  });

  globalThis.formatViolations = mock.fn((result: SecurityScanResult, file: string) => {
    if (!result.safe) {
      return `File: ${file} - ${result.violations.map(v => v.message).join(', ')}`;
    }
    return `File: ${file} is safe`;
  });
});

describe('Security Check Runner', () => {
  it('should exit with success when no files are changed', async () => {
    mockSpawn.mockImplementationOnce(() => ({
      stdout: { on: (_, callback) => { callback(Buffer.from('')); } },
      on: (_, callback) => { callback(1); }
    }));

    await assert.doesNotReject(async () => {
      await main();
    });
  });

  it('should scan changed files and report if all are safe', async () => {
    await assert.doesNotReject(async () => {
      await main();
    });
  });

  it('should scan changed files and report violations', async () => {
    mockReadFile.mockImplementationOnce((path: string, encoding: string) => Promise.resolve('dangerous code'));

    await assert.rejects(async () => {
      await main();
    });
  });

  describe('getChangedFiles()', () => {
    it('should return an empty array if no git changes are detected', async () => {
      const changedFiles = await getChangedFiles('empty');
      assert.strictEqual(changedFiles.length, 0);
    });

    it('should return a list of changed files when changes are detected', async () => {
      const changedFiles = await getChangedFiles('changed');
      assert.deepStrictEqual(changedFiles, ['file1.ts', 'file2.ts']);
    });
  });
});
