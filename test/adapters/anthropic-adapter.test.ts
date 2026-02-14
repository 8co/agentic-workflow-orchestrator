import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAnthropicAdapter } from '../src/adapters/anthropic-adapter.js';
import type { AgentRequest, AgentResponse } from '../src/types.js';

// Mock the Anthropic SDK and relevant functions
class MockAnthropicClient {
  messages = {
    create: async ({ model, max_tokens, system, messages }: any) => {
      if (model === 'network-error') {
        const error: any = new Error('Network error');
        error.code = 'ENOTFOUND';
        throw error;
      }
      if (model === 'api-limit-error') {
        const error: any = new Error('API limit reached');
        error.response = { status: 429 };
        throw error;
      }
      if (model === 'invalid-response') {
        return {};
      }
      return {
        content: [{ type: 'text', text: 'Response text' }],
        usage: { input_tokens: 50, output_tokens: 10 },
        stop_reason: 'stop'
      };
    }
  };
}

test('AnthropicAdapter execute - normal execution', async () => {
  const adapter = createAnthropicAdapter({
    apiKey: 'dummy-key',
    model: 'test-model'
  });

  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: '',
    outputPath: undefined,
  };

  const response: AgentResponse = await adapter.execute(request);
  assert.strictEqual(response.success, true);
  assert.match(response.output, /Response text/);
});

test('AnthropicAdapter execute - network error', async () => {
  const adapter = createAnthropicAdapter({
    apiKey: 'dummy-key',
    model: 'network-error'
  });

  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: '',
    outputPath: undefined,
  };

  const response: AgentResponse = await adapter.execute(request);
  assert.strictEqual(response.success, false);
  assert.match(response.error, /Network error: Unable to reach the API./);
});

test('AnthropicAdapter execute - API limit error', async () => {
  const adapter = createAnthropicAdapter({
    apiKey: 'dummy-key',
    model: 'api-limit-error'
  });

  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: '',
    outputPath: undefined,
  };

  const response: AgentResponse = await adapter.execute(request);
  assert.strictEqual(response.success, false);
  assert.match(response.error, /API limit reached: Too many requests. Please try again later./);
});

test('AnthropicAdapter execute - invalid response', async () => {
  const adapter = createAnthropicAdapter({
    apiKey: 'dummy-key',
    model: 'invalid-response'
  });

  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: '',
    outputPath: undefined,
  };

  const response: AgentResponse = await adapter.execute(request);
  assert.strictEqual(response.success, false);
  assert.match(response.error, /Received an invalid response structure from the API./);
});

// Mock replacement
(global as any).Anthropic = MockAnthropicClient;
