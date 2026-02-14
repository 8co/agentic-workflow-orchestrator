import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { EnhancedLogger } from '../src/enhanced-logger.js';

// Helper function to mock fs functions
const mockFsMethods = (methods: Partial<typeof fs>) => {
  for (const [methodName, implementation] of Object.entries(methods)) {
    if (implementation) {
      jest.spyOn(fs, methodName as keyof typeof fs).mockImplementation(implementation as any);
    }
  }
};

test('EnhancedLogger: logInfo should handle file write errors gracefully', () => {
  const logger = EnhancedLogger.getInstance('test.log');

  // Mock the appendFileSync and mkdirSync to throw an error
  mockFsMethods({
    appendFileSync: () => { throw new Error('Mocked file write error'); },
  });

  // Capture logs from console
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  logger.logInfo('Test message');

  // Assert that error details were logged to console
  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to write to log file'));
});

test('EnhancedLogger: recovery attempt on log directory creation failure', () => {
  const logger = EnhancedLogger.getInstance('test.log');

  // Mock mkdirSync to throw an error first, then succeed
  let mkdirCalled = false;
  mockFsMethods({
    appendFileSync: () => { throw new Error('Mocked append file error'); },
    mkdirSync: (dir: fs.PathLike, options: fs.MakeDirectoryOptions) => {
      if (mkdirCalled) {
        return; // succeed on second attempt
      }
      mkdirCalled = true;
      throw new Error('Mocked mkdir error');
    },
  });

  // Capture logs from console
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  logger.logInfo('Test message');

  // Check if error handling log is invoked twice: once for original error, once for recovery error
  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Recovery attempt failed'));

  consoleSpy.mockRestore();
});
