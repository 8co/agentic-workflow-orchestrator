import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createAnthropicAdapter } from '../../src/adapters/anthropic-adapter.js';
import { AgentRequest } from '../../src/types.js';

// Mocking the Anthropic SDK
class MockAnthropic {
  apiKey: string;
  constructor({ apiKey }: { apiKey: string }) {
    this.apiKey = apiKey;
  }
  messages = {
    create: async ({ model, messages }: { model: string; messages: Array<{ role: string; content: string }> }) => {
      if (model === 'invalid-model') {
        throw { response: { status: 400 } }; // Simulate invalid model error
      }

      if (this.apiKey === 'invalid-key') {
        throw { response: { status: 401 } }; // Simulate invalid API key error
      }

      const userMessageContent = messages.find((msg) => msg.role === 'user')?.content || '';

      if (userMessageContent.includes('timeout')) {
        throw new Error('timeout'); // Simulate timeout error
      }

      // Simulate a valid response
      return {
        content: [{ type: 'text', text: 'Hello, World!' }],
        usage: {
          input_tokens: 10,
          output_tokens: 5,
        },
        stop_reason: 'stop_sequence',
      };
    },
  };
}

test('Anthropic Adapter - Successful execution', async () => {
  const adapter = createAnthropicAdapter({ apiKey: 'valid-key', model: 'valid-model' });

  const request: AgentRequest = {
    context: '',
    prompt: 'Say hello',
  };

  const response = await adapter.execute(request);
  assert.strictEqual(response.success, true, 'Execution should succeed');
  assert.strictEqual(response.output, 'Hello, World!', 'Output should match expected response');
});

test('Anthropic Adapter - Invalid API Key', async () => {
  const adapter = createAnthropicAdapter({ apiKey: 'invalid-key', model: 'valid-model' });

  const request: AgentRequest = {
    context: '',
    prompt: 'Say hello',
  };

  const response = await adapter.execute(request);
  assert.strictEqual(response.success, false, 'Execution should fail');
  assert.strictEqual(response.error, 'Error: Unexpected API response status.', 'Error message should indicate invalid API key');
});

test('Anthropic Adapter - Invalid Model', async () => {
  const adapter = createAnthropicAdapter({ apiKey: 'valid-key', model: 'invalid-model' });

  const request: AgentRequest = {
    context: '',
    prompt: 'Say hello',
  };

  const response = await adapter.execute(request);
  assert.strictEqual(response.success, false, 'Execution should fail');
  assert.strictEqual(response.error, 'Error: Unexpected API response status.', 'Error message should indicate invalid model');
});

test('Anthropic Adapter - Network Timeout', async () => {
  const adapter = createAnthropicAdapter({ apiKey: 'valid-key', model: 'valid-model' });

  const request: AgentRequest = {
    context: '',
    prompt: 'timeout',
  };

  const response = await adapter.execute(request);
  assert.strictEqual(response.success, false, 'Execution should fail');
  assert.strictEqual(response.error, 'Network error: Request timed out. Please check your connection.', 'Error message should indicate timeout');
});
