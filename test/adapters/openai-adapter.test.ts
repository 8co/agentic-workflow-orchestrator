import { test } from 'node:test';
import assert from 'node:assert';
import { createOpenAIAdapter } from '../../src/adapters/openai-adapter.js';
import type { AgentRequest } from '../../src/types.js';

class MockOpenAI {
  chat = {
    completions: {
      create: async (params: any) => {
        if (params.messages[1].content.includes('Network Error')) {
          throw new Error('Network Error');
        }
        if (params.messages[1].content.includes('timeout')) {
          throw new Error('timeout');
        }
        if (params.messages[1].content.includes('401')) {
          throw new Error('401 Unauthorized');
        }
        if (params.messages[1].content.includes('500')) {
          throw new Error('500 Internal Server Error');
        }
        if (params.messages[1].content.includes('429')) {
          throw new Error('429 Too Many Requests');
        }
        if (params.messages[1].content.includes('503')) {
          throw new Error('503 Service Unavailable');
        }
        if (params.messages[1].content.includes('Malformed response')) {
          return { choices: [] };
        }
        return {
          choices: [
            {
              message: { content: 'Valid response' },
              finish_reason: 'stop'
            }
          ],
          usage: { prompt_tokens: 20, completion_tokens: 10 }
        };
      }
    }
  };
}

test('OpenAI Adapter - Network Error', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'valid_key', model: 'model' });
  const errMsg = 'Network error occurred. Please check your connection and try again.';

  (OpenAI as unknown as MockOpenAI).chat = new MockOpenAI().chat;

  const request: AgentRequest = { prompt: 'Network Error', context: '' };
  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, errMsg);
});

test('OpenAI Adapter - Timeout', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'valid_key', model: 'model' });
  const errMsg = 'Request timed out. Please try again later.';

  (OpenAI as unknown as MockOpenAI).chat = new MockOpenAI().chat;

  const request: AgentRequest = { prompt: 'timeout', context: '' };
  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, errMsg);
});

test('OpenAI Adapter - Unauthorized', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'valid_key', model: 'model' });
  const errMsg = 'Unauthorized: Invalid API key or permissions issue.';

  (OpenAI as unknown as MockOpenAI).chat = new MockOpenAI().chat;

  const request: AgentRequest = { prompt: '401', context: '' };
  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, errMsg);
});

test('OpenAI Adapter - Internal Server Error', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'valid_key', model: 'model' });
  const errMsg = 'Internal server error. Try again after some time.';

  (OpenAI as unknown as MockOpenAI).chat = new MockOpenAI().chat;

  const request: AgentRequest = { prompt: '500', context: '' };
  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, errMsg);
});

test('OpenAI Adapter - Too Many Requests', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'valid_key', model: 'model' });
  const errMsg = 'Too many requests: You have hit the rate limit. Try again later.';

  (OpenAI as unknown as MockOpenAI).chat = new MockOpenAI().chat;

  const request: AgentRequest = { prompt: '429', context: '' };
  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, errMsg);
});

test('OpenAI Adapter - Service Unavailable', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'valid_key', model: 'model' });
  const errMsg = 'Service unavailable: OpenAI temporarily unavailable. Try again after some time.';

  (OpenAI as unknown as MockOpenAI).chat = new MockOpenAI().chat;

  const request: AgentRequest = { prompt: '503', context: '' };
  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, errMsg);
});

test('OpenAI Adapter - Malformed Response', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'valid_key', model: 'model' });
  const errMsg = 'Received a malformed response from OpenAI. Please try again later.';

  (OpenAI as unknown as MockOpenAI).chat = new MockOpenAI().chat;

  const request: AgentRequest = { prompt: 'Malformed response', context: '' };
  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, errMsg);
});
