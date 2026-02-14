import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createOpenAIAdapter } from '../../src/adapters/openai-adapter.js';
import type { AgentRequest } from '../../src/types.js';

interface MockOpenAI {
  chat: {
    completions: {
      create: (params: Record<string, unknown>) => Promise<{ choices: Array<{ message: { content: string }, finish_reason: string }>, usage: { prompt_tokens: number, completion_tokens: number } }>;
    };
  };
}

test('OpenAI Adapter: should handle network errors', async () => {
  const mockClient: MockOpenAI = {
    chat: {
      completions: {
        create: async () => {
          throw new Error('Network Error: Connection lost');
        },
      },
    },
  };

  const adapter = createOpenAIAdapter(
    { apiKey: 'test-api-key', model: 'test-model' } as any,
  );

  adapter['client'] = mockClient;

  const request: AgentRequest = {
    prompt: 'Test network error handling',
    context: 'Test context',
    outputPath: undefined,
  };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Network error occurred. Please check your connection and try again.');
});

test('OpenAI Adapter: should handle timeout errors', async () => {
  const mockClient: MockOpenAI = {
    chat: {
      completions: {
        create: async () => {
          throw new Error('Request timed out after 5000ms');
        },
      },
    },
  };

  const adapter = createOpenAIAdapter(
    { apiKey: 'test-api-key', model: 'test-model' } as any,
  );

  adapter['client'] = mockClient;

  const request: AgentRequest = {
    prompt: 'Test timeout error handling',
    context: 'Test context',
    outputPath: undefined,
  };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Request timed out. Please try again later.');
});

test('OpenAI Adapter: should handle internal server errors', async () => {
  const mockClient: MockOpenAI = {
    chat: {
      completions: {
        create: async () => {
          throw new Error('500 Internal Server Error');
        },
      },
    },
  };

  const adapter = createOpenAIAdapter(
    { apiKey: 'test-api-key', model: 'test-model' } as any,
  );

  adapter['client'] = mockClient;

  const request: AgentRequest = {
    prompt: 'Test internal server error handling',
    context: 'Test context',
    outputPath: undefined,
  };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Internal server error. Try again after some time.');
});

test('OpenAI Adapter: should handle unauthorized errors', async () => {
  const mockClient: MockOpenAI = {
    chat: {
      completions: {
        create: async () => {
          throw new Error('401 Unauthorized: Invalid API key');
        },
      },
    },
  };

  const adapter = createOpenAIAdapter(
    { apiKey: 'test-api-key', model: 'test-model' } as any,
  );

  adapter['client'] = mockClient;

  const request: AgentRequest = {
    prompt: 'Test unauthorized error handling',
    context: 'Test context',
    outputPath: undefined,
  };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Unauthorized: Invalid API key or permissions issue.');
});
