import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createOpenAIAdapter } from './openai-adapter.js';
import type { AgentRequest } from '../types.js';

class MockOpenAI {
  private response: any;

  constructor(response: any) {
    this.response = response;
  }

  public chat = {
    completions: {
      create: async () => this.response,
    },
  };
}

test('OpenAI Adapter: execute - successful response', async () => {
  const mockResponse = {
    choices: [{
      message: {
        content: 'Test successful completion',
      },
    }],
    usage: {
      prompt_tokens: 5,
      completion_tokens: 5,
      total_tokens: 10,
    },
  };

  const openAIAdapter = createOpenAIAdapter(
    { apiKey: 'valid-api-key', model: 'test-model' },
    'openai'
  );

  const request: AgentRequest = {
    prompt: 'test prompt',
    context: 'test context',
  };

  (openAIAdapter as any).client = new MockOpenAI(mockResponse);

  const result = await openAIAdapter.execute(request);

  assert.equal(result.success, true);
  assert.equal(result.output, 'Test successful completion');
});

test('OpenAI Adapter: execute - malformed response', async () => {
  const mockResponse = {
    choices: [],
  };

  const openAIAdapter = createOpenAIAdapter(
    { apiKey: 'valid-api-key', model: 'test-model' },
    'openai'
  );

  const request: AgentRequest = {
    prompt: 'test prompt',
    context: 'test context',
  };

  (openAIAdapter as any).client = new MockOpenAI(mockResponse);

  const result = await openAIAdapter.execute(request);

  assert.equal(result.success, false);
  assert.equal(result.error, 'Received a malformed response from OpenAI. Please try again later.');
});

test('OpenAI Adapter: execute - network error', async () => {
  const openAIAdapter = createOpenAIAdapter(
    { apiKey: 'valid-api-key', model: 'test-model' },
    'openai'
  );

  const request: AgentRequest = {
    prompt: 'test prompt',
    context: 'test context',
  };

  (openAIAdapter as any).client = {
    chat: {
      completions: {
        create: async () => {
          throw new Error('Network Error: connection failed');
        },
      },
    },
  };

  const result = await openAIAdapter.execute(request);

  assert.equal(result.success, false);
  assert.equal(result.error, 'Network error occurred. Please check your connection and try again.');
});

test('OpenAI Adapter: invalid configuration', () => {
  assert.throws(() => {
    createOpenAIAdapter({ apiKey: '', model: '' });
  }, new Error('Invalid OpenAI configuration'));
});
