import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

/**
 * Ensures the directory for the given file path exists, then writes the file with the specified content.
 *
 * @param fullPath - The full file path where the content should be written.
 * @param content - The content to write to the specified file.
 * @throws Will throw an error if the file cannot be written.
 */
export async function ensureDirectoryAndWriteFile(
  fullPath: string,
  content: string
): Promise<void> {
  if (!fullPath || !content) {
    throw new Error('Invalid arguments: fullPath and content are required.');
  }

  try {
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, 'utf-8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to write file ${fullPath}: ${errorMessage}`);
  }
}

/**
 * Reads the content of a file from the specified path.
 *
 * @param filePath - The path of the file to read.
 * @returns The content of the file as a string, or null if the file cannot be read.
 */
export async function readFromFile(filePath: string): Promise<string | null> {
  if (!filePath) {
    throw new Error('Invalid argument: filePath is required.');
  }

  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Resolves a file path to an absolute path.
 *
 * @param baseDir - The base directory from which the file path should be resolved.
 * @param relativePath - The relative file path to resolve.
 * @returns The resolved absolute file path.
 */
export function resolveFilePath(baseDir: string, relativePath: string): string {
  if (!baseDir || !relativePath) {
    throw new Error('Invalid arguments: baseDir and relativePath are required.');
  }

  return resolve(baseDir, relativePath);
}
