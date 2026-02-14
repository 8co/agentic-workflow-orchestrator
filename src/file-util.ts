import { ensureDirectoryAndWriteFile, readFromFile } from './file-helper.js';

export { readFromFile };

export async function writeToFile(
  fullPath: string,
  content: string
): Promise<void> {
  try {
    await ensureDirectoryAndWriteFile(fullPath, content);
  } catch (error) {
    if (error instanceof Error) {
      const errorCode = (error as NodeJS.ErrnoException).code;
      const errorMessage = `Failed to write to file: ${fullPath}. Error code: ${errorCode}. Error message: ${error.message}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    } else {
      throw new Error('An unknown error occurred while writing to file.');
    }
  }
}

export async function safeReadFromFile(
  fullPath: string
): Promise<string | null> {
  try {
    return await readFromFile(fullPath);
  } catch (error) {
    if (error instanceof Error) {
      const errorCode = (error as NodeJS.ErrnoException).code;
      const errorMessage = `Failed to read from file: ${fullPath}. Error code: ${errorCode}. Error message: ${error.message}`;
      console.error(errorMessage);
      return null;
    } else {
      throw new Error('An unknown error occurred while reading from file.');
    }
  }
}
