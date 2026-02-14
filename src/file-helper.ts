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
  validateStringInputs({ fullPath, content }, ['fullPath', 'content']);

  try {
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, { encoding: 'utf-8', flag: 'w' });
  } catch (error: unknown) {
    handleError(error, `Error in ensureDirectoryAndWriteFile for path ${fullPath}`);
  }
}

/**
 * Reads the content of a file from the specified path.
 *
 * @param filePath - The path of the file to read.
 * @returns The content of the file as a string, or null if the file cannot be read.
 */
export async function readFromFile(filePath: string): Promise<string | null> {
  validateStringInputs({ filePath }, ['filePath']);

  try {
    return await readFile(filePath, 'utf-8');
  } catch (error: unknown) {
    handleError(error, `Error in readFromFile for path ${filePath}`, true);
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
  validateStringInputs({ baseDir, relativePath }, ['baseDir', 'relativePath']);

  return resolve(baseDir, relativePath);
}

/**
 * Validates that the provided string values are not empty and throws an error if they are.
 *
 * @param inputs - An object containing input values to validate.
 * @param keys - The keys within the object to validate as non-empty strings.
 */
function validateStringInputs(inputs: Record<string, unknown>, keys: string[]): void {
  for (const key of keys) {
    const value = inputs[key];
    if (typeof value !== 'string' || !value) {
      throw new Error(`Invalid argument: ${key} is required and must be a string.`);
    }
  }
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
