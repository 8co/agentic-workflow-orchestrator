import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createConnection, Socket } from 'net';
import { connectToAIAgents, formatError, formatErrorWithDetails, handleConnectionError } from '../src/aiAgents.js';
import { captureConsoleLogs } from './testUtils.js';

test('connectToAIAgents - should handle successful connection', () => {
  const logs = captureConsoleLogs(() => {
    connectToAIAgents();
  });

  assert(logs.some((log) => log.includes('Successfully connected to AI agent APIs.')));
});

test('connectToAIAgents - should handle connection error', () => {
  const originalCreateConnection = createConnection;
  const errorMsg = 'Simulated failure for testing';

  // Simulate error in connection
  (createConnection as unknown) = () => {
    const sock = new Socket();
    process.nextTick(() => sock.emit('error', new Error(errorMsg)));
    return sock;
  };

  const logs = captureConsoleLogs(() => {
    connectToAIAgents();
  });

  assert(logs.some((log) => log.includes('Error connecting to AI agent APIs:')));
  assert(logs.some((log) => log.includes(errorMsg)));

  // Restore the original createConnection
  createConnection = originalCreateConnection;
});

test('connectToAIAgents - should handle connection timeout', () => {
  const originalCreateConnection = createConnection;

  // Simulate a timeout
  (createConnection as unknown) = () => {
    const sock = new Socket();
    process.nextTick(() => sock.emit('timeout'));
    return sock;
  };

  const logs = captureConsoleLogs(() => {
    connectToAIAgents();
  });

  assert(logs.some((log) => log.includes('Connection timed out')));

  // Restore the original createConnection
  createConnection = originalCreateConnection;
});

test('formatError - handle different types of error inputs', () => {
  assert(formatError('error message') instanceof Error);
  assert(formatError(new Error('error message')) instanceof Error);
  assert(formatError({ message: 'error message' }) instanceof Error);
});

test('formatErrorWithDetails - attaches host and port details', () => {
  const error = new Error('Some error');
  const detailedError = formatErrorWithDetails(error, 'localhost', 8080);

  assert(detailedError.message.includes('Host: localhost, Port: 8080, Error: Some error'));
});

test('handleConnectionError - logs error details', () => {
  const logs = captureConsoleLogs(() => {
    handleConnectionError(new Error('Connection aborted'));
  });

  assert(logs.some((log) => log.includes('Error connecting to AI agent APIs: Connection aborted')));
});
