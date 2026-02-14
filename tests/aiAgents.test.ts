import { test } from 'node:test';
import assert from 'node:assert';
import {
  connectToAIAgents,
  formatError,
  formatErrorWithDetails,
  handleConnectionError,
  getNetworkDetails
} from '../src/aiAgents.js';
import sinon from 'sinon';
import { createConnection, Socket } from 'net';
import { networkInterfaces } from 'os';

test('formatError - returns Error when given an Error object', () => {
  const error = new Error('Test error');
  const result = formatError(error);
  assert(result instanceof Error);
  assert.strictEqual(result.message, 'Test error');
});

test('formatError - returns Error when given a string', () => {
  const error = 'Test error';
  const result = formatError(error);
  assert(result instanceof Error);
  assert.strictEqual(result.message, 'Test error');
});

test('formatError - returns null for unknown types', () => {
  const result = formatError(42);
  assert.strictEqual(result, null);
});

test('formatErrorWithDetails - formats error message with host and port', () => {
  const error = new Error('Connection failed');
  const host = 'localhost';
  const port = 8080;
  const result = formatErrorWithDetails(error, host, port);
  assert(result instanceof Error);
  assert.strictEqual(result.message, 'Host: localhost, Port: 8080, Error: Connection failed');
});

test('handleConnectionError - logs error details', () => {
  const error = new Error('Connection failed');
  const consoleErrorStub = sinon.stub(console, 'error');

  handleConnectionError(error);
  
  const errorMessage = consoleErrorStub.firstCall.args[0];
  assert(errorMessage.includes('❌ Error connecting to AI agent APIs: Connection failed'));
  assert(errorMessage.includes('Network Details:'));

  consoleErrorStub.restore();
});

test('getNetworkDetails - returns non-internal IPv4 addresses', () => {
  const mockNetworkInterfaces = {
    lo: [
      { address: '127.0.0.1', family: 'IPv4', internal: true },
      { address: '::1', family: 'IPv6', internal: true }
    ],
    eth0: [
      { address: '192.168.1.100', family: 'IPv4', internal: false },
      { address: 'fe80::1c0:200:ff:fe34:1', family: 'IPv6', internal: false }
    ]
  };

  const networkInterfacesStub = sinon.stub(networkInterfaces, 'default').returns(mockNetworkInterfaces);
  const result = getNetworkDetails();

  assert.deepStrictEqual(result, { eth0: ['192.168.1.100'] });

  networkInterfacesStub.restore();
});

test('connectToAIAgents - successful connection logs success message', (done) => {
  const createConnectionStub = sinon.stub(createConnection);
  const mockSocket = Object.create(Socket.prototype);
  
  createConnectionStub.callsFake((options, connectionListener) => {
    assert.strictEqual(options.host, 'ai-agent-api.example.com');
    assert.strictEqual(options.port, 443);
    setImmediate(connectionListener);
    return mockSocket;
  });

  const consoleLogStub = sinon.stub(console, 'log');
  connectToAIAgents();

  process.nextTick(() => {
    assert(consoleLogStub.calledWith('🔗 Connecting to AI agent APIs...'));
    assert(consoleLogStub.calledWith('✅ Successfully connected to AI agent APIs.'));
    
    createConnectionStub.restore();
    consoleLogStub.restore();
    done();
  });
});

test('connectToAIAgents - connection error handled and logged', (done) => {
  const expectedError = new Error('Connection error');
  const createConnectionStub = sinon.stub(createConnection);
  const mockSocket = Object.create(Socket.prototype);

  createConnectionStub.callsFake((options) => {
    setImmediate(() => {
      mockSocket.emit('error', expectedError);
    });
    return mockSocket;
  });

  const handleConnectionErrorStub = sinon.stub({ handleConnectionError }).handleConnectionError;

  connectToAIAgents();

  process.nextTick(() => {
    assert(handleConnectionErrorStub.calledOnceWithExactly(expectedError));

    createConnectionStub.restore();
    handleConnectionErrorStub.restore();
    done();
  });
});
