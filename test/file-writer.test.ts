import { strict as assert } from 'node:assert';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseCodeBlocks, writeFiles, BuildFileContext, PROTECTED_FILES, FileChange, WriteResult } from '../src/file-writer.js';

async function resetTestEnvironment(dir: string) {
  await mkdir(dir, { recursive: true });
}

(async () => {
  const testDir = join(tmpdir(), 'file-writer-tests');
  await resetTestEnvironment(testDir);

  // Test parseCodeBlocks()
  {
    const llmOutput = `
      \`\`\`typescript:src/test.ts
      console.log('Hello, World!');
      \`\`\`

      <!-- file: src/anotherTest.ts -->
      \`\`\`typescript
      console.log('Another test');
      \`\`\`
    `;
    const fileChanges = parseCodeBlocks(llmOutput);
    assert.equal(fileChanges.length, 2);
    assert.deepEqual(fileChanges[0], {
      filePath: 'src/test.ts',
      content: "console.log('Hello, World!');\n",
      language: 'typescript'
    });
    assert.deepEqual(fileChanges[1], {
      filePath: 'src/anotherTest.ts',
      content: "console.log('Another test');\n",
      language: 'typescript'
    });
  }

  // Test writeFiles(): normal case
  {
    const fileChanges: FileChange[] = [
      { filePath: 'test1.txt', content: 'Test 1 content\n' },
      { filePath: 'test2.txt', content: 'Test 2 content\n' }
    ];
    const writeResult = await writeFiles(fileChanges, testDir);
    assert.strictEqual(writeResult.filesWritten.length, 2);
    assert.strictEqual(writeResult.errors.length, 0);
    
    const content1 = await readFile(join(testDir, 'test1.txt'), 'utf-8');
    const content2 = await readFile(join(testDir, 'test2.txt'), 'utf-8');
    assert.strictEqual(content1, 'Test 1 content\n');
    assert.strictEqual(content2, 'Test 2 content\n');
  }

  // Test writeFiles(): protected files
  {
    const protectedFilePath = Array.from(PROTECTED_FILES)[0]; // Pick the first protected file from the set
    const fileChanges: FileChange[] = [
      { filePath: protectedFilePath, content: 'Should be blocked\n' }
    ];
    const writeResult = await writeFiles(fileChanges, testDir, { enforceProtected: true });
    assert.strictEqual(writeResult.blocked.length, 1);
    assert.strictEqual(writeResult.filesWritten.length, 0);
    assert.strictEqual(writeResult.errors.length, 0);
  }

  // Test writeFiles(): path escape attempt
  {
    const fileChanges: FileChange[] = [
      { filePath: '../escape.txt', content: 'Should not be allowed\n' }
    ];
    const writeResult = await writeFiles(fileChanges, testDir);
    assert.strictEqual(writeResult.errors.length, 1);
    assert.strictEqual(writeResult.filesWritten.length, 0);
    assert.strictEqual(writeResult.blocked.length, 0);
  }
})();
