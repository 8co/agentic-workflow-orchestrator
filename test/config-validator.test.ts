import { test } from 'node:test';
import assert from 'node:assert';
import { validateEnvConfig } from '../src/config-validator.js';

test('validateEnvConfig with all variables set correctly', () => {
  process.env.ANTHROPIC_API_KEY = 'valid-api-key-anthropic';
  process.env.OPENAI_API_KEY = 'valid-api-key-openai';
  process.env.DEFAULT_AGENT = 'anthropic';

  const result = validateEnvConfig();
  assert.strictEqual(result.valid, true);
  assert.deepStrictEqual(result.missing, []);
  assert.deepStrictEqual(result.warnings, []);
  assert.deepStrictEqual(result.errors, []);
});

test('validateEnvConfig with missing ANTHROPIC_API_KEY', () => {
  delete process.env.ANTHROPIC_API_KEY;
  process.env.OPENAI_API_KEY = 'valid-api-key-openai';
  process.env.DEFAULT_AGENT = 'anthropic';

  const result = validateEnvConfig();
  assert.strictEqual(result.valid, false);
  assert.deepStrictEqual(result.missing, ['ANTHROPIC_API_KEY']);
  assert.deepStrictEqual(result.warnings, ['DEFAULT_AGENT is set to "anthropic" but ANTHROPIC_API_KEY is missing.']);
  assert.deepStrictEqual(result.errors, []);
});

test('validateEnvConfig with missing OPENAI_API_KEY', () => {
  process.env.ANTHROPIC_API_KEY = 'valid-api-key-anthropic';
  delete process.env.OPENAI_API_KEY;
  process.env.DEFAULT_AGENT = 'openai';

  const result = validateEnvConfig();
  assert.strictEqual(result.valid, false);
  assert.deepStrictEqual(result.missing, ['OPENAI_API_KEY']);
  assert.deepStrictEqual(result.warnings, ['DEFAULT_AGENT is set to "openai" but OPENAI_API_KEY is missing.']);
  assert.deepStrictEqual(result.errors, []);
});

test('validateEnvConfig with unrecognized DEFAULT_AGENT', () => {
  process.env.ANTHROPIC_API_KEY = 'valid-api-key-anthropic';
  process.env.OPENAI_API_KEY = 'valid-api-key-openai';
  process.env.DEFAULT_AGENT = 'unknown-agent' as any;

  const result = validateEnvConfig();
  assert.strictEqual(result.valid, false);
  assert.deepStrictEqual(result.missing, []);
  assert.deepStrictEqual(result.warnings, []);
  assert.deepStrictEqual(result.errors, ['DEFAULT_AGENT is set to an unrecognized value: "unknown-agent".']);
});

test('validateEnvConfig with no environment variables set', () => {
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.DEFAULT_AGENT;

  const result = validateEnvConfig();
  assert.strictEqual(result.valid, false);
  assert.deepStrictEqual(result.missing, ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY']);
  assert.deepStrictEqual(result.warnings, []);
  assert.deepStrictEqual(result.errors, []);
});
