import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createAnthropicAdapter } from './anthropic-adapter.js';
import type { AgentRequest, AgentResponse } from '../types.js';

const mockAnthropicClient = {
  messages: {
    create: async (params: any) => {
      if (params instanceof Error) throw params;
      if (params.shouldFail) {
        return { status: 500 };
      }
      return {
        content: [{ type: 'text', text: 'Hello, World!' }],
        usage: { input_tokens: 10, output_tokens: 5 },
        stop_reason: 'length',
      };
    },
  },
};

const mockConfig = { apiKey: 'mock-api-key', model: 'mock-model' };

const adapter = createAnthropicAdapter(mockConfig);

test('Anthropic Adapter - Success Case', async () => {
  const request: AgentRequest = {
    prompt: 'Say hello',
  };

  const response: AgentResponse = await adapter.execute(request);
  assert.equal(response.success, true);
  assert.equal(response.output, 'Hello, World!');
  assert.ok(response.durationMs >= 0);
});

test('Anthropic Adapter - API Limit Error', async () => {
  const request: AgentRequest = {
    prompt: 'Exceed limits',
  };

  // Simulate API Limit Error
  (mockAnthropicClient.messages.create as any) = async () => {
    throw { response: { status: 429 } };
  };

  const response: AgentResponse = await adapter.execute(request);
  assert.equal(response.success, false);
  assert.equal(response.error, 'API limit reached: Too many requests. Please try again later.');
});

test('Anthropic Adapter - Network Error', async () => {
  const request: AgentRequest = {
    prompt: 'Network issue',
  };

  // Simulate Network Error
  (mockAnthropicClient.messages.create as any) = async () => {
    throw new Error('Network error');
  };

  const response: AgentResponse = await adapter.execute(request);
  assert.equal(response.success, false);
  assert.equal(response.error, 'Network error: Unable to reach the API. Retrying...');
});

test('Anthropic Adapter - Invalid Response Structure', async () => {
  const request: AgentRequest = {
    prompt: 'Invalid response',
  };

  // Simulate Invalid Response
  (mockAnthropicClient.messages.create as any) = async () => {
    return {};
  };

  const response: AgentResponse = await adapter.execute(request);
  assert.equal(response.success, false);
  assert.ok(response.error!.includes('API returned unexpected data structure.'));
});

test('Anthropic Adapter - Unexpected Response Error', async () => {
  const request: AgentRequest = {
    prompt: 'Unexpected response',
  };

  // Simulate Unexpected Response
  (mockAnthropicClient.messages.create as any) = async () => {
    throw { status: 500 };
  };

  const response: AgentResponse = await adapter.execute(request);
  assert.equal(response.success, false);
  assert.ok(response.error!.includes('Unexpected API response status.'));
});

test('Anthropic Adapter - Timeout Error', async () => {
  const request: AgentRequest = {
    prompt: 'Timeout please',
  };

  // Simulate Timeout Error
  (mockAnthropicClient.messages.create as any) = async () => {
    throw new Error('timeout');
  };

  const response: AgentResponse = await adapter.execute(request);
  assert.equal(response.success, false);
  assert.equal(response.error, 'Network error: Request timed out. Please check your connection.');
});
