/**
 * File Writer
 * Parses LLM output for fenced code blocks with file paths,
 * extracts the code, and writes files to the target project.
 *
 * Expected LLM output format:
 *   ```typescript:src/health.ts
 *   export function health() { ... }
 *   ```
 *
 * Also supports:
 *   <!-- file: src/health.ts -->
 *   ```typescript
 *   export function health() { ... }
 *   ```
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';

export interface FileChange {
  filePath: string;
  content: string;
  language?: string;
}

export interface WriteResult {
  filesWritten: FileChange[];
  errors: string[];
}

/**
 * Parse LLM output and extract file changes.
 *
 * Supports formats:
 *  1. ```language:path/to/file.ts  (colon-delimited in the fence)
 *  2. ````language:path/to/file.ts (4+ backtick fences for files with nested code blocks)
 *  3. <!-- file: path/to/file.ts --> before a regular code block
 *
 * Handles nested fences: if the opening fence has N backticks,
 * only a closing fence with >= N backticks terminates it.
 */
export function parseCodeBlocks(llmOutput: string): FileChange[] {
  const changes: FileChange[] = [];
  const lines = llmOutput.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Check for <!-- file: path --> comment pattern
    const commentMatch = line.match(/^<!--\s*file:\s*([^\s>]+)\s*-->\s*$/);
    if (commentMatch && i + 1 < lines.length) {
      const filePath = commentMatch[1].trim();
      const nextLine = lines[i + 1];
      const fenceMatch = nextLine.match(/^(`{3,})(\w*)\s*$/);
      if (fenceMatch) {
        const closingFence = fenceMatch[1]; // need at least this many backticks to close
        const language = fenceMatch[2] || undefined;
        const contentLines: string[] = [];
        let j = i + 2;
        while (j < lines.length) {
          if (lines[j].startsWith(closingFence) && lines[j].trim().length <= closingFence.length + 1) {
            break;
          }
          contentLines.push(lines[j]);
          j++;
        }
        if (!changes.some((c) => c.filePath === filePath)) {
          changes.push({
            filePath,
            content: contentLines.join('\n').trimEnd() + '\n',
            language,
          });
        }
        i = j + 1;
        continue;
      }
    }

    // Check for ```language:filepath or ````language:filepath (3+ backticks)
    const fenceOpenMatch = line.match(/^(`{3,})(\w+):([^\n]+)$/);
    if (fenceOpenMatch) {
      const backticks = fenceOpenMatch[1];     // the opening fence (3+ backticks)
      const language = fenceOpenMatch[2].trim();
      const filePath = fenceOpenMatch[3].trim();
      const contentLines: string[] = [];

      let j = i + 1;
      while (j < lines.length) {
        // Closing fence: same or more backticks, nothing else significant
        if (lines[j].startsWith(backticks) && lines[j].trim().length <= backticks.length + 1) {
          break;
        }
        contentLines.push(lines[j]);
        j++;
      }

      changes.push({
        filePath,
        content: contentLines.join('\n').trimEnd() + '\n',
        language,
      });

      i = j + 1;
      continue;
    }

    i++;
  }

  return changes;
}

/**
 * Utility function to create directories and write files.
 * Ensures directories are created before writing a file.
 */
export async function writeToFile(
  fullPath: string,
  content: string
): Promise<void> {
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content, 'utf-8');
}

/**
 * Write extracted file changes to the target project directory.
 * Creates directories as needed. Returns a summary of what was written.
 */
export async function writeFiles(
  changes: FileChange[],
  targetDir: string
): Promise<WriteResult> {
  const result: WriteResult = { filesWritten: [], errors: [] };

  for (const change of changes) {
    try {
      const fullPath = resolve(targetDir, change.filePath);

      // Safety: don't write outside the target dir
      if (!fullPath.startsWith(resolve(targetDir))) {
        result.errors.push(`Skipped ${change.filePath}: path escapes target directory`);
        continue;
      }

      await writeToFile(fullPath, change.content);
      result.filesWritten.push(change);

      console.log(`  📝 Wrote: ${change.filePath}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Failed to write ${change.filePath}: ${msg}`);
    }
  }

  return result;
}

/**
 * Read a file from the target project. Used to provide current file contents
 * as context to the LLM.
 */
export async function readProjectFile(
  filePath: string,
  targetDir: string
): Promise<string | null> {
  try {
    const fullPath = resolve(targetDir, filePath);
    return await readFile(fullPath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Build a context string from multiple project files.
 */
export async function buildFileContext(
  filePaths: string[],
  targetDir: string
): Promise<string> {
  const sections: string[] = [];

  for (const fp of filePaths) {
    const content = await readProjectFile(fp, targetDir);
    if (content) {
      sections.push(`--- ${fp} ---\n${content}`);
    }
  }

  return sections.join('\n\n');
}
