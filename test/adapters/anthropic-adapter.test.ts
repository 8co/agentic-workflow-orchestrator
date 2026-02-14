import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAnthropicAdapter } from '../../src/adapters/anthropic-adapter.js';
import type { AgentRequest } from '../../src/types.js';

test('Anthropic Adapter - Successful Execution', async (t) => {
  const mockClient = {
    messages: {
      async create() {
        return {
          content: [{ type: 'text', text: 'Mock response text' }],
          usage: { input_tokens: 10, output_tokens: 2 },
          stop_reason: 'stop',
        };
      },
    },
  };

  const adapter = createAnthropicAdapter({
    apiKey: 'fake-api-key',
    model: 'test-model',
  });
  
  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: '',
  };

  const originalCreate = adapter.execute.toString();
  t.after(() => {
    adapter.execute = eval(originalCreate); // Restore original execute method after test
  });

  adapter.execute = async function (request: AgentRequest) {
    // Override to use mock client
    const config = this;
    const executeMethod = Function('client', originalCreate);
    return executeMethod.call(config, mockClient, request);
  }.bind(adapter);

  const result = await adapter.execute(request);

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.output.includes('Mock response text'), true);
});

test('Anthropic Adapter - Handles Network Error', async (t) => {
  const mockClient = {
    messages: {
      async create() {
        throw { message: 'Network error', code: 'ECONNREFUSED' };
      },
    },
  };

  const adapter = createAnthropicAdapter({
    apiKey: 'fake-api-key',
    model: 'test-model',
  });

  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: '',
  };

  const originalCreate = adapter.execute.toString();
  t.after(() => {
    adapter.execute = eval(originalCreate); // Restore original execute method after test
  });

  adapter.execute = async function (request: AgentRequest) {
    // Override to use mock client
    const config = this;
    const executeMethod = Function('client', originalCreate);
    return executeMethod.call(config, mockClient, request);
  }.bind(adapter);

  const result = await adapter.execute(request);

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error.includes('Network error'), true);
});

test('Anthropic Adapter - Handles API Limit Error', async (t) => {
  const mockClient = {
    messages: {
      async create() {
        const error = new Error('API limit reached');
        (error as any).response = { status: 429 };
        throw error;
      },
    },
  };

  const adapter = createAnthropicAdapter({
    apiKey: 'fake-api-key',
    model: 'test-model',
  });

  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: '',
  };

  const originalCreate = adapter.execute.toString();
  t.after(() => {
    adapter.execute = eval(originalCreate); // Restore original execute method after test
  });

  adapter.execute = async function (request: AgentRequest) {
    // Override to use mock client
    const config = this;
    const executeMethod = Function('client', originalCreate);
    return executeMethod.call(config, mockClient, request);
  }.bind(adapter);

  const result = await adapter.execute(request);

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error.includes('API limit reached'), true);
});
