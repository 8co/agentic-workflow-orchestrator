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

export function createOpenAIAdapter(config: OpenAIConfig, adapterName: 'openai' | 'codex' = 'openai'): AgentAdapter {
  const client = new OpenAI({ apiKey: config.apiKey });

  return {
    name: adapterName,

    async execute(request: AgentRequest): Promise<AgentResponse> {
      const start = Date.now();

      try {
        console.log('\n┌─────────────────────────────────────────');
        console.log(`│ 🤖 OpenAI (${config.model}) — Executing`);
        console.log('├─────────────────────────────────────────');

        const systemContent = request.context
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

        if (!completion || !Array.isArray(completion.choices) || completion.choices.length === 0 || !completion.choices[0]?.message?.content) {
          throw new Error('Malformed response from OpenAI service');
        }

        const output = completion.choices[0].message.content;
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
        console.log(`│ 📊 Tokens: ${completion.usage?.prompt_tokens ?? '?'} in / ${completion.usage?.completion_tokens ?? '?'} out`);
        console.log(`│ 🛑 Finish: ${completion.choices[0]?.finish_reason}`);
        console.log('└─────────────────────────────────────────\n');

        return {
          success: true,
          output,
          durationMs,
        };
      } catch (err) {
        const durationMs = Date.now() - start;
        let errorMessage: string;

        if (err instanceof Error) {
          if (err.message.includes('Network Error')) {
            errorMessage = 'Network error occurred. Please check your connection and try again.';
          } else if (err.message.includes('timeout')) {
            errorMessage = 'Request timed out. Please try again later.';
          } else if (err.message.includes('401')) {
            errorMessage = 'Unauthorized: Invalid API key or permissions issue.';
          } else if (err.message.includes('500')) {
            errorMessage = 'Internal server error. Try again after some time.';
          } else if (err.message.includes('429')) {
            errorMessage = 'Too many requests: You have hit the rate limit. Try again later.';
          } else if (err.message.includes('503')) {
            errorMessage = 'Service unavailable: OpenAI temporarily unavailable. Try again after some time.';
          } else if (err.message.includes('Malformed response')) {
            errorMessage = 'Received a malformed response from OpenAI. Please try again later.';
          } else {
            errorMessage = 'An unexpected error occurred. Please try again later.';
          }
        } else {
          errorMessage = 'An unknown error occurred.';
        }

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
