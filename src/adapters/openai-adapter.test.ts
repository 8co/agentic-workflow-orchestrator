import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createOpenAIAdapter } from './openai-adapter.js';
import type { AgentRequest, AgentResponse } from '../types.js';

// Mock OpenAI client
class MockOpenAI {
  chat = {
    completions: {
      create: async ({ model, messages }: { model: string; messages: any[] }) => {
        if (model !== 'valid-model') {
          throw new Error('Invalid model');
        }
        if (messages[1].content.includes('Malformed')) {
          return { choices: [{}] };
        }
        if (messages[1].content.includes('Network Error')) {
          throw new Error('Network Error');
        }
        if (messages[1].content.includes('timeout')) {
          throw new Error('Request timed out');
        }
        if (messages[1].content.includes('401')) {
          throw new Error('401 Unauthorized');
        }
        if (messages[1].content.includes('500')) {
          throw new Error('500 Internal Server Error');
        }
        if (messages[1].content.includes('429')) {
          throw new Error('429 Too Many Requests');
        }
        if (messages[1].content.includes('503')) {
          throw new Error('503 Service Unavailable');
        }

        return {
          choices: [
            {
              message: { content: 'Expected response' },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
          },
        };
      },
    },
  };
}

test('OpenAI Adapter normal execution', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'test-key', model: 'valid-model' });
  const request: AgentRequest = {
    prompt: 'Normal prompt',
  };

  const response: AgentResponse = await adapter.execute(request);

  assert.equal(response.success, true);
  assert.equal(response.output, 'Expected response');
});

test('OpenAI Adapter malformed response error handling', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'test-key', model: 'valid-model' }) as any;
  adapter.client = new MockOpenAI();

  const request: AgentRequest = {
    prompt: 'Malformed response scenario',
  };

  const response: AgentResponse = await adapter.execute(request);

  assert.equal(response.success, false);
  assert.equal(response.error, 'Received a malformed response from OpenAI. Please try again later.');
});

test('OpenAI Adapter network error handling', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'test-key', model: 'valid-model' }) as any;
  adapter.client = new MockOpenAI();

  const request: AgentRequest = {
    prompt: 'Network Error',
  };

  const response: AgentResponse = await adapter.execute(request);

  assert.equal(response.success, false);
  assert.equal(response.error, 'Network error occurred. Please check your connection and try again.');
});

test('OpenAI Adapter timeout error handling', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'test-key', model: 'valid-model' }) as any;
  adapter.client = new MockOpenAI();

  const request: AgentRequest = {
    prompt: 'timeout',
  };

  const response: AgentResponse = await adapter.execute(request);

  assert.equal(response.success, false);
  assert.equal(response.error, 'Request timed out. Please try again later.');
});

test('OpenAI Adapter unauthorized error handling', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'test-key', model: 'valid-model' }) as any;
  adapter.client = new MockOpenAI();

  const request: AgentRequest = {
    prompt: '401',
  };

  const response: AgentResponse = await adapter.execute(request);

  assert.equal(response.success, false);
  assert.equal(response.error, 'Unauthorized: Invalid API key or permissions issue.');
});

test('OpenAI Adapter internal server error handling', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'test-key', model: 'valid-model' }) as any;
  adapter.client = new MockOpenAI();

  const request: AgentRequest = {
    prompt: '500',
  };

  const response: AgentResponse = await adapter.execute(request);

  assert.equal(response.success, false);
  assert.equal(response.error, 'Internal server error. Try again after some time.');
});

test('OpenAI Adapter rate limit error handling', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'test-key', model: 'valid-model' }) as any;
  adapter.client = new MockOpenAI();

  const request: AgentRequest = {
    prompt: '429',
  };

  const response: AgentResponse = await adapter.execute(request);

  assert.equal(response.success, false);
  assert.equal(response.error, 'Too many requests: You have hit the rate limit. Try again later.');
});

test('OpenAI Adapter service unavailable error handling', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'test-key', model: 'valid-model' }) as any;
  adapter.client = new MockOpenAI();

  const request: AgentRequest = {
    prompt: '503',
  };

  const response: AgentResponse = await adapter.execute(request);

  assert.equal(response.success, false);
  assert.equal(response.error, 'Service unavailable: OpenAI temporarily unavailable. Try again after some time.');
});
