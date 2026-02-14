/**
 * Cursor Agent Adapter
 * Executes prompts via Cursor's CLI/background agent mode
 *
 * Phase 1: Logs the resolved prompt to stdout and writes to output file.
 * This allows manual verification before wiring up actual Cursor API integration.
 * Future: Invoke Cursor headless or via its API to execute prompts autonomously.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { AgentAdapter, AgentRequest, AgentResponse } from '../types.js';

export function createCursorAdapter(): AgentAdapter {
  return {
    name: 'cursor',

    async execute(request: AgentRequest): Promise<AgentResponse> {
      const start = Date.now();

      try {
        console.log('\n┌─────────────────────────────────────────');
        console.log('│ 🤖 Cursor Agent — Executing Prompt');
        console.log('├─────────────────────────────────────────');
        console.log('│');

        // Log the prompt (truncated for readability)
        const lines = request.prompt.split('\n');
        const preview = lines.slice(0, 20).join('\n');
        console.log(preview.replace(/^/gm, '│  '));
        if (lines.length > 20) {
          console.log(`│  ... (${lines.length - 20} more lines)`);
        }

        console.log('│');

        // Write prompt to output path if specified
        if (request.outputPath) {
          await mkdir(dirname(request.outputPath), { recursive: true });
          await writeFile(request.outputPath, request.prompt, 'utf-8');
          console.log(`│ 📄 Output written to: ${request.outputPath}`);
        }

        const durationMs = Date.now() - start;

        console.log(`│ ⏱  Duration: ${durationMs}ms`);
        console.log('└─────────────────────────────────────────\n');

        return {
          success: true,
          output: request.outputPath ?? '[stdout]',
          durationMs,
        };
      } catch (err) {
        let errorMessage: string;
        if (err instanceof Error) {
          if ('code' in err) {
            switch ((err as NodeJS.ErrnoException).code) {
              case 'ENOENT':
                errorMessage = 'File path not found. Please ensure the directory exists.';
                break;
              case 'EACCES':
                errorMessage = 'Permission denied. Check your access rights to the output path.';
                break;
              default:
                errorMessage = `Unhandled error: ${err.message}`;
            }
          } else {
            errorMessage = err.message;
          }
        } else {
          errorMessage = String(err);
        }
        console.error(`Error executing Cursor Agent: ${errorMessage}`);
        return {
          success: false,
          error: errorMessage,
          durationMs: Date.now() - start,
        };
      }
    },
  };
}
