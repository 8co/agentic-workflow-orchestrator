import { test } from 'node:test';
import assert from 'node:assert';
import { networkInterfaces, NetworkInterfaceInfo } from 'os';
import { createConnection as originalCreateConnection, Socket, SocketConnectOpts } from 'net';
import { connectToAIAgents, formatError, formatErrorWithDetails, handleConnectionError, getNetworkDetails } from '../src/aiAgents.js';

test('Test formatError function with Error object', () => {
  const error = new Error('Test error');
  const formattedError = formatError(error);
  assert.strictEqual(formattedError, error);
});

test('Test formatError function with string', () => {
  const errorString = 'Error as string';
  const formattedError = formatError(errorString);
  assert.ok(formattedError instanceof Error);
  assert.strictEqual(formattedError?.message, errorString);
});

test('Test formatError function with unknown type', () => {
  const unknownInput = { key: 'value' };
  const formattedError = formatError(unknownInput);
  assert.strictEqual(formattedError, null);
});

test('Test formatErrorWithDetails function', () => {
  const error = new Error('Connection failed');
  const formattedError = formatErrorWithDetails(error, 'test-host.example.com', 1234);
  assert.strictEqual(formattedError.message, 'Host: test-host.example.com, Port: 1234, Error: Connection failed');
});

test('Test getNetworkDetails function', () => {
  const originalNetworkInterfaces = networkInterfaces;

  // Mock networkInterfaces function
  networkInterfaces = () => ({
    eth0: [
      { family: 'IPv4', address: '192.168.0.1', internal: false } as NetworkInterfaceInfo,
      { family: 'IPv6', address: '::1', internal: false } as NetworkInterfaceInfo,
    ],
    lo: [
      { family: 'IPv4', address: '127.0.0.1', internal: true } as NetworkInterfaceInfo,
    ],
  });

  const networkDetails = getNetworkDetails();
  assert.deepStrictEqual(networkDetails, { eth0: ['192.168.0.1'] });

  // Restore original function
  networkInterfaces = originalNetworkInterfaces;
});

test('Test handleConnectionError for console output', () => {
  const originalConsoleError = console.error;
  const error = new Error('Sample error');

  let consoleOutput = '';
  console.error = (message: string) => {
    consoleOutput = message;
  };

  handleConnectionError(error);

  assert.ok(consoleOutput.includes('❌ Error connecting to AI agent APIs: Sample error'));
  assert.ok(consoleOutput.includes('Network Details: '));

  console.error = originalConsoleError;
});

test('Test connectToAIAgents for error handling', async () => {
  const originalCreateConnection = originalCreateConnection;
  const originalConsoleError = console.error;

  // Mock createConnection to trigger error conditions
  (originalCreateConnection as unknown as typeof createConnection) = (options: SocketConnectOpts, connectionListener?: () => void) => {
    const socket = new (class extends Socket {
      constructor() {
        super();
        process.nextTick(() => this.emit('error', new Error('Mock connection error')));
      }
    })();
    return socket;
  };

  let consoleOutput = '';
  console.error = (message: string) => {
    consoleOutput = message;
  };

  connectToAIAgents();

  // Allow event loop to process the mocked error
  await new Promise((resolve) => setTimeout(resolve, 100));

  assert.ok(consoleOutput.includes('❌ Error connecting to AI agent APIs: Host: ai-agent-api.example.com, Port: 443, Error: Mock connection error'));

  // Restore original functions
  (originalCreateConnection as unknown as typeof createConnection) = originalCreateConnection;
  console.error = originalConsoleError;
});
