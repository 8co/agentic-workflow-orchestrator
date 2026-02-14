import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOpenAIAdapter } from '../src/adapters/openai-adapter.js';
import type { AgentRequest } from '../src/types.js';

const mockOpenAI = {
  chat: {
    completions: {
      create: async () => {
        throw new Error('Mocked error');
      },
    },
  },
};

test('createOpenAIAdapter - Network Error', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'test', model: 'text-davinci-002' });
  const request: AgentRequest = {
    prompt: 'Test prompt',
  };

  // Mock the client to throw network error
  (adapter as any).client = mockOpenAI;
  (mockOpenAI.chat.completions.create as any) = () => {
    throw new Error('Network Error');
  };

  const response = await adapter.execute(request);
  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Network error occurred. Please check your connection and try again.');
});

test('createOpenAIAdapter - API limit Error', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'test', model: 'text-davinci-002' });
  const request: AgentRequest = {
    prompt: 'Test prompt',
  };

  // Mock the client to throw rate limit error
  (adapter as any).client = mockOpenAI;
  (mockOpenAI.chat.completions.create as any) = () => {
    throw new Error('429');
  };

  const response = await adapter.execute(request);
  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Too many requests: You have hit the rate limit. Try again later.');
});

test('createOpenAIAdapter - Unauthorized Error', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'test', model: 'text-davinci-002' });
  const request: AgentRequest = {
    prompt: 'Test prompt',
  };

  // Mock the client to throw unauthorized error
  (adapter as any).client = mockOpenAI;
  (mockOpenAI.chat.completions.create as any) = () => {
    throw new Error('401');
  };

  const response = await adapter.execute(request);
  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Unauthorized: Invalid API key or permissions issue.');
});

test('createOpenAIAdapter - Unexpected Error', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'test', model: 'text-davinci-002' });
  const request: AgentRequest = {
    prompt: 'Test prompt',
  };

  // Mock the client to throw an unexpected error
  (adapter as any).client = mockOpenAI;
  (mockOpenAI.chat.completions.create as any) = () => {
    throw new Error('Some unexpected error');
  };

  const response = await adapter.execute(request);
  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'An unexpected error occurred. Please try again later.');
});
