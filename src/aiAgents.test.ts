import { strict as assert } from 'node:assert';
import test from 'node:test';
import { connectToAIAgents } from './aiAgents.js';

// Test Suite for aiAgents module
test('AI Agent connection - error handling', async (t) => {
  await t.test('should log an error on connection failure with known Error', () => {
    const originalConsoleError = console.error;
    let loggedMessage = '';

    console.error = (message: unknown) => {
      if (typeof message === 'string') {
        loggedMessage = message;
      }
    };

    // Test known Error handling
    try {
      connectToAIAgents();
    } catch (error) {
      assert.fail(`Execution should not reach here. Error: ${error}`);
    }

    assert.match(
      loggedMessage,
      /❌ Error connecting to AI agent APIs: Simulation of a connection error\./
    );

    console.error = originalConsoleError;
  });

  await t.test('should handle unknown error types gracefully', () => {
    const originalConsoleError = console.error;
    let loggedMessage = '';

    console.error = (message: unknown) => {
      if (typeof message === 'string') {
        loggedMessage = message;
      }
    };

    // Simulate the condition where an unknown error type is thrown
    const simulateUnknownErrorType = () => {
      throw 12345;
    };

    try {
      simulateUnknownErrorType();
    } catch (error: unknown) {
      const formattedError = formatError(error);
      handleConnectionError(formattedError || new Error('Unknown error type'));
    }

    assert.match(
      loggedMessage,
      /❌ An unknown error occurred while connecting to AI agent APIs./
    );

    console.error = originalConsoleError;
  });
});

function formatError(error: unknown): Error | null {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  return null;
}

function handleConnectionError(error: Error): void {
  const errorMessage = `❌ Error connecting to AI agent APIs: ${error.message}`;
  const errorStack = error.stack ? ` Stack trace: ${error.stack}` : '';
  console.error(`${errorMessage}\n${errorStack}`);
}
