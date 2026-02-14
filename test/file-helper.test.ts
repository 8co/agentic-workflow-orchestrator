import { strict as assert } from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { ensureDirectoryAndWriteFile, readFromFile, resolveFilePath } from '../src/file-helper.js';

// Utility function to create a temporary file path
function createTempFilePath(fileName: string): string {
  return join(tmpdir(), fileName);
}

describe('file-helper module', () => {
  const testFilePath = createTempFilePath('test-file.txt');
  const nonExistentPath = createTempFilePath('non-existent-dir/test-file.txt');

  afterEach(async () => {
    try {
      await fs.rm(testFilePath, { force: true });
      await fs.rmdir(dirname(nonExistentPath), { recursive: true });
    } catch {
      // ignore errors, probably the files or directories do not exist
    }
  });

  describe('ensureDirectoryAndWriteFile', () => {
    it('should create directories and write content to the given file path', async () => {
      const content = 'Test content';
      await ensureDirectoryAndWriteFile(testFilePath, content);
      const fileContent = await fs.readFile(testFilePath, 'utf-8');
      assert.equal(fileContent, content);
    });

    it('should throw an error when given invalid file path input', async () => {
      await assert.rejects(async () => {
        await ensureDirectoryAndWriteFile('', 'Content');
      }, {
        message: "Invalid argument: fullPath is required and must be a string."
      });
    });

    it('should throw an error when given invalid content input', async () => {
      await assert.rejects(async () => {
        await ensureDirectoryAndWriteFile(testFilePath, '');
      }, {
        message: "Invalid argument: content is required and must be a string."
      });
    });

    it('should throw an error when the path is not writable', async () => {
      await assert.rejects(async () => {
        await ensureDirectoryAndWriteFile('/root/test-file.txt', 'Content');
      }, {
        message: /Failed to write to file at path '\/root\/test-file.txt'/
      });
    });
  });

  describe('readFromFile', () => {
    const fileContent = 'Content to read';

    beforeEach(async () => {
      await ensureDirectoryAndWriteFile(testFilePath, fileContent);
    });

    it('should read content from an existing file', async () => {
      const content = await readFromFile(testFilePath);
      assert.equal(content, fileContent);
    });

    it('should return null if the file does not exist', async () => {
      const content = await readFromFile(nonExistentPath);
      assert.equal(content, null);
    });

    it('should throw an error when given invalid file path input', async () => {
      await assert.rejects(async () => {
        await readFromFile('');
      }, {
        message: "Invalid argument: filePath is required and must be a string."
      });
    });
  });

  describe('resolveFilePath', () => {
    it('should resolve relative paths to absolute', () => {
      const base = '/base/dir';
      const relative = 'file.txt';
      const resolved = resolveFilePath(base, relative);
      assert.equal(resolved, resolve(base, relative));
    });

    it('should throw an error when given invalid base directory input', () => {
      assert.throws(() => {
        resolveFilePath('', 'file.txt');
      }, {
        message: "Invalid argument: baseDir is required and must be a string."
      });
    });

    it('should throw an error when given invalid relative path input', () => {
      assert.throws(() => {
        resolveFilePath('/base/dir', '');
      }, {
        message: "Invalid argument: relativePath is required and must be a string."
      });
    });
  });
});
