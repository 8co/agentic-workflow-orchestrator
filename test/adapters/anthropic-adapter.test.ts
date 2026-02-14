import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnthropicAdapter } from '../../src/adapters/anthropic-adapter.js';
import type { AgentRequest, AgentResponse } from '../../src/types.js';

interface MockAnthropicResponse {
  content: Array<{ type: 'text', text: string }>;
  usage: { input_tokens: number; output_tokens: number };
  stop_reason: string;
}

const mockClient = {
  messages: {
    create: async (params: any): Promise<MockAnthropicResponse> => {
      if (params.model === 'return-invalid') {
        return {} as MockAnthropicResponse;
      } else if (params.model === 'return-unexpected') {
        throw { status: 500 };
      }
      return {
        content: [{ type: 'text', text: 'Hello World!' }],
        usage: { input_tokens: 10, output_tokens: 2 },
        stop_reason: 'stop',
      };
    },
  },
};

// Override the imported Anthropic SDK client with the mock
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => mockClient);
});

test('createAnthropicAdapter: should execute and return valid response', async () => {
  const adapter = createAnthropicAdapter({ apiKey: 'fake-key', model: 'valid-model' });
  const request: AgentRequest = { prompt: 'Say hello', context: 'Test context', outputPath: undefined };

  const response = await adapter.execute(request);
  
  assert.strictEqual(response.success, true);
  assert.ok(response.output.includes('Hello World!'));
});

test('createAnthropicAdapter: should handle invalid response structure', async () => {
  const adapter = createAnthropicAdapter({ apiKey: 'fake-key', model: 'return-invalid' });
  const request: AgentRequest = { prompt: 'Say hello', context: 'Test context', outputPath: undefined };
  
  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.ok(response.error.includes('unexpected data structure'));
});

test('createAnthropicAdapter: should handle unexpected API response status', async () => {
  const adapter = createAnthropicAdapter({ apiKey: 'fake-key', model: 'return-unexpected' });
  const request: AgentRequest = { prompt: 'Say hello', context: 'Test context', outputPath: undefined };
  
  const response = await adapter.execute(request);

  assert.strictEqual(response.success, false);
  assert.ok(response.error.includes('Unexpected API response status'));
});

test('createAnthropicAdapter: should write output to file if outputPath is provided', async () => {
  const mockWriteFile = jest.spyOn(require('node:fs/promises'), 'writeFile').mockImplementation(async () => {});
  const adapter = createAnthropicAdapter({ apiKey: 'fake-key', model: 'valid-model' });
  const request: AgentRequest = { prompt: 'Say hello', context: 'Test context', outputPath: 'output.txt' };

  const response: AgentResponse = await adapter.execute(request);
  
  assert.strictEqual(response.success, true);
  assert.ok(response.output.includes('Hello World!'));
  assert.strictEqual(mockWriteFile.mock.calls.length, 1);
  mockWriteFile.mockRestore();
});
