export async function retryAsync<T>(
  operation: () => Promise<T>,
  retries: number,
  delayMs: number
): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === retries - 1) {
        throw new Error(`Operation failed after ${retries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      attempt++;
      await delay(delayMs);
    }
  }
  throw new Error(`Unhandled retry failure after ${retries} attempts`);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
