import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { parseCodeBlocks, writeFiles, buildFileContext, readProjectFile, FileChange, WriteResult } from './file-writer.js';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { PROTECTED_FILES } from './file-writer.js';

const mock_fs = {
  writes: new Map<string, string>(),
  mkdirs: new Set<string>(),
  readContent: new Map<string, string | null>(),

  reset() {
    this.writes.clear();
    this.mkdirs.clear();
    this.readContent.clear();
  },

  async writeFile(filePath: string, content: string) {
    this.writes.set(filePath, content);
  },

  async mkdir(dirPath: string) {
    this.mkdirs.add(dirPath);
  },

  async readFile(filePath: string) {
    const content = this.readContent.get(filePath);
    if (content === undefined) {
      throw new Error('File not found');
    }
    return content;
  },
};

(test as any).before(async () => {
  // Overwriting actual implementations with mocks.
  (writeFile as any) = mock_fs.writeFile.bind(mock_fs);
  (mkdir as any) = mock_fs.mkdir.bind(mock_fs);
  (readFile as any) = mock_fs.readFile.bind(mock_fs);
});

test('parseCodeBlocks correctly parses code blocks', async () => {
  const input = `
<!-- file: src/new-file.ts -->
\`\`\`typescript
export const x = 10;
\`\`\`
\`\`\`typescript:src/another-file.ts
export const y = 20;
\`\`\`
  `;
  const expected: FileChange[] = [
    { filePath: 'src/new-file.ts', content: 'export const x = 10;\n', language: 'typescript' },
    { filePath: 'src/another-file.ts', content: 'export const y = 20;\n', language: 'typescript' }
  ];

  const result = parseCodeBlocks(input);

  assert.deepEqual(result, expected);
});

test('writeFiles handles invalid paths', async () => {
  const changes: FileChange[] = [
    { filePath: '../outside-dir.ts', content: 'console.log(\'invalid\');' }
  ];
  const targetDir = '/valid-target';

  const result: WriteResult = await writeFiles(changes, targetDir);

  assert.strictEqual(result.errors.length, 1);
  assert.match(result.errors[0], /path escapes target directory/);
});

test('writeFiles respects protected files', async () => {
  const changes: FileChange[] = [
    { filePath: 'src/config.ts', content: 'console.log(\'change\');' }
  ];
  const targetDir = '/valid-target';

  const result: WriteResult = await writeFiles(changes, targetDir);

  assert.strictEqual(result.blocked.length, 1);
  assert.strictEqual(result.blocked[0], 'src/config.ts');
  assert.strictEqual(result.errors.length, 0);
  assert.strictEqual(result.filesWritten.length, 0);
});

test('writeFiles writes files and creates directories', async () => {
  mock_fs.reset();
  const changes: FileChange[] = [
    { filePath: 'src/utils/new-file.ts', content: 'console.log(\'new file\');' }
  ];
  const targetDir = '/valid-target';

  const result: WriteResult = await writeFiles(changes, targetDir);

  const fullPath = resolve(targetDir, 'src/utils/new-file.ts');
  const dirPath = dirname(fullPath);

  assert.strictEqual(result.filesWritten.length, 1);
  assert.strictEqual(result.errors.length, 0);
  assert.strictEqual(result.blocked.length, 0);
  assert.ok(mock_fs.mkdirs.has(dirPath));
  assert.strictEqual(mock_fs.writes.get(fullPath), 'console.log(\'new file\');');
});

test('readProjectFile returns null for non-existent files', async () => {
  mock_fs.reset();

  const result = await readProjectFile('non-existent.ts', '/target-dir');
  assert.strictEqual(result, null);
});

test('buildFileContext builds context from files', async () => {
  mock_fs.reset();
  mock_fs.readContent.set('/target-dir/file1.ts', 'export const file1 = 1;');
  mock_fs.readContent.set('/target-dir/file2.ts', 'export const file2 = 2;');

  const result = await buildFileContext(['file1.ts', 'file2.ts'], '/target-dir');

  const expected = `--- file1.ts ---
export const file1 = 1;

--- file2.ts ---
export const file2 = 2;`;

  assert.strictEqual(result, expected);
});
