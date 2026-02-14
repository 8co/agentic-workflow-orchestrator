import { test } from 'node:test';
import assert from 'node:assert';
import { connectToAIAgents, formatError, formatErrorWithDetails, handleConnectionError, getNetworkDetails } from './aiAgents.js';
import { createConnection, Socket } from 'node:net';
import { accessSync } from 'node:fs';

test('connectToAIAgents should connect successfully', (t) => {
  const originalCreateConnection = createConnection;
  const originalAccessSync = accessSync;
  try {
    let connected = false;
    
    (globalThis as any).createConnection = (opts: any, callback: any) => {
      connected = true;
      const socket: Socket = new Socket();
      process.nextTick(callback);
      return socket;
    };

    (globalThis as any).accessSync = (path: string, mode: number) => {
      // Simulate permission is granted, do nothing
    };

    connectToAIAgents();

    assert.strictEqual(connected, true, 'The connection should be successfully established');
  } finally {
    (globalThis as any).createConnection = originalCreateConnection;
    (globalThis as any).accessSync = originalAccessSync;
  }
});

test('connectToAIAgents should handle network permission error', (t) => {
  const originalAccessSync = accessSync;
  try {
    (globalThis as any).accessSync = (path: string, mode: number) => {
      throw new Error('Permission denied');
    };

    assert.throws(() => {
      connectToAIAgents();
    }, /Network permission error: Permission denied/);
  } finally {
    (globalThis as any).accessSync = originalAccessSync;
  }
});

test('formatError should format string errors correctly', (t) => {
  const errorString = 'This is a string error';
  const formattedError = formatError(errorString);

  assert.strictEqual(formattedError?.message, errorString, 'The formatted message should match the input string');
});

test('formatErrorWithDetails should add details to error message', (t) => {
  const error = new Error('Original error message');
  const host = '123.45.67.89';
  const port = 8080;

  const detailedError = formatErrorWithDetails(error, host, port);

  assert.match(detailedError.message, /Host: 123.45.67.89, Port: 8080, Error: Original error message/, 
    'The formatted error message should contain host, port, and original error message');
});

test('getNetworkDetails should return network details', (t) => {
  const networkDetails = getNetworkDetails();

  assert.strictEqual(typeof networkDetails, 'object', 'Network details should be an object');
});
