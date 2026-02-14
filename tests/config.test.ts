import { strict as assert } from 'node:assert';
import { loadConfig, validateConfig } from '../src/config.js';
import type { Config } from '../src/config.js';

// Mocking process.env
const ORIGINAL_ENV = process.env;

function resetEnv() {
  process.env = { ...ORIGINAL_ENV };
}

function mockEnv(values: { [key: string]: string }) {
  process.env = { ...process.env, ...values };
}

// Tests
(async () => {

  // Test loadConfig function
  {
    // Test case: loadConfig with all environment variables set
    mockEnv({
      ANTHROPIC_API_KEY: 'test_anthropic_api_key',
      ANTHROPIC_MODEL: 'test_anthropic_model',
      OPENAI_API_KEY: 'test_openai_api_key',
      OPENAI_MODEL: 'test_openai_model',
      DEFAULT_AGENT: 'openai',
    });
    const config: Config = loadConfig();
    assert.equal(config.anthropic.apiKey, 'test_anthropic_api_key');
    assert.equal(config.anthropic.model, 'test_anthropic_model');
    assert.equal(config.openai.apiKey, 'test_openai_api_key');
    assert.equal(config.openai.model, 'test_openai_model');
    assert.equal(config.defaultAgent, 'openai');
  }

  {
    // Test case: loadConfig with missing environment variables
    resetEnv();
    mockEnv({
      ANTHROPIC_API_KEY: '',
      OPENAI_API_KEY: '',
      DEFAULT_AGENT: 'anthropic',
    });
    const config: Config = loadConfig();
    assert.equal(config.anthropic.apiKey, '');
    assert.equal(config.anthropic.model, 'claude-sonnet-4-20250514');
    assert.equal(config.openai.apiKey, '');
    assert.equal(config.openai.model, 'gpt-4o');
    assert.equal(config.defaultAgent, 'anthropic');
  }

  // Test validateConfig function
  {
    // Test case: validateConfig raises error for missing ANTHROPIC_API_KEY
    resetEnv();
    mockEnv({ DEFAULT_AGENT: 'anthropic' });
    const config: Config = loadConfig();
    assert.throws(
      () => validateConfig(config, 'anthropic'),
      new Error('ANTHROPIC_API_KEY is required. Copy .env.example to .env and set your key.')
    );
  }

  {
    // Test case: validateConfig raises error for missing OPENAI_API_KEY with agent 'openai'
    resetEnv();
    mockEnv({ DEFAULT_AGENT: 'openai' });
    const config: Config = loadConfig();
    assert.throws(
      () => validateConfig(config, 'openai'),
      new Error('OPENAI_API_KEY is required. Copy .env.example to .env and set your key.')
    );
  }

  {
    // Test case: validateConfig raises error for missing OPENAI_API_KEY with agent 'codex'
    resetEnv();
    mockEnv({ DEFAULT_AGENT: 'codex' });
    const config: Config = loadConfig();
    assert.throws(
      () => validateConfig(config, 'codex'),
      new Error('OPENAI_API_KEY is required. Copy .env.example to .env and set your key.')
    );
  }

  {
    // Test case: validateConfig does not raise error when keys are present
    resetEnv();
    mockEnv({
      ANTHROPIC_API_KEY: 'test_anthropic_api_key',
      OPENAI_API_KEY: 'test_openai_api_key',
    });
    const config: Config = loadConfig();
    assert.doesNotThrow(() => validateConfig(config, 'anthropic'));
    assert.doesNotThrow(() => validateConfig(config, 'openai'));
  }
})();
