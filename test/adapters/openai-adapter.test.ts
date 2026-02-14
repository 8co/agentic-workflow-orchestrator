import { createOpenAIAdapter } from '../../src/adapters/openai-adapter.js';
import assert from 'node:assert';
import test from 'node:test';
import type { AgentRequest } from '../../src/types.js';

const validConfig = {
  apiKey: 'testApiKey',
  model: 'testModel',
};

const invalidConfigs = [
  { apiKey: '', model: 'testModel' },
  { apiKey: 'testApiKey', model: '' },
  { apiKey: '', model: '' },
];

const validRequest: AgentRequest = {
  prompt: 'What is TypeScript?',
  context: 'Programming Languages',
  outputPath: undefined,
};

test('OpenAI Adapter creation with valid config', async () => {
  const adapter = createOpenAIAdapter(validConfig);
  assert.strictEqual(adapter.name, 'openai');
});

invalidConfigs.forEach((config, index) => {
  test(`OpenAI Adapter creation with invalid config #${index + 1}`, async () => {
    assert.throws(() => {
      createOpenAIAdapter(config);
    }, /Invalid OpenAI configuration/);
  });
});

test('OpenAI Adapter execute method success', async () => {
  const adapter = createOpenAIAdapter(validConfig);

  const mockResponse = {
    choices: [{ index: 0, message: { role: 'assistant', content: 'TypeScript is a typed superset of JavaScript.' }, finish_reason: 'stop' }],
  };
  
  // Mocking OpenAI client call
  adapter['client'] = {
    chat: {
      completions: {
        create: () => Promise.resolve(mockResponse),
      },
    },
  };

  const response = await adapter.execute(validRequest);

  assert.strictEqual(response.success, true);
  assert.strictEqual(typeof response.output, 'string');
  assert.match(response.output, /TypeScript/);
});

test('OpenAI Adapter execute method failure with malformed response', async () => {
  const adapter = createOpenAIAdapter(validConfig);

  const mockResponse = {
    choices: [],
  };

  // Mocking OpenAI client call with malformed response
  adapter['client'] = {
    chat: {
      completions: {
        create: () => Promise.resolve(mockResponse),
      },
    },
  };

  const response = await adapter.execute(validRequest);

  assert.strictEqual(response.success, false);
  assert.match(response.error, /Malformed response from OpenAI service/);
});

test('OpenAI Adapter execute method with timeout', async () => {
  const adapter = createOpenAIAdapter(validConfig);

  const neverResolvePromise = new Promise(() => {});

  // Mocking OpenAI client call that takes too long
  adapter['client'] = {
    chat: {
      completions: {
        create: () => neverResolvePromise,
      },
    },
  };

  const response = await adapter.execute(validRequest);

  assert.strictEqual(response.success, false);
  assert.match(response.error, /Request timed out/);
});

test('OpenAI Adapter execute method unauthorized error', async () => {
  const adapter = createOpenAIAdapter(validConfig);

  // Mocking OpenAI client call with error
  adapter['client'] = {
    chat: {
      completions: {
        create: () => Promise.reject(new Error('401')),
      },
    },
  };

  const response = await adapter.execute(validRequest);

  assert.strictEqual(response.success, false);
  assert.match(response.error, /Unauthorized: Invalid API key/);
});
