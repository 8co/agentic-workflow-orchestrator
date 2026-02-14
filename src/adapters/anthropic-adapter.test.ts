import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createAnthropicAdapter } from './anthropic-adapter.js';
import type { AgentAdapter, AgentRequest, AgentResponse } from '../types.js';

// Mocking the Anthropic SDK
const mockCreate = (response: unknown): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    if (response instanceof Error) {
      reject(response);
    } else {
      resolve(response);
    }
  });
};

class MockAnthropic {
  messages = {
    create: (args: unknown) => mockCreate(args)
  }
}

// Dependency Injection of the mocked SDK
function createMockedAnthropicAdapter(mockResponse: unknown) {
  const adapter = createAnthropicAdapter({ apiKey: 'dummy-key', model: 'claude-v1' });
  // Overwrite the client with our mock
  (adapter as any).client = new MockAnthropic();
  mockCreate(mockResponse);
  return adapter;
}

test('Anthropic Adapter handles malformed response gracefully', async () => {
  const adapter: AgentAdapter = createMockedAnthropicAdapter({
    someUnexpectedField: true
  });

  const request: AgentRequest = {
    prompt: 'Hello, world!',
    context: undefined
  };

  const response: AgentResponse = await adapter.execute(request);

  assert.equal(response.success, false);
  assert.match(response.error as string, /API returned unexpected data structure/);
});

test('Anthropic Adapter retries and reports timeout error', async () => {
  const adapter: AgentAdapter = createMockedAnthropicAdapter(
    new Error('Request timeout')
  );

  const request: AgentRequest = {
    prompt: 'Hello, world!',
    context: undefined
  };

  const response: AgentResponse = await adapter.execute(request);

  assert.equal(response.success, false);
  assert.match(response.error as string, /Request timed out/);
});

test('Anthropic Adapter handles rate limit error', async () => {
  const adapter: AgentAdapter = createMockedAnthropicAdapter({
    response: { status: 429 }
  });

  const request: AgentRequest = {
    prompt: 'Hello, world!',
    context: undefined
  };

  const response: AgentResponse = await adapter.execute(request);

  assert.equal(response.success, false);
  assert.match(response.error as string, /Rate limit error: Too many requests in a short amount of time/);
});
