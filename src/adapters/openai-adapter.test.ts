import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createOpenAIAdapter } from './openai-adapter.js';
import type { AgentRequest, AgentResponse } from '../types.js';

function mockOpenAIClient() {
  return {
    chat: {
      completions: {
        create: async ({ model, messages }: { model: string; messages: any[] }) => {
          if (model === 'valid-model') {
            return {
              choices: [{ message: { content: 'Mocked response from OpenAI.' }, finish_reason: 'stop' }],
              usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 }
            };
          } else if (model === 'empty-response') {
            return {
              choices: [],
              usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 }
            };
          } else {
            throw new Error('Malformed response from OpenAI service');
          }
        }
      }
    }
  };
}

test('OpenAIAdapter execute function - successful response', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'key', model: 'valid-model' });
  const mock = mockOpenAIClient();
  (adapter as any).client = mock;

  const request: AgentRequest = { prompt: 'Test prompt', context: 'Some context' };
  const response: AgentResponse = await adapter.execute(request);

  assert.equal(response.success, true);
  assert.equal(response.output, 'Mocked response from OpenAI.');
});

test('OpenAIAdapter execute function - failure due to malformed response', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'key', model: 'faulty-model' });
  const mock = mockOpenAIClient();
  (adapter as any).client = mock;

  const request: AgentRequest = { prompt: 'Test prompt', context: 'Some context' };
  const response: AgentResponse = await adapter.execute(request);

  assert.equal(response.success, false);
  assert.equal(response.error, 'Received a malformed response from OpenAI. Please try again later.');
});

test('OpenAIAdapter execute function - empty choices response', async () => {
  const adapter = createOpenAIAdapter({ apiKey: 'key', model: 'empty-response' });
  const mock = mockOpenAIClient();
  (adapter as any).client = mock;

  const request: AgentRequest = { prompt: 'Test prompt', context: 'Some context' };
  const response: AgentResponse = await adapter.execute(request);

  assert.equal(response.success, false);
});
