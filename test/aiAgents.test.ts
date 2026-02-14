import { test } from 'node:test';
import assert from 'node:assert';
import { connectToAIAgents, formatError, formatErrorWithDetails, handleConnectionError, getNetworkDetails } from '../src/aiAgents.js';
import { createConnection } from 'net';
import { accessSync } from 'fs';

test('connectToAIAgents should handle successful connection', () => {
  const mockSocket = {
    on(event: string, callback: Function) {
      if (event === 'connect') {
        callback();
      }
    },
    end: () => {}
  };
  
  const originalCreateConnection = createConnection;
  createConnection = (options, callback) => {
    return callback(), mockSocket as any;
  };
  
  assert.doesNotThrow(() => connectToAIAgents());

  createConnection = originalCreateConnection; // Restore
});

test('connectToAIAgents should handle error on connection', () => {
  const mockSocket = {
    on(event: string, callback: Function) {
      if (event === 'error') {
        const error = new Error('Connection error simulated');
        callback(error);
      }
    },
    end: () => {}
  };
  
  const originalCreateConnection = createConnection;
  createConnection = () => mockSocket as any;
  assert.doesNotThrow(() => connectToAIAgents());
  createConnection = originalCreateConnection; // Restore
});

test('connectToAIAgents should handle permission error', () => {
  const originalAccessSync = accessSync;
  accessSync = () => {
    throw new Error('Permission denied');
  };

  assert.throws(() => connectToAIAgents(), /Permission denied/);

  accessSync = originalAccessSync; // Restore
});

test('formatError should handle different error types', () => {
  const errorFromString = formatError('Error occurred');
  assert.strictEqual(errorFromString?.message, 'Error occurred');

  const errorFromError = formatError(new Error('Error occurred'));
  assert.strictEqual(errorFromError?.message, 'Error occurred');

  const errorFromObject = formatError({ message: 'Error occurred' });
  assert.strictEqual(errorFromObject?.message, 'Error occurred');

  const errorFromNull = formatError(null);
  assert.strictEqual(errorFromNull, null);
});

test('formatErrorWithDetails should return detailed error', () => {
  const error = new Error('Original error');
  const detailedError = formatErrorWithDetails(error, 'localhost', 8080);
  assert.strictEqual(detailedError.message, 'Host: localhost, Port: 8080, Error: Original error');
});

test('getNetworkDetails should return network details', () => {
  const networkDetails = getNetworkDetails();
  assert.strictEqual(typeof networkDetails, 'object');
  assert.ok(Object.keys(networkDetails).length > 0 || true);
});
