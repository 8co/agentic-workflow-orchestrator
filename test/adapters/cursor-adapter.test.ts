import { test } from 'node:test';
import assert from 'node:assert';
import { createCursorAdapter } from '../../src/adapters/cursor-adapter.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const adapter = createCursorAdapter();

test('execute writes prompt to specified output path', async (t) => {
  const tempDir = await mkdtemp(join(tmpdir(), 'cursor-adapter-test-'));
  const outputPath = join(tempDir, 'output.txt');
  const request = {
    prompt: 'Hello, this is a test prompt.',
    outputPath,
  };
  
  const response = await adapter.execute(request);

  assert.strictEqual(response.success, true);
  assert.strictEqual(response.output, outputPath);

  // Clean up
  await rm(tempDir, { recursive: true, force: true });
});

test('execute logs to stdout if no output path is specified', async () => {
  const request = {
    prompt: 'This is another test prompt with no output path.',
  };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, true);
  assert.strictEqual(response.output, '[stdout]');
});

test('handle error when writing to invalid output path', async () => {
  const invalidOutputPath = '/invalid-path/output.txt';
  const request = {
    prompt: 'This prompt should fail to write due to invalid path.',
    outputPath: invalidOutputPath,
  };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.match(response.error, /ENOENT|EACCES/);
});
