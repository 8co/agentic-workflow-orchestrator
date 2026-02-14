import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createCursorAdapter } from '../../src/adapters/cursor-adapter.js';
import type { AgentRequest, AgentResponse } from '../../src/types.js';
import { writeFile, mkdir } from 'node:fs/promises';

// Mock implementations
let mkdirMock: jest.Mock;
let writeFileMock: jest.Mock;

beforeEach(() => {
  mkdirMock = jest.fn().mockResolvedValue(undefined);
  writeFileMock = jest.fn().mockResolvedValue(undefined);

  jest.mock('node:fs/promises', () => ({
    mkdir: mkdirMock,
    writeFile: writeFileMock,
  }));
});

describe('Cursor Adapter', () => {
  const cursorAdapter = createCursorAdapter();

  it('should return success response when executing with valid prompt', async () => {
    const request: AgentRequest = { prompt: 'Hello, world!', outputPath: '/tmp/test-output.txt' };
    const response: AgentResponse = await cursorAdapter.execute(request);

    assert.strictEqual(response.success, true);
    assert.strictEqual(response.output, '/tmp/test-output.txt');
    assert.ok(response.durationMs >= 0);
    assert.ok(mkdirMock.calledOnce);
    assert.ok(writeFileMock.calledOnce);
  });

  it('should handle ENOENT error when output path does not exist', async () => {
    mkdirMock.mockRejectedValueOnce({ code: 'ENOENT' });

    const request: AgentRequest = { prompt: 'Hello, world!', outputPath: '/non-existent-path/output.txt' };
    const response: AgentResponse = await cursorAdapter.execute(request);

    assert.strictEqual(response.success, false);
    assert.strictEqual(response.error, 'File path not found. Please ensure the directory exists.');
  });

  it('should handle EACCES error when lacking permission to write to output path', async () => {
    writeFileMock.mockRejectedValueOnce({ code: 'EACCES' });

    const request: AgentRequest = { prompt: 'Hello, world!', outputPath: '/protected-path/output.txt' };
    const response: AgentResponse = await cursorAdapter.execute(request);

    assert.strictEqual(response.success, false);
    assert.strictEqual(response.error, 'Permission denied. Check your access rights to the output path.');
  });

  it('should handle generic errors', async () => {
    writeFileMock.mockRejectedValueOnce(new Error('Generic error'));

    const request: AgentRequest = { prompt: 'Hello, world!', outputPath: '/invalid-path/output.txt' };
    const response: AgentResponse = await cursorAdapter.execute(request);

    assert.strictEqual(response.success, false);
    assert.strictEqual(response.error, 'Generic error');
  });

  it('should not attempt to write when no output path is provided', async () => {
    const request: AgentRequest = { prompt: 'Just log this' };
    const response: AgentResponse = await cursorAdapter.execute(request);

    assert.strictEqual(response.success, true);
    assert.strictEqual(response.output, '[stdout]');
    assert.ok(response.durationMs >= 0);
    assert.ok(mkdirMock.notCalled);
    assert.ok(writeFileMock.notCalled);
  });
});
