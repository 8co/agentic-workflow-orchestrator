import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPromptResolver } from '../src/prompt-resolver.js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { writeFile } from 'node:fs/promises';
import { rm } from 'node:fs/promises';

const TEMPLATE_CONTENT = "Hello, {{name}}! Your step output is: {{steps.step1.output}}";
const TEMP_DIR_PREFIX = 'prompt_resolver_test_';

test('createPromptResolver - resolves template correctly', async () => {
  const tempDir = await mkdtemp(resolve(tmpdir(), TEMP_DIR_PREFIX));
  const templatePath = resolve(tempDir, 'template.txt');
  await writeFile(templatePath, TEMPLATE_CONTENT);

  try {
    const resolver = createPromptResolver(tempDir);
    const result = await resolver.resolve('template.txt', { name: 'World' }, { step1: 'Success' });
    
    assert.strictEqual(result, "Hello, World! Your step output is: Success");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('createPromptResolver - warns on unresolved variable', async () => {
  const tempDir = await mkdtemp(resolve(tmpdir(), TEMP_DIR_PREFIX));
  const templatePath = resolve(tempDir, 'template.txt');
  await writeFile(templatePath, TEMPLATE_CONTENT);

  try {
    const resolver = createPromptResolver(tempDir);

    // Capture warnings
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (message: string) => warnings.push(message);
    
    const result = await resolver.resolve('template.txt', { name: 'World' }, {});
    assert.strictEqual(result, "Hello, World! Your step output is: {{steps.step1.output}}");
    assert.strictEqual(warnings.length, 1);
    assert.match(warnings[0], /Unresolved variable: \{\{steps.step1.output\}\}/);

    // Restore console.warn
    console.warn = originalWarn;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('createPromptResolver - throws error if template not found', async () => {
  const tempDir = await mkdtemp(resolve(tmpdir(), TEMP_DIR_PREFIX));
  
  try {
    const resolver = createPromptResolver(tempDir);
    
    await assert.rejects(
      async () => {
        await resolver.resolve('nonexistent.txt', {}, {});
      },
      (error: Error) => {
        assert.match(error.message, /Prompt template not found/);
        return true;
      }
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
