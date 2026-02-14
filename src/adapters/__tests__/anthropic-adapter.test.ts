import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AgentAdapter } from '../../types.js';
import { createAnthropicAdapter } from '../anthropic-adapter.js';

interface MockClient {
  messages: {
    create: (params: { model: string; max_tokens: number; system: string; messages: Array<{ role: string; content: string }> }) => Promise<unknown>;
  };
}

function createMockClient(response: unknown): MockClient {
  return {
    messages: {
      create: async () => response,
    }
  };
}

test('createAnthropicAdapter - executes successfully with valid response', async () => {
  const mockResponse = {
    content: [{ type: 'text', text: 'test response' }],
    usage: { input_tokens: 10, output_tokens: 5 },
    stop_reason: 'stop_sequence'
  };

  const mockClient = createMockClient(mockResponse);

  const adapter = createAnthropicAdapter({ apiKey: 'test-key', model: 'test-model' }) as AgentAdapter;
  
  const originalClient = (adapter as any).client;
  (adapter as any).client = mockClient;

  const result = await adapter.execute({ prompt: 'test', context: '', outputPath: undefined });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.output, 'test response');

  (adapter as any).client = originalClient;
});

test('createAnthropicAdapter - handles malformed response', async () => {
  const mockResponse = {};

  const mockClient = createMockClient(mockResponse);

  const adapter = createAnthropicAdapter({ apiKey: 'test-key', model: 'test-model' }) as AgentAdapter;

  const originalClient = (adapter as any).client;
  (adapter as any).client = mockClient;

  const result = await adapter.execute({ prompt: 'test', context: '', outputPath: undefined });

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'API returned unexpected data structure.');

  (adapter as any).client = originalClient;
});

test('createAnthropicAdapter - handles API key failure', async () => {
  const mockResponse = { response: { status: 401 } };

  const mockClient = createMockClient(Promise.reject(mockResponse));

  const adapter = createAnthropicAdapter({ apiKey: 'invalid-key', model: 'test-model' }) as AgentAdapter;

  const originalClient = (adapter as any).client;
  (adapter as any).client = mockClient;

  const result = await adapter.execute({ prompt: 'test', context: '', outputPath: undefined });

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'Unexpected API response status.');

  (adapter as any).client = originalClient;
});

test('createAnthropicAdapter - handles API limit error', async () => {
  const mockResponse = { response: { status: 429 } };

  const mockClient = createMockClient(Promise.reject(mockResponse));

  const adapter = createAnthropicAdapter({ apiKey: 'test-key', model: 'test-model' }) as AgentAdapter;

  const originalClient = (adapter as any).client;
  (adapter as any).client = mockClient;

  const result = await adapter.execute({ prompt: 'test', context: '', outputPath: undefined });

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'API limit reached: Too many requests. Please try again later.');

  (adapter as any).client = originalClient;
});
