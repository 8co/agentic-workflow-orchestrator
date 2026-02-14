import { strict as assert } from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join, dirname, sep } from 'node:path';
import { ensureDirectoryAndWriteFile, readFromFile, resolveFilePath } from '../src/file-helper.js';

const TEST_DIR = './test-output';
const TEST_FILE_PATH = join(TEST_DIR, 'test.txt');
const TEST_CONTENT = 'Hello, World!';

describe('file-helper module', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe('ensureDirectoryAndWriteFile', () => {
    it('should create a file with the specified content', async () => {
      await ensureDirectoryAndWriteFile(TEST_FILE_PATH, TEST_CONTENT);
      const content = readFileSync(TEST_FILE_PATH, 'utf-8');
      assert.equal(content, TEST_CONTENT);
    });

    it('should handle existing directories correctly', async () => {
      await ensureDirectoryAndWriteFile(TEST_FILE_PATH, TEST_CONTENT);
      const content = readFileSync(TEST_FILE_PATH, 'utf-8');
      assert.equal(content, TEST_CONTENT);
    });

    it('should throw error if the path is invalid or permissions are incorrect', async () => {
      const invalidPath = '/invalid-path/test.txt';
      await assert.rejects(
        () => ensureDirectoryAndWriteFile(invalidPath, TEST_CONTENT),
        { message: new RegExp('Failed to write to file') }
      );
    });
  });

  describe('readFromFile', () => {
    it('should read the file content correctly', async () => {
      await ensureDirectoryAndWriteFile(TEST_FILE_PATH, TEST_CONTENT);
      const content = await readFromFile(TEST_FILE_PATH);
      assert.equal(content, TEST_CONTENT);
    });

    it('should return null for non-existent files', async () => {
      const content = await readFromFile(join(TEST_DIR, 'non-existent.txt'));
      assert.equal(content, null);
    });

    it('should throw error for invalid file paths', async () => {
      const invalidPath = `invalid${sep}path${sep}test.txt`;
      await ensureDirectoryAndWriteFile(TEST_FILE_PATH, TEST_CONTENT);
      await assert.rejects(
        () => readFromFile(invalidPath),
        { message: new RegExp('Failed to read from file') }
      );
    });
  });

  describe('resolveFilePath', () => {
    it('should correctly resolve a relative path to an absolute path', () => {
      const baseDir = '/base/dir';
      const relativePath = 'relative/path/to/file.txt';
      const resolvedPath = resolveFilePath(baseDir, relativePath);
      assert.equal(resolvedPath, join(baseDir, relativePath));
    });
  });
});
