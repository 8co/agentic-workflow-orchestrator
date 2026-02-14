import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function writeToFile(
  fullPath: string,
  content: string
): Promise<void> {
  try {
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write to file ${fullPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function readFromFile(
  fullPath: string
): Promise<string> {
  try {
    return await readFile(fullPath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read from file ${fullPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
