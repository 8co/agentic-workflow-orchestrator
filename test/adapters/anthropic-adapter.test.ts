import assert from 'node:assert';
import test from 'node:test';
import { createAnthropicAdapter } from '../../src/adapters/anthropic-adapter.js';
import type { AgentRequest } from '../../src/types.js';

class AnthropicMock {
  public messages = {
    create: async (_: unknown) => ({ content: [], usage: { input_tokens: 0, output_tokens: 0 }, stop_reason: 'mocked' }),
  };
}

test('AnthropicAdapter: Handles network errors', async (t) => {
  const adapter = createAnthropicAdapter({
    apiKey: 'test-api-key',
    model: 'test-model',
  });

  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: null,
    outputPath: null,
  };

  // Mock Anthropic to simulate a network error
  const origCreate = AnthropicMock.prototype.messages.create;
  try {
    AnthropicMock.prototype.messages.create = async () => {
      throw { code: 'ENOTFOUND' };
    };

    const response = await adapter.execute(request);

    assert.strictEqual(response.success, false);
    assert.ok(response.error.includes('Network error: Unable to reach the API.'));
  } finally {
    AnthropicMock.prototype.messages.create = origCreate;
  }
});

test('AnthropicAdapter: Handles API limit errors', async (t) => {
  const adapter = createAnthropicAdapter({
    apiKey: 'test-api-key',
    model: 'test-model',
  });

  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: null,
    outputPath: null,
  };

  // Mock Anthropic to simulate an API limit error
  const origCreate = AnthropicMock.prototype.messages.create;
  try {
    AnthropicMock.prototype.messages.create = async () => {
      throw { response: { status: 429 } };
    };

    const response = await adapter.execute(request);

    assert.strictEqual(response.success, false);
    assert.ok(response.error.includes('API limit reached: Too many requests. Please try again later.'));
  } finally {
    AnthropicMock.prototype.messages.create = origCreate;
  }
});

test('AnthropicAdapter: Handles invalid response errors', async (t) => {
  const adapter = createAnthropicAdapter({
    apiKey: 'test-api-key',
    model: 'test-model',
  });

  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: null,
    outputPath: null,
  };

  // Mock Anthropic to simulate an invalid response
  const origCreate = AnthropicMock.prototype.messages.create;
  try {
    AnthropicMock.prototype.messages.create = async () => ({
      invalid: 'response',
    });

    const response = await adapter.execute(request);

    assert.strictEqual(response.success, false);
    assert.ok(response.error.includes('API returned unexpected data structure.'));
  } finally {
    AnthropicMock.prototype.messages.create = origCreate;
  }
});
