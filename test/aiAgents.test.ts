import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectToAIAgents, formatError, formatErrorWithDetails, handleConnectionError, NetworkDetails, getNetworkDetails } from '../src/aiAgents.js';
import { networkInterfaces } from 'os';
import { accessSync } from 'fs';
import { createConnection } from 'net';

// Mock the necessary modules
test('connectToAIAgents - network permissions error', () => {
  const originalAccessSync = accessSync;
  accessSync = () => { throw new Error('Mock network permission error'); };

  const originalHandleConnectionError = handleConnectionError;
  let capturedError;
  handleConnectionError = (error: Error) => { capturedError = error; };

  try {
    connectToAIAgents();
  } catch (err) {
    assert.match(capturedError?.message, /Network permission error/);
  } finally {
    accessSync = originalAccessSync;
    handleConnectionError = originalHandleConnectionError;
  }
});

test('connectToAIAgents - connection error', () => {
  const originalCreateConnection = createConnection;
  createConnection = () => {
    const socket = {
      on: (event: string, callback: Function) => {
        if (event === 'error') {
          callback(new Error('Mock connection error'));
        }
      },
      destroy: () => {},
    } as any;
    return socket;
  };

  const originalHandleConnectionError = handleConnectionError;
  let capturedError;
  handleConnectionError = (error: Error) => { capturedError = error; };

  connectToAIAgents();

  assert.match(capturedError?.message, /Mock connection error/);

  createConnection = originalCreateConnection;
  handleConnectionError = originalHandleConnectionError;
});

test('formatError - different error types', () => {
  const error = new Error('Sample error');
  const formattedError = formatError(error);
  assert.equal(formattedError?.message, 'Sample error');

  const stringError = 'String error';
  const formattedStringError = formatError(stringError);
  assert.equal(formattedStringError?.message, 'String error');

  const objectError = { message: 'Object error' };
  const formattedObjectError = formatError(objectError);
  assert.equal(formattedObjectError?.message, 'Object error');

  const nullError = formatError(null);
  assert.equal(nullError, null);
});

test('formatErrorWithDetails', () => {
  const error = new Error('Test error');
  const detailedError = formatErrorWithDetails(error, 'example.com', 80);
  assert.equal(detailedError.message, 'Host: example.com, Port: 80, Error: Test error');
});

test('handleConnectionError', () => {
  let loggedMessage = '';
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    loggedMessage += args.join(' ');
  };

  handleConnectionError(new Error('Connection error test'));

  assert.match(loggedMessage, /Error connecting to AI agent APIs: Connection error test/);

  console.error = originalConsoleError;
});

test('getNetworkDetails', () => {
  const originalNetworkInterfaces = networkInterfaces;
  networkInterfaces = () => ({
    eth0: [{ family: 'IPv4', internal: false, address: '10.0.0.1' } as any],
  });

  const details: NetworkDetails = getNetworkDetails();
  assert.deepEqual(details, { eth0: ['10.0.0.1'] });

  networkInterfaces = originalNetworkInterfaces;
});
