import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createOpenAIAdapter } from './openai-adapter.js';
import type { AgentRequest } from '../types.js';

test('OpenAI Adapter handles API timeout', async (t) => {
  const config = { apiKey: 'test-api-key', model: 'test-model' };
  const adapter = createOpenAIAdapter(config);
  
  // Mock the OpenAI client to simulate a timeout error
  const mockTimeoutError = new Error('timeout');
  (global as any).OpenAI = function() {
    return {
      chat: {
        completions: {
          create: () => {
            throw mockTimeoutError;
          },
        },
      },
    };
  };

  const request: AgentRequest = {
    context: 'This is a test',
    prompt: 'Test prompt',
  };

  const response = await adapter.execute(request);

  assert.equal(response.success, false);
  assert.equal(response.error, 'Request timed out. Please try again later.');
});

test('OpenAI Adapter handles network error', async (t) => {
  const config = { apiKey: 'test-api-key', model: 'test-model' };
  const adapter = createOpenAIAdapter(config);
  
  // Mock the OpenAI client to simulate a network error
  const mockNetworkError = new Error('Network Error');
  (global as any).OpenAI = function() {
    return {
      chat: {
        completions: {
          create: () => {
            throw mockNetworkError;
          },
        },
      },
    };
  };

  const request: AgentRequest = {
    context: 'This is a test',
    prompt: 'Test prompt',
  };

  const response = await adapter.execute(request);

  assert.equal(response.success, false);
  assert.equal(response.error, 'Network error occurred. Please check your connection and try again.');
});
