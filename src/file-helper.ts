import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { constants } from 'node:fs';

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
  if (typeof fullPath !== 'string' || typeof content !== 'string' || !fullPath || !content) {
    throw new Error('Invalid arguments: fullPath and content are required and must be strings.');
  }

  try {
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, { encoding: 'utf-8', flag: 'w' });
  } catch (error: unknown) {
    const detailedMessage = `Error in ensureDirectoryAndWriteFile for path ${fullPath}`;
    handleError(error, detailedMessage);
  }
}

/**
 * Reads the content of a file from the specified path.
 *
 * @param filePath - The path of the file to read.
 * @returns The content of the file as a string, or null if the file cannot be read.
 */
export async function readFromFile(filePath: string): Promise<string | null> {
  if (typeof filePath !== 'string' || !filePath) {
    throw new Error('Invalid argument: filePath is required and must be a string.');
  }

  try {
    return await readFile(filePath, 'utf-8');
  } catch (error: unknown) {
    const detailedMessage = `Error in readFromFile for path ${filePath}`;
    handleError(error, detailedMessage, true);
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
  if (typeof baseDir !== 'string' || typeof relativePath !== 'string' || !baseDir || !relativePath) {
    throw new Error('Invalid arguments: baseDir and relativePath are required and must be strings.');
  }

  return resolve(baseDir, relativePath);
}

/**
 * Handles the errors thrown by file operations, adds context and throws again if needed.
 *
 * @param error - The error object caught.
 * @param message - The custom message that offers more context about the error location.
 * @param suppressError - Determines if the error should be logged rather than thrown.
 */
function handleError(error: unknown, message: string, suppressError: boolean = false): void {
  let errorMessage: string = 'Unknown error';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    errorMessage = String((error as { message: unknown }).message);
  }

  const fullMessage = `${message}: ${errorMessage}`;
  
  if (suppressError) {
    console.error(fullMessage);
  } else {
    throw new Error(fullMessage);
  }
}
