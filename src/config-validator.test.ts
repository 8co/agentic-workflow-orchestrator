import { validateEnvConfig } from './config-validator.js';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';

test('validateEnvConfig - all keys present, valid defaultAgent', () => {
  process.env.ANTHROPIC_API_KEY = 'some-anthropic-key';
  process.env.OPENAI_API_KEY = 'some-openai-key';
  process.env.DEFAULT_AGENT = 'openai';

  const result = validateEnvConfig();

  assert.deepEqual(result, {
    valid: true,
    missing: [],
    warnings: [],
    errors: [],
  });
});

test('validateEnvConfig - missing API keys', () => {
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
  process.env.DEFAULT_AGENT = 'codex';

  const result = validateEnvConfig();

  assert.deepEqual(result, {
    valid: false,
    missing: ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'],
    warnings: ['DEFAULT_AGENT is set to "codex" but OPENAI_API_KEY is missing.'],
    errors: [],
  });
});

test('validateEnvConfig - unrecognized defaultAgent', () => {
  process.env.ANTHROPIC_API_KEY = 'some-anthropic-key';
  process.env.OPENAI_API_KEY = 'some-openai-key';
  process.env.DEFAULT_AGENT = 'unknown-agent';

  const result = validateEnvConfig();

  assert.deepEqual(result, {
    valid: false,
    missing: [],
    warnings: [],
    errors: ['DEFAULT_AGENT is set to an unrecognized value: "unknown-agent".'],
  });
});


test('validateEnvConfig - DEFAULT_AGENT unset', () => {
  process.env.ANTHROPIC_API_KEY = 'some-anthropic-key';
  process.env.OPENAI_API_KEY = 'some-openai-key';
  delete process.env.DEFAULT_AGENT;

  const result = validateEnvConfig();

  assert.deepEqual(result, {
    valid: true,
    missing: [],
    warnings: [],
    errors: [],
  });
});

test('validateEnvConfig - DEFAULT_AGENT set to empty string', () => {
  process.env.ANTHROPIC_API_KEY = 'some-anthropic-key';
  process.env.OPENAI_API_KEY = 'some-openai-key';
  process.env.DEFAULT_AGENT = '';

  const result = validateEnvConfig();

  assert.deepEqual(result, {
    valid: true,
    missing: [],
    warnings: [],
    errors: [],
  });
});

test('validateEnvConfig - malformed environment', () => {
  process.env.ANTHROPIC_API_KEY = '';
  process.env.OPENAI_API_KEY = '';
  process.env.DEFAULT_AGENT = 'codex';

  const result = validateEnvConfig();

  assert.deepEqual(result, {
    valid: false,
    missing: ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'],
    warnings: ['DEFAULT_AGENT is set to "codex" but OPENAI_API_KEY is missing.'],
    errors: [],
  });
});
