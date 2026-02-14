import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createAnthropicAdapter } from '../../src/adapters/anthropic-adapter.js';
import type { AgentRequest } from '../../src/types.js';

class MockAnthropic {
  private responses: any[];

  constructor(responses: any[]) {
    this.responses = responses;
  }

  messages = {
    create: () => {
      if (this.responses.length > 0) {
        const response = this.responses.shift();
        if (response instanceof Error) {
          return Promise.reject(response);
        }
        return Promise.resolve(response);
      }
      throw new Error('No mock response available');
    },
  };
}

test('AnthropicAdapter - successful execution', async () => {
  const mockResponse = {
    content: [{ type: 'text', text: 'Hello, world!' }],
    usage: { input_tokens: 10, output_tokens: 2 },
    stop_reason: 'end',
  };
  const mockClient = new MockAnthropic([mockResponse]);
  const adapter = createAnthropicAdapter({
    apiKey: 'test-key',
    model: 'test-model',
  });

  // Override the client with the mock one
  (adapter as any).client = mockClient;

  const request: AgentRequest = {
    prompt: 'Generate a greeting.',
  };

  const response = await adapter.execute(request);
  assert.equal(response.success, true);
  assert.equal(response.output, 'Hello, world!');
});

test('AnthropicAdapter - network error', async () => {
  const mockError = { code: 'ENOTFOUND' };
  const mockClient = new MockAnthropic([mockError]);
  const adapter = createAnthropicAdapter({
    apiKey: 'test-key',
    model: 'test-model',
  });

  // Override the client with the mock one
  (adapter as any).client = mockClient;

  const request: AgentRequest = {
    prompt: 'Generate a greeting.',
  };

  const response = await adapter.execute(request);
  assert.equal(response.success, false);
  assert.equal(response.error, 'Network error: Unable to reach the API.');
});

test('AnthropicAdapter - API limit error', async () => {
  const mockError = { response: { status: 429 } };
  const mockClient = new MockAnthropic([mockError]);
  const adapter = createAnthropicAdapter({
    apiKey: 'test-key',
    model: 'test-model',
  });

  // Override the client with the mock one
  (adapter as any).client = mockClient;

  const request: AgentRequest = {
    prompt: 'Generate a greeting.',
  };

  const response = await adapter.execute(request);
  assert.equal(response.success, false);
  assert.equal(response.error, 'API limit reached: Too many requests. Please try again later.');
});

test('AnthropicAdapter - invalid response structure', async () => {
  const mockResponse = { badContent: [], otherField: {} };
  const mockClient = new MockAnthropic([mockResponse]);
  const adapter = createAnthropicAdapter({
    apiKey: 'test-key',
    model: 'test-model',
  });

  // Override the client with the mock one
  (adapter as any).client = mockClient;

  const request: AgentRequest = {
    prompt: 'Generate a greeting.',
  };

  try {
    await adapter.execute(request);
    assert.fail('Expected an error to be thrown for invalid response structure');
  } catch (err) {
    assert.equal(err.message, 'API returned unexpected data structure.');
  }
});
