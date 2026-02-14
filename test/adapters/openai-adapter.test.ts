import { test } from 'node:test';
import assert from 'node:assert';
import { createOpenAIAdapter } from '../../src/adapters/openai-adapter.js';
import type { AgentRequest } from '../../src/types.js';

class MockOpenAI {
  constructor(private config: { apiKey: string }) {}

  chat = {
    completions: {
      create: async (params: any) => {
        if (this.config.apiKey === 'invalid') {
          throw new Error('401');
        }
        if (params.messages[1]?.content.includes('timeout')) {
          throw new Error('timeout');
        }
        if (params.messages[1]?.content.includes('malformed')) {
          return { choices: [] };
        }
        return {
          choices: [
            {
              message: { content: 'Mock Response' },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 2,
            total_tokens: 12,
          },
        };
      },
    },
  };
}

// Override OpenAI with Mock
Object.assign(createOpenAIAdapter, {
  __OpenAI: MockOpenAI
});

test('OpenAI Adapter - Successful Completion', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'valid', model: 'text-davinci-003' });
  const request: AgentRequest = {
    prompt: 'Hello, world!',
  };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, true);
  assert.strictEqual(response.output, 'Mock Response');
});

test('OpenAI Adapter - Invalid API Key', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'invalid', model: 'text-davinci-003' });
  const request: AgentRequest = {
    prompt: 'Hello, world!',
  };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Unauthorized: Invalid API key or permissions issue.');
});

test('OpenAI Adapter - Timeout Error', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'valid', model: 'text-davinci-003' });
  const request: AgentRequest = {
    prompt: 'This prompt will cause a timeout.',
  };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Request timed out. Please try again later.');
});

test('OpenAI Adapter - Malformed Response', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'valid', model: 'text-davinci-003' });
  const request: AgentRequest = {
    prompt: 'malformed',
  };

  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Received a malformed response from OpenAI. Please try again later.');
});
