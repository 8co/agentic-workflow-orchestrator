/**
 * OpenAI Agent Adapter
 * Executes prompts via GPT / Codex API and returns structured responses
 */

import OpenAI from 'openai';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { AgentAdapter, AgentRequest, AgentResponse } from '../types.js';

interface OpenAIConfig {
  apiKey: string;
  model: string;
}

function isValidOpenAIConfig(config: OpenAIConfig): boolean {
  return typeof config.apiKey === 'string' && config.apiKey.trim() !== '' &&
    typeof config.model === 'string' && config.model.trim() !== '';
}

interface CompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: CompletionChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface CompletionChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

function mapErrorMessage(message: string): string | undefined {
  const errorMapping: Record<string, string> = {
    'Network Error': 'Network error occurred. Please check your connection and try again.',
    'timeout': 'Request timed out. Please try again later.',
    '401': 'Unauthorized: Invalid API key or permissions issue.',
    '403': 'Forbidden: You do not have permission to access this resource.',
    '404': 'Not found: The requested resource could not be found.',
    '500': 'Internal server error. Try again after some time.',
    '502': 'Bad Gateway: Invalid response from the upstream server.',
    '503': 'Service unavailable: OpenAI temporarily unavailable. Try again after some time.',
    '504': 'Gateway timeout: Upstream server failed to send a request in time.',
    '429': 'Too many requests: You have hit the rate limit. Try again later.',
    'Malformed response': 'Received a malformed response from OpenAI. Please try again later.'
  };
  
  for (const key in errorMapping) {
    if (message.includes(key)) {
      return errorMapping[key];
    }
  }
  return undefined;
}

function generateErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return mapErrorMessage(err.message) || 'An unexpected error occurred. Please try again later.';
  }
  return 'An unknown error occurred.';
}

export function createOpenAIAdapter(config: OpenAIConfig, adapterName: 'openai' | 'codex' = 'openai'): AgentAdapter {
  if (!isValidOpenAIConfig(config)) {
    throw new Error('Invalid OpenAI configuration');
  }

  const client = new OpenAI({ apiKey: config.apiKey });

  return {
    name: adapterName,

    async execute(request: AgentRequest): Promise<AgentResponse> {
      const start: number = Date.now();
      console.log(`\n🔍 Request Details: ${JSON.stringify(request, null, 2)}`);

      try {
        console.log('\n┌─────────────────────────────────────────');
        console.log(`│ 🤖 OpenAI (${config.model}) — Executing`);
        console.log('├─────────────────────────────────────────');

        const systemContent: string = request.context
          ? `You are an expert software engineer. Follow all instructions precisely.\n\nContext:\n${request.context}`
          : 'You are an expert software engineer. Follow all instructions precisely. Return only the requested output — no preamble, no explanation unless asked.';

        const completion = await client.chat.completions.create({
          model: config.model,
          messages: [
            { role: 'system', content: systemContent },
            { role: 'user', content: request.prompt },
          ],
          max_tokens: 4096,
        });

        if (!completion || !Array.isArray(completion.choices) || completion.choices.length === 0 || !completion.choices[0].message?.content) {
          throw new Error('Malformed response from OpenAI service');
        }

        const output: string = completion.choices[0].message.content ?? '';
        const durationMs: number = Date.now() - start;

        console.log(`\n💬 Response Details: ${JSON.stringify(completion, null, 2)}`);

        if (request.outputPath) {
          await mkdir(dirname(request.outputPath), { recursive: true });
          await writeFile(request.outputPath, output, 'utf-8');
          console.log(`│ 📄 Output written to: ${request.outputPath}`);
        }

        const lines: string[] = output.split('\n');
        const preview: string = lines.slice(0, 10).join('\n');
        console.log('│');
        console.log(preview.replace(/^/gm, '│  '));
        if (lines.length > 10) {
          console.log(`│  ... (${lines.length - 10} more lines)`);
        }

        console.log('│');
        console.log(`│ ⏱  Duration: ${durationMs}ms`);
        console.log(`│ 📊 Tokens: ${completion.usage?.prompt_tokens ?? '?'} in / ${completion.usage?.completion_tokens ?? '?'} out`);
        console.log(`│ 🛑 Finish: ${completion.choices[0]?.finish_reason}`);
        console.log('└─────────────────────────────────────────\n');

        return {
          success: true,
          output,
          durationMs,
        };
      } catch (err: unknown) {
        const durationMs: number = Date.now() - start;
        const errorMessage: string = generateErrorMessage(err);

        console.log(`\n❌ Error Details: ${err instanceof Error ? err.stack : String(err)}`);
        console.log(`│ ❌ Error: ${errorMessage}`);
        console.log('└─────────────────────────────────────────\n');

        return {
          success: false,
          error: errorMessage,
          durationMs,
        };
      }
    },
  };
}
