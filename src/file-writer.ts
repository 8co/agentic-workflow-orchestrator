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
 * Supports two formats:
 *  1. ```language:path/to/file.ts  (colon-delimited in the fence)
 *  2. <!-- file: path/to/file.ts --> before a regular code block
 */
export function parseCodeBlocks(llmOutput: string): FileChange[] {
  const changes: FileChange[] = [];

  // Pattern 1: ```language:filepath
  const colonPattern = /```(\w+):([^\n]+)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = colonPattern.exec(llmOutput)) !== null) {
    const language = match[1].trim();
    const filePath = match[2].trim();
    const content = match[3];

    changes.push({ filePath, content: content.trimEnd() + '\n', language });
  }

  // Pattern 2: <!-- file: filepath --> followed by ```language
  const commentPattern = /<!--\s*file:\s*([^\s>]+)\s*-->\s*\n```(\w*)\n([\s\S]*?)```/g;

  while ((match = commentPattern.exec(llmOutput)) !== null) {
    const filePath = match[1].trim();
    const language = match[2].trim() || undefined;
    const content = match[3];

    // Avoid duplicates if same path was caught by pattern 1
    if (!changes.some((c) => c.filePath === filePath)) {
      changes.push({ filePath, content: content.trimEnd() + '\n', language });
    }
  }

  return changes;
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

      await mkdir(dirname(fullPath), { recursive: true });
      await writeFile(fullPath, change.content, 'utf-8');
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

