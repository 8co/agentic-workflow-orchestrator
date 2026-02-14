import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createOpenAIAdapter } from '../../src/adapters/openai-adapter.js';
import type { AgentAdapter, AgentRequest } from '../../src/types.js';

// Mocking OpenAI client
class MockOpenAIClient {
  chat = {
    completions: {
      create: async ({ messages }: { messages: { role: string, content: string }[] }) => {
        const userMessage = messages.find(msg => msg.role === 'user');
        if (!userMessage) throw new Error('No user message provided.');

        switch (userMessage.content) {
          case 'network error':
            throw new Error('Network Error');
          case 'timeout':
            throw new Error('timeout');
          case 'unauthorized':
            throw new Error('401 Unauthorized');
          case 'internal server error':
            throw new Error('500 Internal Server Error');
          default:
            return {
              choices: [{ message: { content: 'Mock response' } }],
              usage: { prompt_tokens: 5, completion_tokens: 5 }
            };
        }
      }
    }
  }
}

// Replace OpenAI client with mock
const originalOpenAI = MockOpenAIClient;
let openAIAdapter: AgentAdapter;
const config = {
  apiKey: 'valid-api-key',
  model: 'text-davinci-003'
};

test('setup', () => {
  Object.assign(global, { OpenAI: originalOpenAI });
  openAIAdapter = createOpenAIAdapter(config);
});

// Test normal execution
test('executes request successfully', async () => {
  const request: AgentRequest = {
    prompt: 'Hello world',
    context: '',
  };

  const response = await openAIAdapter.execute(request);
  assert.equal(response.success, true);
  assert.equal(response.output, 'Mock response');
});

// Test network error handling
test('handles network error', async () => {
  const request: AgentRequest = {
    prompt: 'network error',
    context: '',
  };

  const response = await openAIAdapter.execute(request);
  assert.equal(response.success, false);
  assert.equal(response.error, 'Network error occurred. Please check your connection and try again.');
});

// Test timeout error handling
test('handles timeout error', async () => {
  const request: AgentRequest = {
    prompt: 'timeout',
    context: '',
  };

  const response = await openAIAdapter.execute(request);
  assert.equal(response.success, false);
  assert.equal(response.error, 'Request timed out. Please try again later.');
});

// Test unauthorized error handling
test('handles unauthorized error', async () => {
  const request: AgentRequest = {
    prompt: 'unauthorized',
    context: '',
  };

  const response = await openAIAdapter.execute(request);
  assert.equal(response.success, false);
  assert.equal(response.error, 'Unauthorized: Invalid API key or permissions issue.');
});

// Test internal server error handling
test('handles internal server error', async () => {
  const request: AgentRequest = {
    prompt: 'internal server error',
    context: '',
  };

  const response = await openAIAdapter.execute(request);
  assert.equal(response.success, false);
  assert.equal(response.error, 'Internal server error. Try again after some time.');
});

// Cleanup
test('cleanup', () => {
  delete global.OpenAI;
});
