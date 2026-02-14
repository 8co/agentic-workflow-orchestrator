import { createCursorAdapter } from '../../src/adapters/cursor-adapter.js';
import { AgentRequest } from '../../src/types.js';
import assert from 'node:assert';
import { test } from 'node:test';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const cursorAdapter = createCursorAdapter();

test('Cursor Adapter - Successful execution to outputPath', async (t) => {
  let writtenContent = '';
  const originalWriteFile = writeFile;
  
  await t.test('setup', async () => {
    (await import('node:fs/promises')).writeFile = async (path: string, content: string) => {
      writtenContent = content;
    };
  });

  try {
    const request: AgentRequest = {
      prompt: 'Test prompt\nLine 2\nLine 3',
      outputPath: 'test-output-path/output.txt',
    };

    const response = await cursorAdapter.execute(request);

    assert.strictEqual(response.success, true);
    assert.strictEqual(response.output, request.outputPath);
    assert.strictEqual(writtenContent, request.prompt);
  } finally {
    (await import('node:fs/promises')).writeFile = originalWriteFile;
  }
});

test('Cursor Adapter - Successful execution to stdout', async () => {
  const request: AgentRequest = {
    prompt: 'Test prompt',
  };

  const response = await cursorAdapter.execute(request);

  assert.strictEqual(response.success, true);
  assert.strictEqual(response.output, '[stdout]');
});

test('Cursor Adapter - Error with ENOENT', async (t) => {
  const request: AgentRequest = {
    prompt: 'Test prompt',
    outputPath: '/invalid-directory/output.txt',
  };

  let mkdirCalledWith;
  const originalMkdir = mkdir;
  
  try {
    await t.test('setup', async () => {
      (await import('node:fs/promises')).mkdir = async (path: string, options: any) => {
        mkdirCalledWith = path;
        throw new Error('ENOENT');
      };
    });

    const response = await cursorAdapter.execute(request);

    assert.strictEqual(response.success, false);
    assert.ok(response.error?.includes('File path not found'));
  } finally {
    (await import('node:fs/promises')).mkdir = originalMkdir;
  }
});

test('Cursor Adapter - Error with EACCES', async (t) => {
  const request: AgentRequest = {
    prompt: 'Test prompt',
    outputPath: '/protected-directory/output.txt',
  };

  let mkdirCalledWith;
  const originalMkdir = mkdir;

  try {
    await t.test('setup', async () => {
      (await import('node:fs/promises')).mkdir = async (path: string, options: any) => {
        mkdirCalledWith = path;
        throw new Error('EACCES');
      };
    });

    const response = await cursorAdapter.execute(request);

    assert.strictEqual(response.success, false);
    assert.ok(response.error?.includes('Permission denied'));
  } finally {
    (await import('node:fs/promises')).mkdir = originalMkdir;
  }
});

test('Cursor Adapter - Unhandled error', async (t) => {
  const request: AgentRequest = {
    prompt: 'Test prompt',
    outputPath: '/some-path/output.txt',
  };

  const originalWriteFile = writeFile;

  try {
    await t.test('setup', async () => {
      (await import('node:fs/promises')).writeFile = async () => {
        throw new Error('Unexpected Error');
      };
    });

    const response = await cursorAdapter.execute(request);

    assert.strictEqual(response.success, false);
    assert.ok(response.error?.includes('Unhandled error: Unexpected Error'));
  } finally {
    (await import('node:fs/promises')).writeFile = originalWriteFile;
  }
});
