import assert from 'node:assert';
import { test } from 'node:test';
import { createOpenAIAdapter } from '../../src/adapters/openai-adapter.js';
import type { AgentRequest, AgentResponse } from '../../src/types.js';

test('OpenAI Adapter - successful execution', async () => {
  const mockOpenAI = {
    chat: {
      completions: {
        create: async () => ({
          choices: [{ message: { content: 'Test response' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 5, completion_tokens: 15 }
        })
      }
    }
  };

  const adapter = createOpenAIAdapter({ apiKey: 'fake-key', model: 'gpt-test' }, 'openai');
  (adapter as any).client = mockOpenAI;

  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: 'Test context',
    outputPath: undefined
  };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, true);
  assert.strictEqual(response.output, 'Test response');
});

test('OpenAI Adapter - network error scenario', async () => {
  const mockOpenAI = {
    chat: {
      completions: {
        create: async () => { throw new Error('Network error'); }
      }
    }
  };

  const adapter = createOpenAIAdapter({ apiKey: 'fake-key', model: 'gpt-test' }, 'openai');
  (adapter as any).client = mockOpenAI;

  const request: AgentRequest = {
    prompt: 'Test prompt',
    outputPath: undefined
  };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Network error');
});

test('OpenAI Adapter - output to file', async () => {
  let mockWriteFileContent: string | undefined;
  const mockWriteFile = async (path: string, content: string) => {
    mockWriteFileContent = content;
  };
  const mockMkdir = async () => {};

  const mockOpenAI = {
    chat: {
      completions: {
        create: async () => ({
          choices: [{ message: { content: 'Test response to file' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 5, completion_tokens: 15 }
        })
      }
    }
  };

  const adapter = createOpenAIAdapter({ apiKey: 'fake-key', model: 'gpt-test' }, 'openai');
  (adapter as any).client = mockOpenAI;
  (adapter as any).writeFile = mockWriteFile;
  (adapter as any).mkdir = mockMkdir;

  const request: AgentRequest = {
    prompt: 'Test prompt',
    outputPath: 'output.txt'
  };

  await adapter.execute(request);

  assert.strictEqual(mockWriteFileContent, 'Test response to file');
});
