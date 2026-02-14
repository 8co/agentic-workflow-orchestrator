import { test } from 'node:test';
import assert from 'node:assert';
import { createOpenAIAdapter } from './openai-adapter.js';
import type { AgentRequest, AgentResponse } from '../types.js';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Mock OpenAI client and its methods
class MockOpenAI {
  chat = {
    completions: {
      create: async ({ model, messages, max_tokens }: { model: string; messages: any; max_tokens: number }): Promise<any> => {
        return {
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: 'This is a test response from OpenAI.',
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 5,
            completion_tokens: 12,
            total_tokens: 17,
          },
        };
      },
    },
  };
}

// Mock OpenAI module import
function OpenAI({ apiKey }: { apiKey: string }) {
  return new MockOpenAI();
}

// Mock node:fs/promises methods
const mockWriteFile = writeFile;
const mockMkdir = mkdir;

test('OpenAI Adapter: Successful execution', async (t) => {
  const config = {
    apiKey: 'test-api-key',
    model: 'text-davinci-002',
  };
  const adapterName = 'openai';
  const adapter = createOpenAIAdapter(config, adapterName);
  
  // Agent request
  const request: AgentRequest = {
    prompt: 'Test the OpenAI adapter.',
  };

  // Execute the adapter and verify the response
  const response: AgentResponse = await adapter.execute(request);
  assert.strictEqual(response.success, true);
  assert.strictEqual(response.output, 'This is a test response from OpenAI.');
  assert.strictEqual(typeof response.durationMs, 'number');
});

test('OpenAI Adapter: Proper file writing', async (t) => {
  const config = {
    apiKey: 'test-api-key',
    model: 'text-davinci-002',
  };
  const adapterName = 'openai';
  const adapter = createOpenAIAdapter(config, adapterName);

  // Agent request with output path
  const outputPath = path.join(__dirname, 'output.txt');
  const request: AgentRequest = {
    prompt: 'Test the OpenAI adapter.',
    outputPath,
  };

  // Stubbing the mkdir and writeFile
  let writeCalled = false;
  let mkdirCalled = false;

  async function mockMkdirFn(dir: string, options: { recursive: boolean }) {
    mkdirCalled = true;
    assert.strictEqual(dir, path.dirname(outputPath));
    assert.strictEqual(options.recursive, true);
  }

  async function mockWriteFileFn(file: string, data: string) {
    writeCalled = true;
    assert.strictEqual(file, outputPath);
    assert.strictEqual(data, 'This is a test response from OpenAI.');
  }

  // Override mocks
  (mkdir as unknown) = mockMkdirFn;
  (writeFile as unknown) = mockWriteFileFn;

  // Execute the adapter
  const response: AgentResponse = await adapter.execute(request);
  assert.strictEqual(response.success, true);
  assert.strictEqual(writeCalled, true);
  assert.strictEqual(mkdirCalled, true);
});
