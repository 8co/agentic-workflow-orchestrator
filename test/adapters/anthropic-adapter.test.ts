import assert from 'node:assert';
import test from 'node:test';
import { createAnthropicAdapter } from '../../src/adapters/anthropic-adapter.js';
import type { AgentRequest } from '../../src/types.js';

test('createAnthropicAdapter - normal execution', async () => {
  const mockClient = {
    messages: {
      create: async () => ({
        content: [{ type: 'text', text: 'Test response' }],
        usage: { input_tokens: 10, output_tokens: 12 },
        stop_reason: 'stop',
      }),
    },
  };

  const originalCreate = (Anthropic as unknown);
  (Anthropic as unknown) = () => mockClient;

  const adapter = createAnthropicAdapter({ apiKey: 'dummy', model: 'claude-test' });

  const request: AgentRequest = {
    context: '',
    prompt: 'Hello',
    outputPath: undefined,
  };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, true);
  assert.ok(response.output.includes('Test response'));

  (Anthropic as unknown) = originalCreate;
});

test('createAnthropicAdapter - invalid response structure', async () => {
  const mockClient = {
    messages: {
      create: async () => ({}),
    },
  };

  const originalCreate = (Anthropic as unknown);
  (Anthropic as unknown) = () => mockClient;

  const adapter = createAnthropicAdapter({ apiKey: 'dummy', model: 'claude-test' });

  const request: AgentRequest = {
    context: '',
    prompt: 'Hello',
    outputPath: undefined,
  };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.ok(response.error.includes('unexpected data structure'));

  (Anthropic as unknown) = originalCreate;
});

test('createAnthropicAdapter - network error', async () => {
  const mockClient = {
    messages: {
      create: async () => {
        throw new Error('Network error');
      },
    },
  };

  const isNetworkError = (err: Error) => err.message === 'Network error';
  const originalNetworkError = (isNetworkError as unknown);
  (isNetworkError as unknown) = (err: Error) => err.message === 'Network error';

  const originalCreate = (Anthropic as unknown);
  (Anthropic as unknown) = () => mockClient;

  const adapter = createAnthropicAdapter({ apiKey: 'dummy', model: 'claude-test' });

  const request: AgentRequest = {
    context: '',
    prompt: 'Hello',
    outputPath: undefined,
  };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.ok(response.error.includes('Network error'));

  (Anthropic as unknown) = originalCreate;
  (isNetworkError as unknown) = originalNetworkError;
});

test('createAnthropicAdapter - API limit error', async () => {
  const mockClient = {
    messages: {
      create: async () => {
        const error = new Error('API limit error');
        (error as { response?: { status: number } }).response = { status: 429 };
        throw error;
      },
    },
  };

  const originalCreate = (Anthropic as unknown);
  (Anthropic as unknown) = () => mockClient;

  const adapter = createAnthropicAdapter({ apiKey: 'dummy', model: 'claude-test' });

  const request: AgentRequest = {
    context: '',
    prompt: 'Hello',
    outputPath: undefined,
  };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.ok(response.error.includes('API limit reached'));

  (Anthropic as unknown) = originalCreate;
});
