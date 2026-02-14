import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ensureDirectoryAndWriteFile,
  readFromFile,
  resolveFilePath,
} from './file-helper.js';

test('ensureDirectoryAndWriteFile creates file with content', async () => {
  const testDir = join(tmpdir(), 'test-dir');
  const testFile = join(testDir, 'test-file.txt');
  const content = 'Hello, World!';

  await ensureDirectoryAndWriteFile(testFile, content);

  const fileContent = await fs.readFile(testFile, 'utf-8');
  assert.equal(fileContent, content);
});

test('ensureDirectoryAndWriteFile throws with invalid args', async () => {
  await assert.rejects(
    () => ensureDirectoryAndWriteFile('', 'content'),
    new Error('Invalid arguments: fullPath and content are required.')
  );
  await assert.rejects(
    () => ensureDirectoryAndWriteFile('test-path', ''),
    new Error('Invalid arguments: fullPath and content are required.')
  );
});

test('readFromFile reads content from file', async () => {
  const testDir = join(tmpdir(), 'test-dir');
  const testFile = join(testDir, 'test-file.txt');
  const content = 'Readable content';

  await fs.mkdir(testDir, { recursive: true });
  await fs.writeFile(testFile, content, 'utf-8');

  const fileContent = await readFromFile(testFile);
  assert.equal(fileContent, content);
});

test('readFromFile returns null for non-existent file', async () => {
  const testFile = join(tmpdir(), 'non-existent-file.txt');

  const content = await readFromFile(testFile);
  assert.equal(content, null);
});

test('readFromFile throws with invalid args', async () => {
  await assert.rejects(
    () => readFromFile(''),
    new Error('Invalid argument: filePath is required.')
  );
});

test('resolveFilePath correctly resolves paths', () => {
  const baseDir = '/base/dir';
  const relativePath = 'file.txt';
  const expectedPath = join(baseDir, relativePath);

  const resolvedPath = resolveFilePath(baseDir, relativePath);
  assert.equal(resolvedPath, expectedPath);
});

test('resolveFilePath throws with invalid args', () => {
  assert.throws(
    () => resolveFilePath('', 'rel-path'),
    new Error('Invalid arguments: baseDir and relativePath are required.')
  );
  assert.throws(
    () => resolveFilePath('base-dir', ''),
    new Error('Invalid arguments: baseDir and relativePath are required.')
  );
});
