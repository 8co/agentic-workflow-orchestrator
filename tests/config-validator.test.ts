import { strict as assert } from 'node:assert';
import test from 'node:test';
import { validateEnvConfig } from '../src/config-validator.js';

test('validateEnvConfig function', async (t) => {
  await t.test('should return valid and no missing keys when all environment variables are set', () => {
    process.env.ANTHROPIC_API_KEY = 'testAnthropicKey';
    process.env.OPENAI_API_KEY = 'testOpenaiKey';
    process.env.DEFAULT_AGENT = 'openai';

    const result = validateEnvConfig();

    assert.deepEqual(result, {
      valid: true,
      missing: [],
      warnings: [],
    });

    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.DEFAULT_AGENT;
  });

  await t.test('should return missing ANTHROPIC_API_KEY when anthropic API key is not set', () => {
    process.env.OPENAI_API_KEY = 'testOpenaiKey';
    const result = validateEnvConfig();

    assert.deepEqual(result, {
      valid: false,
      missing: ['ANTHROPIC_API_KEY'],
      warnings: [],
    });

    delete process.env.OPENAI_API_KEY;
  });

  await t.test('should return missing OPENAI_API_KEY when openai API key is not set', () => {
    process.env.ANTHROPIC_API_KEY = 'testAnthropicKey';
    const result = validateEnvConfig();

    assert.deepEqual(result, {
      valid: false,
      missing: ['OPENAI_API_KEY'],
      warnings: [],
    });

    delete process.env.ANTHROPIC_API_KEY;
  });

  await t.test('should return appropriate warnings when DEFAULT_AGENT is set but related API key is not configured', () => {
    process.env.DEFAULT_AGENT = 'anthropic';
    const result1 = validateEnvConfig();
    assert.deepEqual(result1, {
      valid: false,
      missing: ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'],
      warnings: ['DEFAULT_AGENT is set to "anthropic" but ANTHROPIC_API_KEY is missing.'],
    });

    process.env.DEFAULT_AGENT = 'openai';
    const result2 = validateEnvConfig();
    assert.deepEqual(result2, {
      valid: false,
      missing: ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'],
      warnings: ['DEFAULT_AGENT is set to "openai" but OPENAI_API_KEY is missing.'],
    });

    delete process.env.DEFAULT_AGENT;
  });

  await t.test('should return valid when default agent is undefined and no env vars are set', () => {
    const result = validateEnvConfig();

    assert.deepEqual(result, {
      valid: false,
      missing: ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'],
      warnings: [],
    });
  });
});
