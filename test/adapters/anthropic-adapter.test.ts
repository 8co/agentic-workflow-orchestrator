import test from 'node:test';
import assert from 'node:assert';
import { createAnthropicAdapter } from '../../src/adapters/anthropic-adapter';
import type { AgentRequest } from '../../src/types';

const mockClient = {
  messages: {
    create: async (options: any) => {
      if (options.system.includes('network_error')) {
        const error = new Error('Network error: Unable to reach the API');
        (error as any).code = 'ENOTFOUND';
        throw error;
      }
      if (options.system.includes('api_limit')) {
        const error = new Error('API limit reached');
        (error as any).response = { status: 429 };
        throw error;
      }
      if (options.system.includes('invalid_response')) {
        return { invalid: true };
      }
      return {
        content: [
          { type: 'text', text: 'Response from model' }
        ],
        usage: {
          input_tokens: 10,
          output_tokens: 5
        },
        stop_reason: 'end'
      };
    }
  }
};

test('Anthropic Adapter: executes a successful request', async () => {
  const adapter = createAnthropicAdapter({ apiKey: 'dummy', model: 'claude' });
  const request: AgentRequest = { prompt: 'Generate code', context: '' };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, true);
  assert.strictEqual(response.output, 'Response from model');
});

test('Anthropic Adapter: handles network error', async () => {
  const adapter = createAnthropicAdapter({ apiKey: 'dummy', model: 'claude' });
  (adapter as any).client = mockClient;
  const request: AgentRequest = { prompt: 'network_error', context: '' };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Network error: Unable to reach the API.');
});

test('Anthropic Adapter: handles API limit error', async () => {
  const adapter = createAnthropicAdapter({ apiKey: 'dummy', model: 'claude' });
  (adapter as any).client = mockClient;
  const request: AgentRequest = { prompt: 'api_limit', context: '' };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'API limit reached: Too many requests. Please try again later.');
});

test('Anthropic Adapter: handles invalid response', async () => {
  const adapter = createAnthropicAdapter({ apiKey: 'dummy', model: 'claude' });
  (adapter as any).client = mockClient;
  const request: AgentRequest = { prompt: 'invalid_response', context: '' };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'API returned unexpected data structure.');
});
