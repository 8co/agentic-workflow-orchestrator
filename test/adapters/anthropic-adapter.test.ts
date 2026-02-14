import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createAnthropicAdapter } from '../../src/adapters/anthropic-adapter.js';
import type { AgentRequest } from '../../src/types.js';

// Mocking Anthropic SDK
class MockAnthropic {
  async messages() {
    return {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Mocked response text.' }],
        usage: { input_tokens: 10, output_tokens: 5 },
        stop_reason: 'stop',
      }),
    };
  }
}

MockAnthropic.prototype.messages.create = jest.fn(async () => ({
  content: [{ type: 'text', text: 'Mocked response text.' }],
  usage: { input_tokens: 10, output_tokens: 5 },
  stop_reason: 'stop',
}));

function mockAnthropicSdk() {
  return new MockAnthropic();
}

test('Anthropic adapter - successful case', async () => {
  const adapter = createAnthropicAdapter({
    apiKey: 'mock-key',
    model: 'mock-model',
  });

  adapter['client'] = mockAnthropicSdk();

  const request: AgentRequest = {
    prompt: 'Hello world!',
    context: 'Some context',
    outputPath: undefined,
  };

  const response = await adapter.execute(request);

  assert.equal(response.success, true);
  assert.equal(response.output, 'Mocked response text.');
  assert(response.durationMs >= 0);
});

test('Anthropic adapter - invalid response error', async () => {
  const adapter = createAnthropicAdapter({
    apiKey: 'mock-key',
    model: 'mock-model',
  });

  const mockedClient = mockAnthropicSdk();
  mockedClient.messages.create = jest.fn(async () => ({
    content: [],
    usage: {},
    stop_reason: 'stop',
  }));
  adapter['client'] = mockedClient;

  const request: AgentRequest = {
    prompt: 'Hello world!',
    context: 'Some context',
    outputPath: undefined,
  };

  const response = await adapter.execute(request);

  assert.equal(response.success, false);
  assert.equal(response.error, 'API returned unexpected data structure.');
});

test('Anthropic adapter - network error', async () => {
  const adapter = createAnthropicAdapter({
    apiKey: 'mock-key',
    model: 'mock-model',
  });

  const mockedClient = mockAnthropicSdk();
  mockedClient.messages.create = jest.fn(async () => {
    throw { code: 'ENOTFOUND' };
  });
  adapter['client'] = mockedClient;

  const request: AgentRequest = {
    prompt: 'Hello world!',
    context: 'Some context',
    outputPath: undefined,
  };

  const response = await adapter.execute(request);

  assert.equal(response.success, false);
  assert.equal(response.error, 'Network error: Unable to reach the API.');
});

test('Anthropic adapter - API limit error', async () => {
  const adapter = createAnthropicAdapter({
    apiKey: 'mock-key',
    model: 'mock-model',
  });

  const mockedClient = mockAnthropicSdk();
  mockedClient.messages.create = jest.fn(async () => {
    throw { response: { status: 429 } };
  });
  adapter['client'] = mockedClient;

  const request: AgentRequest = {
    prompt: 'Hello world!',
    context: 'Some context',
    outputPath: undefined,
  };

  const response = await adapter.execute(request);

  assert.equal(response.success, false);
  assert.equal(response.error, 'API limit reached: Too many requests. Please try again later.');
});
