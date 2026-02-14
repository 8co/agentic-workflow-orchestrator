import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { loadConfig, validateConfig } from '../src/config.js';
import type { AgentType, Config } from '../src/types.js';

test('loadConfig should load default configuration when no environment variables are set', () => {
  // Save original environment variables
  const originalEnv = process.env;
  process.env = {};

  const config = loadConfig();
  assert.deepEqual(config, {
    anthropic: {
      apiKey: '',
      model: 'claude-sonnet-4-20250514',
    },
    openai: {
      apiKey: '',
      model: 'gpt-4o',
    },
    defaultAgent: 'anthropic',
  });

  // Restore original environment variables
  process.env = originalEnv;
});

test('loadConfig should load configuration from environment variables', () => {
  // Save original environment variables
  const originalEnv = process.env;
  
  const testEnv = {
    ANTHROPIC_API_KEY: 'test_ant_key',
    ANTHROPIC_MODEL: 'custom-anthropic-model',
    OPENAI_API_KEY: 'test_openai_key',
    OPENAI_MODEL: 'custom-openai-model',
    DEFAULT_AGENT: 'openai',
  };

  process.env = testEnv;

  const config = loadConfig();
  assert.deepEqual(config, {
    anthropic: {
      apiKey: 'test_ant_key',
      model: 'custom-anthropic-model',
    },
    openai: {
      apiKey: 'test_openai_key',
      model: 'custom-openai-model',
    },
    defaultAgent: 'openai',
  });

  // Restore original environment variables
  process.env = originalEnv;
});

test('validateConfig should throw an error if ANTHROPIC_API_KEY is missing for anthropic agent', () => {
  const config: Config = {
    anthropic: { apiKey: '', model: 'claude-sonnet-4-20250514' },
    openai: { apiKey: 'valid_openai_key', model: 'gpt-4o' },
    defaultAgent: 'anthropic',
  };

  assert.throws(() => validateConfig(config, 'anthropic'), {
    message: 'ANTHROPIC_API_KEY is required. Copy .env.example to .env and set your key.',
  });
});

test('validateConfig should NOT throw an error if ANTHROPIC_API_KEY is present for anthropic agent', () => {
  const config: Config = {
    anthropic: { apiKey: 'valid_ant_key', model: 'claude-sonnet-4-20250514' },
    openai: { apiKey: 'valid_openai_key', model: 'gpt-4o' },
    defaultAgent: 'anthropic',
  };

  assert.doesNotThrow(() => validateConfig(config, 'anthropic'));
});

test('validateConfig should throw an error if OPENAI_API_KEY is missing for codex or openai agent', () => {
  const config: Config = {
    anthropic: { apiKey: 'valid_ant_key', model: 'claude-sonnet-4-20250514' },
    openai: { apiKey: '', model: 'gpt-4o' },
    defaultAgent: 'openai',
  };

  assert.throws(() => validateConfig(config, 'openai'), {
    message: 'OPENAI_API_KEY is required. Copy .env.example to .env and set your key.',
  });

  assert.throws(() => validateConfig(config, 'codex'), {
    message: 'OPENAI_API_KEY is required. Copy .env.example to .env and set your key.',
  });
});

test('validateConfig should NOT throw an error if OPENAI_API_KEY is present for codex or openai agent', () => {
  const config: Config = {
    anthropic: { apiKey: 'valid_ant_key', model: 'claude-sonnet-4-20250514' },
    openai: { apiKey: 'valid_openai_key', model: 'gpt-4o' },
    defaultAgent: 'openai',
  };

  assert.doesNotThrow(() => validateConfig(config, 'openai'));
  assert.doesNotThrow(() => validateConfig(config, 'codex'));
});
