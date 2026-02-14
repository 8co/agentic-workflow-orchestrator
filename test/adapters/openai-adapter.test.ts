import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { createOpenAIAdapter } from '../../src/adapters/openai-adapter.js';
import type { AgentAdapter, AgentRequest, AgentResponse } from '../../src/types.js';

test('OpenAIAdapter - execute method: network error mapping', async () => {
  const mockConfig = {
    apiKey: 'valid-api-key',
    model: 'text-davinci-003',
  };
  
  const mockRequest: AgentRequest = {
    prompt: 'Test prompt',
    context: '',
    outputPath: undefined,
  };

  const adapter: AgentAdapter = createOpenAIAdapter(mockConfig);

  const networkError = new Error('Network Error');
  const unauthorizedError = new Error('401 Unauthorized');

  // Mock the execute function to throw specific errors
  const originalExecute = adapter.execute;
  adapter.execute = async (request: AgentRequest): Promise<AgentResponse> => {
    if (request.prompt.includes('network')) {
      throw networkError;
    } else if (request.prompt.includes('unauthorized')) {
      throw unauthorizedError;
    }
    return originalExecute(request);
  };

  const networkResponse = await adapter.execute({ ...mockRequest, prompt: 'simulate network issue' });
  assert.strictEqual(networkResponse.success, false);
  assert.strictEqual(networkResponse.error, 'Network error occurred. Please check your connection and try again.');

  const unauthorizedResponse = await adapter.execute({ ...mockRequest, prompt: 'simulate unauthorized access' });
  assert.strictEqual(unauthorizedResponse.success, false);
  assert.strictEqual(unauthorizedResponse.error, 'Unauthorized: Invalid API key or permissions issue.');

  // Restore the original execute function
  adapter.execute = originalExecute;
});
