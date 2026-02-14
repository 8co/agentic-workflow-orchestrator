import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createAnthropicAdapter } from '../src/adapters/anthropic-adapter.js';

interface MockAnthropicClient {
  messages: {
    create: (params: any) => Promise<any>;
  };
}

function createMockClient(response: any): MockAnthropicClient {
  return {
    messages: {
      create: async () => response,
    },
  };
}

test('Anthropic Adapter should execute successfully with valid response', async () => {
  const mockClient = createMockClient({
    content: [{ type: 'text', text: 'Hello, world!' }],
    usage: { input_tokens: 10, output_tokens: 10 },
    stop_reason: 'end',
  });

  const adapter = createAnthropicAdapter({ apiKey: 'test_key', model: 'test_model' });
  (adapter as any).client = mockClient;

  const response = await adapter.execute({ prompt: 'Hello?', context: '', outputPath: '' });

  assert.ok(response.success);
  assert.strictEqual(response.output, 'Hello, world!');
});

test('Anthropic Adapter should handle invalid response structure', async () => {
  const mockClient = createMockClient({ foo: 'bar' });

  const adapter = createAnthropicAdapter({ apiKey: 'test_key', model: 'test_model' });
  (adapter as any).client = mockClient;

  const response = await adapter.execute({ prompt: 'Test?', context: '', outputPath: '' });

  assert.ok(!response.success);
  assert.strictEqual(response.error, 'API returned unexpected data structure.');
});

test('Anthropic Adapter should handle network errors', async () => {
  const mockClient = {
    messages: {
      create: async () => {
        const error: any = new Error('Network error');
        error.code = 'ENOTFOUND';
        throw error;
      },
    },
  };

  const adapter = createAnthropicAdapter({ apiKey: 'test_key', model: 'test_model' });
  (adapter as any).client = mockClient;

  const response = await adapter.execute({ prompt: 'Hello?', context: '', outputPath: '' });

  assert.ok(!response.success);
  assert.strictEqual(response.error, 'Network error: Unable to reach the API.');
});

test('Anthropic Adapter should handle API limit errors', async () => {
  const mockClient = {
    messages: {
      create: async () => {
        const error: any = new Error('Rate limit exceeded');
        error.response = { status: 429 };
        throw error;
      },
    },
  };

  const adapter = createAnthropicAdapter({ apiKey: 'test_key', model: 'test_model' });
  (adapter as any).client = mockClient;

  const response = await adapter.execute({ prompt: 'Hello?', context: '', outputPath: '' });

  assert.ok(!response.success);
  assert.strictEqual(response.error, 'API limit reached: Too many requests. Please try again later.');
});
