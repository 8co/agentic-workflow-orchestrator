import { test } from 'node:test';
import assert from 'node:assert';
import { connectToAIAgents, formatError, formatErrorWithDetails, getNetworkDetails } from '../src/aiAgents.js';
import { networkInterfaces } from 'os';
import { Socket } from 'net';

test('connectToAIAgents - successful connection', () => {
  // Mock Socket implementation for testing
  class MockSocket extends Socket {
    connect() {
      setImmediate(() => {
        this.emit('connect');
      });
      return this;
    }
  }

  const originalCreateConnection = Socket.connect;
  Socket.connect = (options, callback) => {
    const socket = new MockSocket();
    if (callback) {
      socket.on('connect', callback);
    }
    return socket;
  };

  // Mock console.log to capture the output
  const originalConsoleLog = console.log;
  let consoleOutput = '';
  console.log = (message: string) => {
    consoleOutput += message + '\n';
  };

  connectToAIAgents();

  assert.match(consoleOutput, /🔗 Connecting to AI agent APIs.../);
  assert.match(consoleOutput, /✅ Successfully connected to AI agent APIs./);

  // Restore original implementations
  console.log = originalConsoleLog;
  Socket.connect = originalCreateConnection;
});

test('connectToAIAgents - handles error and timeout', () => {
  // Mock Socket implementation for testing
  class MockSocket extends Socket {
    connect() {
      setImmediate(() => {
        this.emit('error', new Error('Test error'));
      });
      return this;
    }

    setTimeout() {
      setImmediate(() => {
        this.emit('timeout');
      });
    }
  }

  const originalCreateConnection = Socket.connect;
  Socket.connect = (options, callback) => {
    const socket = new MockSocket();
    return socket;
  };

  // Mock console.error to capture the output
  const originalConsoleError = console.error;
  let consoleOutput = '';
  console.error = (message: string) => {
    consoleOutput += message + '\n';
  };

  connectToAIAgents();

  assert.match(consoleOutput, /❌ Error connecting to AI agent APIs: Host: ai-agent-api.example.com, Port: 443, Error: Test error/);

  // Restore original implementations
  console.error = originalConsoleError;
  Socket.connect = originalCreateConnection;
});

test('formatError - converts unknown types to Error', () => {
  const errorString = 'Sample error string';
  const formattedError = formatError(errorString);
  assert.strictEqual(formattedError?.message, errorString);

  const errorInstance = new Error('Sample error instance');
  const formattedErrorInstance = formatError(errorInstance);
  assert.deepStrictEqual(formattedErrorInstance, errorInstance);

  const nonErrorType = 123;
  const formattedNonError = formatError(nonErrorType);
  assert.strictEqual(formattedNonError, null);
});

test('formatErrorWithDetails - formats error with host and port details', () => {
  const error = new Error('Test error');
  const host = 'test-host';
  const port = 1234;
  const formattedError = formatErrorWithDetails(error, host, port);

  assert.match(formattedError.message, new RegExp(`Host: ${host}, Port: ${port}, Error: ${error.message}`));
});

test('getNetworkDetails - returns valid network details', () => {
  const mockNetworkInterfaces = {
    eth0: [{ address: '192.168.0.1', family: 'IPv4', internal: false }, { address: 'fe80::1', family: 'IPv6', internal: false }],
    lo: [{ address: '127.0.0.1', family: 'IPv4', internal: true }]
  };

  const originalNetworkInterfaces = networkInterfaces;
  networkInterfaces = () => mockNetworkInterfaces;

  const networkDetails = getNetworkDetails();
  assert.deepStrictEqual(networkDetails, { eth0: ['192.168.0.1'] });

  // Restore original implementation
  networkInterfaces = originalNetworkInterfaces;
});
