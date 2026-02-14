import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createAnthropicAdapter } from '../../src/adapters/anthropic-adapter.js';
import type { AgentRequest, AgentResponse } from '../../src/types.js';

class MockAnthropicClient {
  messages = {
    create: async (params: unknown) => {
      if (!params) throw new Error('Invalid parameters');
      return {
        content: [{ type: 'text', text: 'Response text' }],
        usage: { input_tokens: 10, output_tokens: 5 },
        stop_reason: 'end',
      };
    }
  }
}

const mockConfig = { apiKey: 'test-api-key', model: 'test-model' };
const mockRequest: AgentRequest = {
  context: 'Sample context',
  prompt: 'Sample prompt',
  outputPath: ''
};

test('Anthropic Adapter - Successful Execution', async () => {
  const adapter = createAnthropicAdapter(mockConfig);
  (adapter as any).client = new MockAnthropicClient();

  const response: AgentResponse = await adapter.execute(mockRequest);

  assert.equal(response.success, true);
  assert.equal(response.output, 'Response text');
});

test('Anthropic Adapter - Invalid API Response', async () => {
  const adapter = createAnthropicAdapter(mockConfig);
  (adapter as any).client = {
    messages: {
      create: async () => ({})
    }
  };

  const response: AgentResponse = await adapter.execute(mockRequest);

  assert.equal(response.success, false);
  assert.match(response.error, /API returned unexpected data structure/);
});

test('Anthropic Adapter - Network Error', async () => {
  const adapter = createAnthropicAdapter(mockConfig);
  (adapter as any).client = {
    messages: {
      create: async () => { throw new Error('Network Error: Unable to reach the server'); }
    }
  };

  const response: AgentResponse = await adapter.execute(mockRequest);

  assert.equal(response.success, false);
  assert.match(response.error, /Network error: Unable to reach the API/);
});

test('Anthropic Adapter - API Limit Error', async () => {
  const adapter = createAnthropicAdapter(mockConfig);
  (adapter as any).client = {
    messages: {
      create: async () => {
        const error = new Error('API limit reached');
        (error as any).response = { status: 429 };
        throw error;
      }
    }
  };

  const response: AgentResponse = await adapter.execute(mockRequest);

  assert.equal(response.success, false);
  assert.match(response.error, /API limit reached: Too many requests/);
});

test('Anthropic Adapter - Timeout Error', async () => {
  const adapter = createAnthropicAdapter(mockConfig);
  (adapter as any).client = {
    messages: {
      create: async () => { throw new Error('timeout'); }
    }
  };

  const response: AgentResponse = await adapter.execute(mockRequest);

  assert.equal(response.success, false);
  assert.match(response.error, /Network error: Request timed out/);
});
