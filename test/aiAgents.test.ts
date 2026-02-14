import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { connectToAIAgents, formatError, formatErrorWithDetails, handleConnectionError, getNetworkDetails } from '../src/aiAgents.js';
import { createConnection } from 'node:net';
import { networkInterfaces } from 'node:os';

// Mocking createConnection to test connectToAIAgents function
test('connectToAIAgents - successful connection', () => {
  let successMessage = '';
  console.log = (message) => { 
    successMessage = message;
  };

  const originalCreateConnection = createConnection;
  createConnection = ({}, connectListener) => {
    connectListener();
    return {
      on: () => {},
      end: () => {}
    } as any;
  };

  connectToAIAgents();

  assert.equal(successMessage, '✅ Successfully connected to AI agent APIs.');

  createConnection = originalCreateConnection;
});

test('connectToAIAgents - connection error', () => {
  let errorMessage = '';
  console.error = (message) => { 
    errorMessage = message;
  };

  const originalCreateConnection = createConnection;
  createConnection = () => {
    return {
      on: (event: string, callback: (error: Error) => void) => {
        if (event === 'error') {
          callback(new Error('Test connection error'));
        }
      }
    } as any;
  };

  connectToAIAgents();

  assert.match(errorMessage, /Error connecting to AI agent APIs: Host: ai-agent-api.example.com, Port: 443, Error: Test connection error/);

  createConnection = originalCreateConnection;
});

test('formatError - formats Error object', () => {
  const error = new Error('Test error');
  const result = formatError(error);
  assert.equal(result?.message, 'Test error');
});

test('formatError - formats string error', () => {
  const result = formatError('Test string error');
  assert.equal(result?.message, 'Test string error');
});

test('formatError - non-error input', () => {
  const result = formatError(42);
  assert.equal(result, null);
});

test('formatErrorWithDetails - formats error with host and port', () => {
  const error = new Error('Test detailed error');
  const result = formatErrorWithDetails(error, 'test-host', 8080);
  assert.equal(result.message, 'Host: test-host, Port: 8080, Error: Test detailed error');
});

test('handleConnectionError - includes error and network details', () => {
  const error = new Error('Test error');
  let errorMessage = '';
  
  console.error = (message) => { 
    errorMessage = message;
  };
  
  handleConnectionError(error);

  assert.match(errorMessage, /Error connecting to AI agent APIs: Test error/);
  assert.match(errorMessage, /Network Details:/);
});

test('getNetworkDetails - retrieves network details', () => {
  const originalNetworkInterfaces = networkInterfaces;
  networkInterfaces = () => {
    return {
      eth0: [
        { address: '192.168.1.1', family: 'IPv4', internal: false }
      ],
      lo: [
        { address: '127.0.0.1', family: 'IPv4', internal: true }
      ]
    } as any;
  };

  const result = getNetworkDetails();
  assert.deepEqual(result, { eth0: ['192.168.1.1'] });

  networkInterfaces = originalNetworkInterfaces;
});
