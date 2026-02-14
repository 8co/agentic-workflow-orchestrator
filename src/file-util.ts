import { ensureDirectoryAndWriteFile, readFromFile } from './utils.js';

export { readFromFile };

export async function writeToFile(
  fullPath: string,
  content: string
): Promise<void> {
  await ensureDirectoryAndWriteFile(fullPath, content);
}
