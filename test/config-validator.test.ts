import assert from 'node:assert';
import { test } from 'node:test';
import { validateEnvConfig } from '../src/config-validator.js';

test('validateEnvConfig returns valid=false with missing keys and appropriate messages', () => {
  process.env.ANTHROPIC_API_KEY = '';
  process.env.OPENAI_API_KEY = '';
  process.env.DEFAULT_AGENT = 'codex';

  const result = validateEnvConfig();
  
  assert.strictEqual(result.valid, false);
  assert.deepStrictEqual(result.missing, ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY']);
  assert.deepStrictEqual(result.warnings, ['DEFAULT_AGENT is set to "codex" but OPENAI_API_KEY is missing.']);
  assert.deepStrictEqual(result.errors, []);
});

test('validateEnvConfig returns valid=true when all environment variables are set correctly', () => {
  process.env.ANTHROPIC_API_KEY = 'sample-anthropic-key';
  process.env.OPENAI_API_KEY = 'sample-openai-key';
  process.env.DEFAULT_AGENT = 'anthropic';

  const result = validateEnvConfig();

  assert.strictEqual(result.valid, true);
  assert.deepStrictEqual(result.missing, []);
  assert.deepStrictEqual(result.warnings, []);
  assert.deepStrictEqual(result.errors, []);
});

test('validateEnvConfig returns an error if DEFAULT_AGENT has an unrecognized value', () => {
  process.env.ANTHROPIC_API_KEY = 'sample-anthropic-key';
  process.env.OPENAI_API_KEY = 'sample-openai-key';
  process.env.DEFAULT_AGENT = 'unknown';

  const result = validateEnvConfig();

  assert.strictEqual(result.valid, false);
  assert.deepStrictEqual(result.missing, []);
  assert.deepStrictEqual(result.warnings, []);
  assert.deepStrictEqual(result.errors, ['DEFAULT_AGENT is set to an unrecognized value: "unknown".']);
});

test('validateEnvConfig handles unknown error gracefully', () => {
  const original = process.env;

  Object.defineProperty(process, 'env', {
    value: null,
    writable: true
  });

  const result = validateEnvConfig();
  
  assert.strictEqual(result.valid, false);
  assert.deepStrictEqual(result.missing, []);
  assert.deepStrictEqual(result.warnings, []);
  assert.strictEqual(result.errors.length, 1);
  assert.ok(result.errors[0].startsWith('An error occurred during validation:'));

  Object.defineProperty(process, 'env', { value: original, writable: true });
});
