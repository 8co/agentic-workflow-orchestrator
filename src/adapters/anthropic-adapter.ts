/**
 * Anthropic Agent Adapter
 * Executes prompts via Claude API and returns structured responses
 */

import Anthropic from '@anthropic-ai/sdk';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { AgentAdapter, AgentRequest, AgentResponse } from '../types.js';

interface AnthropicConfig {
  apiKey: string;
  model: string;
}

interface AnthropicResponse {
  content: Array<Anthropic.TextBlock>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  stop_reason: string;
}

function isNetworkError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'ENOTFOUND';
}

function isAPILimitError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'response' in err && (err as { response: { status: number } }).response.status === 429;
}

function isInvalidResponseError(response: unknown): response is Partial<AnthropicResponse> {
  return typeof response !== 'object' || response === null || !('content' in response) || !('usage' in response);
}

function isUnexpectedResponseError(response: unknown): boolean {
  return typeof response === 'object' && response !== null && 'status' in response && (response as { status: number }).status >= 400;
}

export function createAnthropicAdapter(config: AnthropicConfig): AgentAdapter {
  const client = new Anthropic({ apiKey: config.apiKey });

  return {
    name: 'anthropic',

    async execute(request: AgentRequest): Promise<AgentResponse> {
      const start = Date.now();

      try {
        console.log('\n┌─────────────────────────────────────────');
        console.log(`│ 🧠 Anthropic (${config.model}) — Executing`);
        console.log('├─────────────────────────────────────────');

        const systemPrompt = request.context
          ? `You are an expert software engineer. Follow all instructions precisely.\n\nContext:\n${request.context}`
          : 'You are an expert software engineer. Follow all instructions precisely. Return only the requested output — no preamble, no explanation unless asked.';

        const message = await client.messages.create({
          model: config.model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: request.prompt,
            },
          ],
        });

        if (isInvalidResponseError(message)) {
          console.error('Invalid response structure:', message);
          throw new Error('API returned unexpected data structure.');
        } else if (isUnexpectedResponseError(message)) {
          console.error('Unexpected API response status:', message);
          throw new Error('Unexpected API response status.');
        }

        // Extract text from response
        const textBlocks = message.content.filter(
          (block): block is Anthropic.TextBlock => block.type === 'text'
        );
        const output = textBlocks.map((b) => b.text).join('\n');

        const durationMs = Date.now() - start;

        // Write to output file if specified
        if (request.outputPath) {
          await mkdir(dirname(request.outputPath), { recursive: true });
          await writeFile(request.outputPath, output, 'utf-8');
          console.log(`│ 📄 Output written to: ${request.outputPath}`);
        }

        // Log preview
        const lines = output.split('\n');
        const preview = lines.slice(0, 10).join('\n');
        console.log('│');
        console.log(preview.replace(/^/gm, '│  '));
        if (lines.length > 10) {
          console.log(`│  ... (${lines.length - 10} more lines)`);
        }

        console.log('│');
        console.log(`│ ⏱  Duration: ${durationMs}ms`);
        console.log(`│ 📊 Tokens: ${message.usage.input_tokens} in / ${message.usage.output_tokens} out`);
        console.log(`│ 🛑 Stop: ${message.stop_reason}`);
        console.log('└─────────────────────────────────────────\n');

        return {
          success: true,
          output,
          durationMs,
        };
      } catch (err) {
        let error = 'An unknown error occurred.';

        if (isNetworkError(err)) {
          error = 'Network error: Unable to reach the API.';
        } else if (isAPILimitError(err)) {
          error = 'API limit reached: Too many requests. Please try again later.';
        } else if (err instanceof Error) {
          error = err.message;
        }

        const durationMs = Date.now() - start;

        console.log(`│ ❌ Error: ${error}`);
        console.log('└─────────────────────────────────────────\n');

        return {
          success: false,
          error,
          durationMs,
        };
      }
    },
  };
}
