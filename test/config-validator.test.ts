import { validateEnvConfig } from '../src/config-validator.js';
import { strict as assert } from 'node:assert';

function setEnv(env: { [key: string]: string | undefined }): void {
  for (const key in env) {
    process.env[key] = env[key];
  }
}

function clearEnv(keys: string[]): void {
  for (const key of keys) {
    delete process.env[key];
  }
}

test('validateEnvConfig - all keys present and valid', () => {
  setEnv({
    ANTHROPIC_API_KEY: 'testKeyAnthropic',
    OPENAI_API_KEY: 'testKeyOpenAI',
    DEFAULT_AGENT: 'anthropic'
  });

  const result = validateEnvConfig();
  assert.deepEqual(result, {
    valid: true,
    missing: [],
    warnings: [],
    errors: []
  });

  clearEnv(['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'DEFAULT_AGENT']);
});

test('validateEnvConfig - missing ANTHROPIC_API_KEY', () => {
  setEnv({
    OPENAI_API_KEY: 'testKeyOpenAI',
    DEFAULT_AGENT: 'anthropic'
  });

  const result = validateEnvConfig();
  assert.deepEqual(result, {
    valid: false,
    missing: ['ANTHROPIC_API_KEY'],
    warnings: ['DEFAULT_AGENT is set to "anthropic" but ANTHROPIC_API_KEY is missing.'],
    errors: []
  });

  clearEnv(['OPENAI_API_KEY', 'DEFAULT_AGENT']);
});

test('validateEnvConfig - missing OPENAI_API_KEY', () => {
  setEnv({
    ANTHROPIC_API_KEY: 'testKeyAnthropic',
    DEFAULT_AGENT: 'openai'
  });

  const result = validateEnvConfig();
  assert.deepEqual(result, {
    valid: false,
    missing: ['OPENAI_API_KEY'],
    warnings: ['DEFAULT_AGENT is set to "openai" but OPENAI_API_KEY is missing.'],
    errors: []
  });

  clearEnv(['ANTHROPIC_API_KEY', 'DEFAULT_AGENT']);
});

test('validateEnvConfig - missing both API keys', () => {
  setEnv({
    DEFAULT_AGENT: 'codex'
  });

  const result = validateEnvConfig();
  assert.deepEqual(result, {
    valid: false,
    missing: ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'],
    warnings: ['DEFAULT_AGENT is set to "codex" but OPENAI_API_KEY is missing.'],
    errors: []
  });

  clearEnv(['DEFAULT_AGENT']);
});

test('validateEnvConfig - unrecognized DEFAULT_AGENT', () => {
  setEnv({
    ANTHROPIC_API_KEY: 'testKeyAnthropic',
    OPENAI_API_KEY: 'testKeyOpenAI',
    DEFAULT_AGENT: 'unknown'
  });

  const result = validateEnvConfig();
  assert.deepEqual(result, {
    valid: false,
    missing: [],
    warnings: [],
    errors: ['DEFAULT_AGENT is set to an unrecognized value: "unknown".']
  });

  clearEnv(['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'DEFAULT_AGENT']);
});

test('validateEnvConfig - no vars set', () => {
  clearEnv(['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'DEFAULT_AGENT']);
  
  const result = validateEnvConfig();
  assert.deepEqual(result, {
    valid: false,
    missing: ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'],
    warnings: [],
    errors: []
  });
});
