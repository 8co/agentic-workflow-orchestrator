import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

interface FileSystemMock {
  [path: string]: string;
}

const fileSystem: FileSystemMock = {};

/**
 * Mocks ensuring the directory for the given file path exists.
 *
 * @param fullPath - The full file path to ensure the directory exists.
 */
export async function mockEnsureDirectory(fullPath: string): Promise<void> {
  const dirName = dirname(fullPath);
  if (!fileSystem[dirName]) {
    fileSystem[dirName] = '';
  }
}

/**
 * Mocks writing content to a file at the specified path.
 *
 * @param fullPath - The full file path where the content should be written.
 * @param content - The content to write to the specified file.
 */
export async function mockWriteFile(fullPath: string, content: string): Promise<void> {
  await mockEnsureDirectory(fullPath);
  fileSystem[fullPath] = content;
}

/**
 * Mocks reading the content of a file from the specified path.
 *
 * @param filePath - The path of the file to read.
 * @returns The content of the file as a string, or null if the file cannot be read.
 */
export async function mockReadFile(filePath: string): Promise<string | null> {
  return fileSystem[filePath] || null;
}

/**
 * Resets the mock filesystem.
 */
export function resetMockFileSystem(): void {
  for (const path in fileSystem) {
    delete fileSystem[path];
  }
}
