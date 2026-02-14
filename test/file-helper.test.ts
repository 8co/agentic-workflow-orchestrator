import { strict as assert } from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { ensureDirectoryAndWriteFile, readFromFile, resolveFilePath } from '../src/file-helper.js';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const testDir = '.test-temp';

async function clearTestDirectory() {
  await fs.rm(testDir, { recursive: true, force: true });
}

beforeEach(async () => {
  await clearTestDirectory();
});

afterEach(async () => {
  await clearTestDirectory();
});

describe('file-helper', () => {

  describe('ensureDirectoryAndWriteFile', () => {
    it('should write content to a new file', async () => {
      const filePath = join(testDir, 'newfile.txt');
      const content = 'Hello, World!';
      await ensureDirectoryAndWriteFile(filePath, content);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      assert.equal(fileContent, content);
    });

    it('should overwrite an existing file', async () => {
      const filePath = join(testDir, 'existingfile.txt');
      const originalContent = 'Original Content';
      const newContent = 'New Content';

      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(filePath, originalContent, 'utf-8');

      await ensureDirectoryAndWriteFile(filePath, newContent);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      assert.equal(fileContent, newContent);
    });

    it('should handle special characters in filenames', async () => {
      const filePath = join(testDir, 'special_#@!.txt');
      const content = 'Special Characters Content';
      await ensureDirectoryAndWriteFile(filePath, content);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      assert.equal(fileContent, content);
    });

    it('should throw an error if content is empty', async () => {
      const filePath = join(testDir, 'emptycontent.txt');
      await assert.rejects(() => ensureDirectoryAndWriteFile(filePath, ''), {
        message: 'Invalid arguments: fullPath and content are required.'
      });
    });
  });

  describe('readFromFile', () => {
    it('should return file content as a string', async () => {
      const filePath = join(testDir, 'readfile.txt');
      const content = 'File to read';
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');

      const fileContent = await readFromFile(filePath);
      assert.equal(fileContent, content);
    });

    it('should return null if the file does not exist', async () => {
      const filePath = join(testDir, 'nonexistent.txt');
      const fileContent = await readFromFile(filePath);
      assert.equal(fileContent, null);
    });

    it('should handle special characters in filenames', async () => {
      const filePath = join(testDir, 'specialchars_#@!.txt');
      const content = 'File with special chars';
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');

      const fileContent = await readFromFile(filePath);
      assert.equal(fileContent, content);
    });
  });

  describe('resolveFilePath', () => {
    it('should resolve a relative file path to an absolute one', () => {
      const baseDir = '/some/dir';
      const relativePath = './file.txt';
      const resolvedPath = resolveFilePath(baseDir, relativePath);
      assert.ok(resolvedPath.startsWith('/some/dir'));
      assert.ok(resolvedPath.endsWith('file.txt'));
    });

    it('should throw an error if baseDir or relativePath is missing', () => {
      assert.throws(() => resolveFilePath('', 'file.txt'), {
        message: 'Invalid arguments: baseDir and relativePath are required.'
      });

      assert.throws(() => resolveFilePath('/some/dir', ''), {
        message: 'Invalid arguments: baseDir and relativePath are required.'
      });
    });
  });

});
