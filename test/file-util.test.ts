import { test } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeToFile, readFromFile } from '../src/file-util.js';
import { ensureDirectoryAndWriteFile } from '../src/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('writeToFile: should write content to a file', async () => {
  const testFilePath = `${__dirname}/test-output/success.txt`;
  const content = 'Hello, World!';

  await writeToFile(testFilePath, content);
  const result = await fs.readFile(testFilePath, 'utf8');
  
  assert.strictEqual(result, content);
});

test('readFromFile: should read content from a file', async () => {
  const testFilePath = `${__dirname}/test-input/sample.txt`;
  const expectedContent = 'Sample file content';

  await fs.writeFile(testFilePath, expectedContent);
  const result = await readFromFile(testFilePath);
  
  assert.strictEqual(result, expectedContent);
});

test('writeToFile: should throw an error if directory cannot be created', async () => {
  const invalidPath = `/root/test.txt`;
  const content = 'This should fail';

  await assert.rejects(
    async () => writeToFile(invalidPath, content),
    /EACCES|EPERM/
  );
});

test('readFromFile: should throw an error if file does not exist', async () => {
  const nonExistentFilePath = `${__dirname}/non-existent.txt`;

  await assert.rejects(
    async () => readFromFile(nonExistentFilePath),
    /ENOENT/
  );
});
