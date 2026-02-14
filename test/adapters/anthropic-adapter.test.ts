import { createAnthropicAdapter } from '../../src/adapters/anthropic-adapter.js';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { AgentRequest, AgentResponse } from '../../src/types.js';

class MockAnthropicSDK {
  public messages = {
    create: async ({ model, messages }: { model: string; messages: Array<{ role: string; content: string }> }) => {
      if (model === 'valid-model') {
        if (messages[0].content === 'valid-prompt') {
          return {
            content: [{ type: 'text', text: 'Response from anthopic adapter.' }],
            usage: { input_tokens: 1, output_tokens: 5 },
            stop_reason: 'length',
          };
        } else {
          throw new Error('Unexpected prompt');
        }
      } else {
        return null;
      }
    },
  };
}

(global as any).Anthropic = MockAnthropicSDK;

const validConfig = { apiKey: 'valid-key', model: 'valid-model' };
const invalidConfig = { apiKey: 'invalid-key', model: 'invalid-model' };

describe('Anthropic Adapter', () => {
  it('should execute successfully on valid prompt', async () => {
    const adapter = createAnthropicAdapter(validConfig);

    const request: AgentRequest = {
      prompt: 'valid-prompt',
      context: '',
      outputPath: null,
    };

    const response: AgentResponse = await adapter.execute(request);

    assert.strictEqual(response.success, true);
    assert.strictEqual(response.output, 'Response from anthopic adapter.');
  });

  it('should handle invalid response structure', async () => {
    const adapter = createAnthropicAdapter(validConfig);

    try {
      const response = await adapter.execute({ prompt: 'invalid-prompt', context: '', outputPath: null });
    } catch (error: unknown) {
      if (error instanceof Error) {
        assert.strictEqual(error.message, 'API returned unexpected data structure.');
      } else {
        assert.fail('Expected error to be an instance of Error.');
      }
    }
  });

  it('should handle unexpected response status', async () => {
    const adapter = createAnthropicAdapter(invalidConfig);

    try {
      await adapter.execute({ prompt: 'any', context: '', outputPath: null });
      assert.fail('Expected exception to be thrown.');
    } catch (error: unknown) {
      if (error instanceof Error) {
        assert.strictEqual(error.message, 'Unexpected API response status.');
      } else {
        assert.fail('Expected error to be an instance of Error.');
      }
    }
  });

  // Additional edge cases to test error handlers such as network and rate limit errors
  it('should handle network errors gracefully', async () => {
    const adapter = createAnthropicAdapter(validConfig);

    const request: AgentRequest = {
      prompt: 'network-error',
      context: '',
      outputPath: null,
    };

    const response: AgentResponse = await adapter.execute(request);
    
    assert.strictEqual(response.success, false);
    assert.match(response.error, /Network error/);
  });

  it('should handle API limit errors', async () => {
    const adapter = createAnthropicAdapter(validConfig);

    const request: AgentRequest = {
      prompt: 'api-limit-error',
      context: '',
      outputPath: null,
    };

    const response: AgentResponse = await adapter.execute(request);
    
    assert.strictEqual(response.success, false);
    assert.strictEqual(response.error, 'API limit reached: Too many requests. Please try again later.');
  });

  it('should handle timeout errors', async () => {
    const adapter = createAnthropicAdapter(validConfig);

    const request: AgentRequest = {
      prompt: 'timeout-error',
      context: '',
      outputPath: null,
    };

    const response: AgentResponse = await adapter.execute(request);

    assert.strictEqual(response.success, false);
    assert.strictEqual(response.error, 'Network error: Request timed out. Please check your connection.');
  });

  it('should handle rate limit errors', async () => {
    const adapter = createAnthropicAdapter(validConfig);

    const request: AgentRequest = {
      prompt: 'rate-limit-error',
      context: '',
      outputPath: null,
    };

    const response: AgentResponse = await adapter.execute(request);

    assert.strictEqual(response.success, false);
    assert.strictEqual(response.error, 'Rate limit error: Too many requests in a short amount of time.');
  });
});
