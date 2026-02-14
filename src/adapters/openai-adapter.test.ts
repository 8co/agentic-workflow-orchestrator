import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createOpenAIAdapter } from './openai-adapter.js';
import type { AgentRequest, AgentResponse } from '../types.js';

const apiKey = 'test-api-key';
const model = 'test-model';

test('OpenAI Adapter - Network Error Handling', async () => {
  const adapter = createOpenAIAdapter({ apiKey, model });

  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: '',
  };

  // Mock OpenAI client to throw a network error
  const originalChatCompletionsCreate = adapter.execute as any;
  adapter.execute = async () => {
    throw new Error('Network Error');
  };

  const response: AgentResponse = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Network error occurred. Please check your connection and try again.');

  // Restore original function
  (adapter.execute as any) = originalChatCompletionsCreate;
});

test('OpenAI Adapter - Unauthorized Error Handling', async () => {
  const adapter = createOpenAIAdapter({ apiKey, model });

  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: '',
  };

  // Mock OpenAI client to throw a 401 unauthorized error
  const originalChatCompletionsCreate = adapter.execute as any;
  adapter.execute = async () => {
    throw new Error('401 Unauthorized');
  };

  const response: AgentResponse = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Unauthorized: Invalid API key or permissions issue.');

  // Restore original function
  (adapter.execute as any) = originalChatCompletionsCreate;
});

test('OpenAI Adapter - Internal Server Error Handling', async () => {
  const adapter = createOpenAIAdapter({ apiKey, model });

  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: '',
  };

  // Mock OpenAI client to throw a 500 internal server error
  const originalChatCompletionsCreate = adapter.execute as any;
  adapter.execute = async () => {
    throw new Error('500 Internal Server Error');
  };

  const response: AgentResponse = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'Internal server error. Try again after some time.');

  // Restore original function
  (adapter.execute as any) = originalChatCompletionsCreate;
});

test('OpenAI Adapter - Generic Error Handling', async () => {
  const adapter = createOpenAIAdapter({ apiKey, model });

  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: '',
  };

  // Mock OpenAI client to throw a generic error
  const originalChatCompletionsCreate = adapter.execute as any;
  adapter.execute = async () => {
    throw new Error('A generic error occurred.');
  };

  const response: AgentResponse = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.strictEqual(response.error, 'A generic error occurred.');

  // Restore original function
  (adapter.execute as any) = originalChatCompletionsCreate;
});
