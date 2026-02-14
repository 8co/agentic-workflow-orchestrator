import { strict as assert } from 'node:assert';
import { describe, it, beforeEach } from 'node:test';
import { parseCodeBlocks, writeFiles, readProjectFile, buildFileContext } from './file-writer.js';
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const TEMP_DIR = './temp-test-dir';

beforeEach(async () => {
  await rm(TEMP_DIR, { recursive: true, force: true });
  await mkdir(TEMP_DIR, { recursive: true });
});

describe('parseCodeBlocks', () => {
  it('should parse simple code block with filepath', () => {
    const input = "```typescript:src/example.ts\nconsole.log('Hello, World!');\n```";
    const result = parseCodeBlocks(input);
    assert.deepEqual(result, [{
      filePath: 'src/example.ts',
      content: "console.log('Hello, World!');\n",
      language: 'typescript'
    }]);
  });

  it('should parse code block with HTML comment for filepath', () => {
    const input = "<!-- file: src/comment-example.ts -->\n```typescript\nconsole.log('Comment Example');\n```";
    const result = parseCodeBlocks(input);
    assert.deepEqual(result, [{
      filePath: 'src/comment-example.ts',
      content: "console.log('Comment Example');\n",
      language: 'typescript'
    }]);
  });

  it('should handle nested code blocks with more backticks', () => {
    const input = "````typescript:src/nested.ts\n```inner\nCode with `code`\ncontent\n```\n````";
    const result = parseCodeBlocks(input);
    assert.deepEqual(result, [{
      filePath: 'src/nested.ts',
      content: "```inner\nCode with `code`\ncontent\n```\n",
      language: 'typescript'
    }]);
  });

  it('should ignore non-matching text', () => {
    const input = "This is just some text.\nAnother line.";
    const result = parseCodeBlocks(input);
    assert.deepEqual(result, []);
  });
});

describe('writeFiles', () => {
  it('should write a file successfully', async () => {
    const changes = [{
      filePath: 'test-file.ts',
      content: "console.log('test');\n"
    }];

    const result = await writeFiles(changes, TEMP_DIR);
    assert.deepEqual(result.filesWritten, [{
      filePath: 'test-file.ts',
      content: "console.log('test');\n"
    }]);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.blocked, []);

    const content = await readFile(resolve(TEMP_DIR, 'test-file.ts'), 'utf-8');
    assert.equal(content, "console.log('test');\n");
  });

  it('should not write a protected file', async () => {
    const changes = [{
      filePath: 'src/file-writer.ts',
      content: "console.log('Do not overwrite');\n"
    }];

    const result = await writeFiles(changes, TEMP_DIR);
    assert.deepEqual(result.filesWritten, []);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.blocked, ['src/file-writer.ts']);
  });

  it('should create directories and write files', async () => {
    const changes = [{
        filePath: 'nested/dir/test-file.ts',
        content: "console.log('nested');\n"
    }];

    const result = await writeFiles(changes, TEMP_DIR);
    assert.deepEqual(result.filesWritten, [{
        filePath: 'nested/dir/test-file.ts',
        content: "console.log('nested');\n"
    }]);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.blocked, []);

    const content = await readFile(resolve(TEMP_DIR, 'nested/dir/test-file.ts'), 'utf-8');
    assert.equal(content, "console.log('nested');\n");
  });

  it('should not allow writing outside of target directory', async () => {
    const changes = [{
      filePath: '../escape.ts',
      content: "console.log('escaped');\n"
    }];

    const result = await writeFiles(changes, TEMP_DIR);
    assert.deepEqual(result.errors, ['Skipped ../escape.ts: path escapes target directory']);
    assert.deepEqual(result.filesWritten, []);
    assert.deepEqual(result.blocked, []);
  });
});

describe('readProjectFile', () => {
  it('should read an existing file', async () => {
    const filePath = 'existing-file.ts';
    const content = "console.log('file content');\n";
    await writeFile(resolve(TEMP_DIR, filePath), content, 'utf-8');

    const result = await readProjectFile(filePath, TEMP_DIR);
    assert.equal(result, content);
  });

  it('should return null for a non-existing file', async () => {
    const result = await readProjectFile('non-existing-file.ts', TEMP_DIR);
    assert.equal(result, null);
  });
});

describe('buildFileContext', () => {
  it('should build context from multiple files', async () => {
    const filePath1 = 'file1.ts';
    const content1 = "console.log('file1');\n";
    await writeFile(resolve(TEMP_DIR, filePath1), content1, 'utf-8');

    const filePath2 = 'file2.ts';
    const content2 = "console.log('file2');\n";
    await writeFile(resolve(TEMP_DIR, filePath2), content2, 'utf-8');

    const result = await buildFileContext([filePath1, filePath2], TEMP_DIR);
    assert.equal(result, `--- ${filePath1} ---\n${content1}\n\n--- ${filePath2} ---\n${content2}`);
  });

  it('should ignore non-existing files', async () => {
    const filePath = 'file1.ts';
    const content = "console.log('file1');\n";
    await writeFile(resolve(TEMP_DIR, filePath), content, 'utf-8');

    const result = await buildFileContext([filePath, 'nonexistent.ts'], TEMP_DIR);
    assert.equal(result, `--- ${filePath} ---\n${content}`);
  });
});
