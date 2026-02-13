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
        const error = err instanceof Error ? err.message : String(err);
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

