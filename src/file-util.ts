import { ensureDirectoryAndWriteFile, readFromFile } from './file-helper.js';

export { readFromFile };

export async function writeToFile(
  fullPath: string,
  content: string
): Promise<void> {
  await ensureDirectoryAndWriteFile(fullPath, content);
}
