import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { Console } from 'node:console';

interface FileMock {
  path: string;
  content: string;
}

const logger = new Console(process.stdout, process.stderr);

export async function setupMockFiles(fileMocks: FileMock[]): Promise<void> {
  for (const { path, content } of fileMocks) {
    try {
      await fs.mkdir(dirname(path), { recursive: true });
      await fs.writeFile(path, content, 'utf-8');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to setup mock file ${path}: ${errorMessage}`);
      throw new Error(`Failed to setup mock file ${path}: ${errorMessage}`);
    }
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function teardownFiles(filePaths: string[]): Promise<void> {
  for (const path of filePaths) {
    try {
      if (await fileExists(path)) {
        await fs.unlink(path);
      } else {
        logger.warn(`File ${path} does not exist, skipping teardown.`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to teardown file ${path}: ${errorMessage}`);
      throw new Error(`Failed to teardown file ${path}: ${errorMessage}`);
    }
  }
}

export async function mockEnvironment(path: string, content: string): Promise<void> {
  try {
    await fs.writeFile(path, content, 'utf-8');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to mock environment file ${path}: ${errorMessage}`);
    throw new Error(`Failed to mock environment file ${path}: ${errorMessage}`);
  }
}

export async function readEnvironment(path: string): Promise<string> {
  try {
    return await fs.readFile(path, 'utf-8');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to read environment file ${path}: ${errorMessage}`);
    throw new Error(`Failed to read environment file ${path}: ${errorMessage}`);
  }
}
