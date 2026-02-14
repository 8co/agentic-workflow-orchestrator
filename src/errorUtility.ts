import { writeFile } from 'node:fs/promises';
import { format } from 'node:util';

interface ErrorDetails {
  message: string;
  stack?: string;
  timestamp: string;
  [key: string]: unknown;
}

export function formatErrorMessage(
  error: unknown,
  userFriendlyMessage: string = 'An unexpected error occurred.'
): string {
  if (error instanceof Error) {
    return `${userFriendlyMessage}\nError Details: ${error.message}`;
  }
  return userFriendlyMessage;
}

export function logErrorDetails(
  error: unknown,
  additionalData: Record<string, unknown> = {}
): ErrorDetails {
  const errorDetails: ErrorDetails = {
    timestamp: new Date().toISOString(),
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    ...additionalData,
  };

  const logMessage = format(
    'Error logged at %s\nMessage: %s\nStack: %s\nAdditional Data: %j\n',
    errorDetails.timestamp,
    errorDetails.message,
    errorDetails.stack || 'No stack trace available',
    additionalData
  );

  console.error(logMessage); // For debugging purposes, we also print the error to the console.
  writeErrorToFile(logMessage);
  return errorDetails;
}

async function writeErrorToFile(logMessage: string): Promise<void> {
  try {
    await writeFile('error.log', logMessage, { flag: 'a', encoding: 'utf-8' });
  } catch (fileError) {
    console.error(`Failed to write error log to file: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
  }
}
