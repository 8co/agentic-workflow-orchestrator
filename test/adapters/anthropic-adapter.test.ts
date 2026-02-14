import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createAnthropicAdapter } from '../../src/adapters/anthropic-adapter.js';
import type { AgentRequest, AgentResponse } from '../../src/types.js';

test('Anthropic Adapter - Successful execution', async () => {
  const mockClient = {
    messages: {
      create: async () => ({
        content: [{ type: 'text', text: 'Success response' }],
        usage: {
          input_tokens: 50,
          output_tokens: 5,
        },
        stop_reason: 'terminated',
      }),
    },
  };

  const adapter = createAnthropicAdapter({ apiKey: 'test-api-key', model: 'claude-test' });
  adapter['client'] = mockClient;

  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: 'Test context',
    outputPath: null,
  };

  const response: AgentResponse = await adapter.execute(request);
  assert.equal(response.success, true);
  assert.equal(response.output, 'Success response');
});

test('Anthropic Adapter - Network error', async () => {
  const mockClient = {
    messages: {
      create: async () => {
        const error = new Error('Network error');
        (error as any).code = 'ENOTFOUND';
        throw error;
      },
    },
  };

  const adapter = createAnthropicAdapter({ apiKey: 'test-api-key', model: 'claude-test' });
  adapter['client'] = mockClient;

  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: 'Test context',
    outputPath: null,
  };

  const response: AgentResponse = await adapter.execute(request);
  assert.equal(response.success, false);
  assert.equal(response.error, 'Network error: Unable to reach the API.');
});

test('Anthropic Adapter - API limit error', async () => {
  const mockClient = {
    messages: {
      create: async () => {
        const error = new Error('API limit error');
        (error as any).response = { status: 429 };
        throw error;
      },
    },
  };

  const adapter = createAnthropicAdapter({ apiKey: 'test-api-key', model: 'claude-test' });
  adapter['client'] = mockClient;

  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: 'Test context',
    outputPath: null,
  };

  const response: AgentResponse = await adapter.execute(request);
  assert.equal(response.success, false);
  assert.equal(response.error, 'API limit reached: Too many requests. Please try again later.');
});
