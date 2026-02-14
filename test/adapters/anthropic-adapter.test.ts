import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createAnthropicAdapter } from '../../src/adapters/anthropic-adapter.js';
import type { AgentRequest } from '../../src/types.js';

const mockValidResponse = {
  content: [{ type: 'text', text: 'Test response' }],
  usage: { input_tokens: 10, output_tokens: 20 },
  stop_reason: 'stop_sequence',
};

// Mocking Anthropic SDK
class MockAnthropic {
  messages = {
    create: async (request: unknown) => {
      if ((request as any).model === 'error-model') throw new Error('API error');
      if ((request as any).model === 'api-limit-model') {
        const error = new Error('API limit reached') as any;
        error.response = { status: 429 };
        throw error;
      }
      return mockValidResponse;
    },
  };
}

// Replace `@anthropic-ai/sdk` import with the mock
import * as sdkModule from '@anthropic-ai/sdk';
sdkModule.default = MockAnthropic;

describe('Anthropic Adapter', () => {
  let config: { apiKey: string; model: string };

  beforeEach(() => {
    config = { apiKey: 'fake-api-key', model: 'test-model' };
  });

  it('should return success with valid response', async () => {
    const adapter = createAnthropicAdapter(config);
    const request: AgentRequest = {
      prompt: 'Write some code',
      context: 'Context here',
    };

    const response = await adapter.execute(request);

    assert.strictEqual(response.success, true);
    assert.strictEqual(response.output, 'Test response');
    assert.strictEqual(typeof response.durationMs, 'number');
  });

  it('should return error if API responds with unexpected structure', async () => {
    const adapter = createAnthropicAdapter(config);
    (sdkModule.default.prototype.messages.create as any) = async () => ({ invalid: 'data' });

    const request: AgentRequest = {
      prompt: 'Analyze this code',
    };

    const response = await adapter.execute(request);

    assert.strictEqual(response.success, false);
    assert.match(response.error!, /unexpected data structure/i);
  });

  it('should handle API limit errors correctly', async () => {
    const limitConfig = { ...config, model: 'api-limit-model' };
    const adapter = createAnthropicAdapter(limitConfig);

    const request: AgentRequest = {
      prompt: 'Write some code',
    };

    const response = await adapter.execute(request);

    assert.strictEqual(response.success, false);
    assert.match(response.error!, /API limit reached/i);
  });

  it('should handle generic API errors', async () => {
    const errorConfig = { ...config, model: 'error-model' };
    const adapter = createAnthropicAdapter(errorConfig);

    const request: AgentRequest = {
      prompt: 'Write some code',
    };

    const response = await adapter.execute(request);

    assert.strictEqual(response.success, false);
    assert.match(response.error!, /API error/i);
  });

  it('should handle network errors', async () => {
    const adapter = createAnthropicAdapter(config);
    const originalNetworkErrorCheck = (adapter as any).__proto__.constructor.prototype.__proto__.isNetworkError;
    (adapter as any).__proto__.constructor.prototype.__proto__.isNetworkError = () => true;

    const request: AgentRequest = {
      prompt: 'Write some code',
    };

    const response = await adapter.execute(request);

    assert.strictEqual(response.success, false);
    assert.match(response.error!, /Network error/i);

    (adapter as any).__proto__.constructor.prototype.__proto__.isNetworkError = originalNetworkErrorCheck; // Restore original function
  });
});
