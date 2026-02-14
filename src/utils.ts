import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ERROR_MESSAGES } from './constants.js';

export async function ensureDirectoryAndWriteFile(
  fullPath: string,
  content: string
): Promise<void> {
  try {
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, 'utf-8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(ERROR_MESSAGES.WRITE_FILE_FAILURE(fullPath, errorMessage));
  }
}

export async function readFromFile(
  fullPath: string
): Promise<string> {
  try {
    return await readFile(fullPath, 'utf-8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(ERROR_MESSAGES.READ_FILE_FAILURE(fullPath, errorMessage));
  }
}
