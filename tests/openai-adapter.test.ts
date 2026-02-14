import { test } from 'node:test';
import assert from 'node:assert';
import { createOpenAIAdapter } from '../src/adapters/openai-adapter.js';
import type { AgentRequest, AgentResponse } from '../src/types.js';

function mockOpenAI(overrides: Partial<typeof import('openai')> = {}) {
  return {
    chat: {
      completions: {
        create: async () => ({
          id: 'cmpl-123',
          object: 'text_completion',
          created: Date.now(),
          model: 'gpt-3',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: 'This is a response',
            },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 5,
            completion_tokens: 5,
            total_tokens: 10
          }
        }),
      },
    },
    ...overrides,
  };
}

const validConfig = {
  apiKey: 'valid-api-key',
  model: 'gpt-3',
};

test('createOpenAIAdapter throws on invalid config', () => {
  assert.throws(() => createOpenAIAdapter({ apiKey: '', model: '' }), {
    message: 'Invalid OpenAI configuration',
  });
});

test('execute returns success response on valid prompt', async () => {
  const adapter = createOpenAIAdapter(validConfig);
  const request: AgentRequest = {
    prompt: 'Hello',
  };
  const response: AgentResponse = await adapter.execute(request);
  assert.strictEqual(response.success, true);
  assert(response.output.includes('This is a response'));
});

test('execute handles network error', async () => {
  const OpenAI = mockOpenAI({
    chat: {
      completions: {
        create: async () => { throw new Error('Network Error'); },
      },
    },
  });
  
  const adapter = createOpenAIAdapter(validConfig);
  const request: AgentRequest = {
    prompt: 'Hello',
  };
  const response: AgentResponse = await adapter.execute(request);
  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Network error occurred. Please check your connection and try again.');
});

test('execute handles malformed response', async () => {
  const OpenAI = mockOpenAI({
    chat: {
      completions: {
        create: async () => ({
          id: 'cmpl-123',
          object: 'text_completion',
          created: Date.now(),
          model: 'gpt-3',
          choices: [],
        }),
      },
    },
  });

  const adapter = createOpenAIAdapter(validConfig);
  const request: AgentRequest = {
    prompt: 'Hello',
  };
  const response: AgentResponse = await adapter.execute(request);
  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Received a malformed response from OpenAI. Please try again later.');
});

test('execute handles unauthorized error', async () => {
  const OpenAI = mockOpenAI({
    chat: {
      completions: {
        create: async () => { throw new Error('401 Unauthorized'); },
      },
    },
  });

  const adapter = createOpenAIAdapter(validConfig);
  const request: AgentRequest = {
    prompt: 'Hello',
  };
  const response: AgentResponse = await adapter.execute(request);
  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Unauthorized: Invalid API key or permissions issue.');
});
