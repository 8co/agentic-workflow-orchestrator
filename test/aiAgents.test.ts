import { connectToAIAgents, formatError, formatErrorWithDetails, handleConnectionError } from '../src/aiAgents.js';
import assert from 'node:assert';
import { spawn } from 'child_process';
import { createServer } from 'net';

// Helper to capture console outputs
function captureConsoleOutput(action: () => void): string[] {
  const output: string[] = [];
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  console.log = (...args: unknown[]) => output.push(`LOG: ${args.join(' ')}`);
  console.error = (...args: unknown[]) => output.push(`ERROR: ${args.join(' ')}`);

  try {
    action();
  } finally {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  }

  return output;
}

// Test to check network permission error handling
{
  const output = captureConsoleOutput(() => {
    try {
      connectToAIAgents();
    } catch (e) {
      // Expected to throw due to permission error
    }
  });

  const hasPermissionError = output.some(line =>
    line.includes('Permission error')
  );

  assert(hasPermissionError, 'Expected permission error to be logged');
}

// Test to check socket errors are handled and logged
{
  const output = captureConsoleOutput(() => {
    // Simulating a server to force connection error
    const server = createServer((socket) => {
      socket.destroy(new Error('Simulated socket error'));
    });

    server.listen(443, '127.0.0.1', () => {
      try {
        connectToAIAgents();
      } catch (e) {
        // Expected to handle connection error
      } finally {
        server.close();
      }
    });
  });

  const hasSocketError = output.some(line =>
    line.includes('Error connecting to AI agent APIs:')
  );

  assert(hasSocketError, 'Expected socket error to be logged');
}

// Test formatError function
{
  const error = new Error('Test message');
  const formattedError = formatError(error);
  assert.strictEqual(formattedError?.message, 'Test message', 'Expected correct error message');

  const stringError = formatError('string error');
  assert.strictEqual(stringError?.message, 'string error', 'Expected string error to be converted to Error');

  const objectError = formatError({ message: 'object error' });
  assert.strictEqual(objectError?.message, 'object error', 'Expected object error to be converted to Error');

  const nullError = formatError(null);
  assert.strictEqual(nullError, null, 'Expected null to return null');
}

// Test formatErrorWithDetails function
{
  const error = new Error('Test message');
  const detailedError = formatErrorWithDetails(error, 'host.example.com', 1234);
  assert.strictEqual(detailedError.message, 'Host: host.example.com, Port: 1234, Error: Test message', 'Expected detailed error message');
}

// Test handleConnectionError function
{
  const output = captureConsoleOutput(() => {
    const error = new Error('Connection failure');
    handleConnectionError(error);
  });

  const hasHandledErrorLog = output.some(line =>
    line.includes('Error connecting to AI agent APIs: Connection failure')
  );

  assert(hasHandledErrorLog, 'Expected connection error to be logged');
}
