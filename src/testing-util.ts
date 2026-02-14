import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';

interface FileMock {
  path: string;
  content: string;
}

export async function mockFileWrites(fileMocks: FileMock[]): Promise<void> {
  for (const { path, content } of fileMocks) {
    await fs.mkdir(dirname(path), { recursive: true });
    await fs.writeFile(path, content, 'utf-8');
  }
}

export async function cleanupFiles(filePaths: string[]): Promise<void> {
  for (const path of filePaths) {
    try {
      await fs.unlink(path);
    } catch (error) {
      throw new Error(`Failed to delete file ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export async function mockFileRead(path: string, content: string): Promise<void> {
  await fs.writeFile(path, content, 'utf-8');
}

export async function readMockedFile(path: string): Promise<string> {
  try {
    return await fs.readFile(path, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read mocked file ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
