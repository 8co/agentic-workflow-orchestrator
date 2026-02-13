import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createAnthropicAdapter } from '../../src/adapters/anthropic-adapter.js';
import type { AgentRequest, AgentResponse } from '../../src/types.js';
import Anthropic from '@anthropic-ai/sdk';

test('Anthropic Adapter - success scenario', async (t) => {
  const anthropicConfig = { apiKey: 'test-api-key', model: 'claude-test-model' };
  const anthropicAdapter = createAnthropicAdapter(anthropicConfig);

  const mockResponse = {
    content: [{ type: 'text', text: 'Test response content' }],
    usage: { input_tokens: 10, output_tokens: 5 },
    stop_reason: 'stop',
  };

  const clientStub = { messages: { create: async () => mockResponse } };
  Anthropic.mockImplementation(() => clientStub);

  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: 'Test context',
  };

  const response: AgentResponse = await anthropicAdapter.execute(request);

  assert.equal(response.success, true);
  assert.equal(response.output, 'Test response content');
  assert.ok(response.durationMs >= 0);
});

test('Anthropic Adapter - handles errors gracefully', async (t) => {
  const anthropicConfig = { apiKey: 'test-api-key', model: 'claude-test-model' };
  const anthropicAdapter = createAnthropicAdapter(anthropicConfig);

  const clientStub = { messages: { create: async () => { throw new Error('Test error'); } } };
  Anthropic.mockImplementation(() => clientStub);

  const request: AgentRequest = {
    prompt: 'Test prompt',
    context: 'Test context',
  };

  const response: AgentResponse = await anthropicAdapter.execute(request);

  assert.equal(response.success, false);
  assert.ok(response.error.includes('Test error'));
  assert.ok(response.durationMs >= 0);
});
