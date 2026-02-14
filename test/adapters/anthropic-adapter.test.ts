import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createAnthropicAdapter } from '../../src/adapters/anthropic-adapter.js';
import type { AgentRequest } from '../../src/types.js';

// Mock Anthropic SDK
class MockAnthropicClient {
  messages = {
    create: async () => {
      throw new Error('Should be mocked');
    }
  };
}

// Mock implementations
const mockNetworkError = new Error('Network Error');
const mockAPILimitError = { response: { status: 429 } };

const validMockResponse = {
  content: [
    { type: 'text', text: 'Output text' }
  ],
  usage: {
    input_tokens: 10,
    output_tokens: 20
  },
  stop_reason: 'end',
};

test('createAnthropicAdapter - Successful response', async () => {
  const adapter = createAnthropicAdapter({ apiKey: 'test-api-key', model: 'test-model' });

  // Mock client behavior
  (MockAnthropicClient.prototype.messages.create as unknown as jest.Mock).mockResolvedValue(validMockResponse);

  const agentRequest: AgentRequest = {
    prompt: 'test prompt',
    context: null,
    outputPath: null,
  };

  const response = await adapter.execute(agentRequest);

  assert.equal(response.success, true);
  assert.equal(response.output, "Output text");
  assert.equal(typeof response.durationMs, 'number');
});

test('createAnthropicAdapter - Network error handling', async () => {
  const adapter = createAnthropicAdapter({ apiKey: 'test-api-key', model: 'test-model' });

  // Mock client behavior
  (MockAnthropicClient.prototype.messages.create as unknown as jest.Mock).mockRejectedValueOnce(mockNetworkError);

  const agentRequest: AgentRequest = {
    prompt: 'test prompt',
    context: null,
    outputPath: null,
  };

  const response = await adapter.execute(agentRequest);

  assert.equal(response.success, false);
  assert.match(response.error, /Network error/);
});

test('createAnthropicAdapter - API limit error handling', async () => {
  const adapter = createAnthropicAdapter({ apiKey: 'test-api-key', model: 'test-model' });

  // Mock client behavior
  (MockAnthropicClient.prototype.messages.create as unknown as jest.Mock).mockRejectedValueOnce(mockAPILimitError);

  const agentRequest: AgentRequest = {
    prompt: 'test prompt',
    context: null,
    outputPath: null,
  };

  const response = await adapter.execute(agentRequest);

  assert.equal(response.success, false);
  assert.match(response.error, /API limit reached/);
});

test('createAnthropicAdapter - Invalid response structure', async () => {
  const adapter = createAnthropicAdapter({ apiKey: 'test-api-key', model: 'test-model' });

  // Mock client behavior
  (MockAnthropicClient.prototype.messages.create as unknown as jest.Mock).mockResolvedValue({ invalid: 'structure' });

  const agentRequest: AgentRequest = {
    prompt: 'test prompt',
    context: null,
    outputPath: null,
  };

  const response = await adapter.execute(agentRequest);

  assert.equal(response.success, false);
  assert.match(response.error, /API returned unexpected data structure/);
});
