import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { Console } from 'node:console';

interface FileMock {
  path: string;
  content: string;
}

const logger = new Console(process.stdout, process.stderr);

export async function mockFileWrites(fileMocks: FileMock[]): Promise<void> {
  for (const { path, content } of fileMocks) {
    try {
      await fs.mkdir(dirname(path), { recursive: true });
      await fs.writeFile(path, content, 'utf-8');
    } catch (error) {
      logger.error(`Failed to write mock file ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error(`Failed to write mock file ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export async function cleanupFiles(filePaths: string[]): Promise<void> {
  for (const path of filePaths) {
    try {
      await fs.unlink(path);
    } catch (error) {
      logger.error(`Failed to delete file ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error(`Failed to delete file ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export async function mockFileRead(path: string, content: string): Promise<void> {
  try {
    await fs.writeFile(path, content, 'utf-8');
  } catch (error) {
    logger.error(`Failed to mock read file ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw new Error(`Failed to mock read file ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function readMockedFile(path: string): Promise<string> {
  try {
    return await fs.readFile(path, 'utf-8');
  } catch (error) {
    logger.error(`Failed to read mocked file ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw new Error(`Failed to read mocked file ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
