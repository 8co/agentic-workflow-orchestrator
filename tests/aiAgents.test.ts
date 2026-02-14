import { test } from 'node:test';
import assert from 'node:assert';
import { createConnection, Socket } from 'net';
import * as aiAgents from '../src/aiAgents.js';
import sinon from 'sinon';

// Mock dependencies
sinon.stub(console, 'log');
const networkInterfacesStub = sinon.stub(require('os'), 'networkInterfaces');

networkInterfacesStub.returns({
  eth0: [
    { address: '192.168.0.1', family: 'IPv4', internal: false },
    { address: '10.0.0.1', family: 'IPv4', internal: false }
  ]
});

// Test connectToAIAgents
test('Test connectToAIAgents success', () => {
  const createConnectionStub = sinon.stub(createConnection, 'createConnection');
  
  const socketMock = { 
    end: sinon.stub(), 
    on: sinon.stub().callsFake((event, callback) => {
      if (event === 'connect') {
        callback();
      }
    })
  };
  
  createConnectionStub.returns(socketMock as unknown as Socket);
  
  aiAgents.connectToAIAgents();
  
  assert.strictEqual(createConnectionStub.calledOnce, true);
  assert.strictEqual(socketMock.end.calledOnce, true);

  createConnectionStub.restore();
});

test('Test connectToAIAgents error', () => {
  const createConnectionStub = sinon.stub(createConnection, 'createConnection');

  const error = new Error('Test connection error');
  
  const socketMock = { 
    end: sinon.stub(), 
    on: sinon.stub().callsFake((event, callback) => {
      if (event === 'error') {
        callback(error);
      }
    })
  };
  
  createConnectionStub.returns(socketMock as unknown as Socket);
  
  aiAgents.connectToAIAgents();
  
  assert.strictEqual(createConnectionStub.calledOnce, true);
  assert.strictEqual(socketMock.end.notCalled, true);

  createConnectionStub.restore();
});

test('Test connectToAIAgents timeout', () => {
  const createConnectionStub = sinon.stub(createConnection, 'createConnection');

  const socketMock = { 
    end: sinon.stub(), 
    on: sinon.stub().callsFake((event, callback) => {
      if (event === 'timeout') {
        callback();
      }
    })
  };

  createConnectionStub.returns(socketMock as unknown as Socket);

  aiAgents.connectToAIAgents();

  assert.strictEqual(createConnectionStub.calledOnce, true);
  assert.strictEqual(socketMock.end.calledOnce, true);

  createConnectionStub.restore();
});

test('Test connectToAIAgents close', () => {
  const createConnectionStub = sinon.stub(createConnection, 'createConnection');

  const socketMock = { 
    end: sinon.stub(), 
    on: sinon.stub().callsFake((event, callback) => {
      if (event === 'close') {
        callback(false);  // False indicates no error on close
      }
    })
  };

  createConnectionStub.returns(socketMock as unknown as Socket);

  aiAgents.connectToAIAgents();

  assert.strictEqual(createConnectionStub.calledOnce, true);
  assert.strictEqual(socketMock.end.notCalled, true);

  createConnectionStub.restore();
});

test('Test formatError with Error instance', () => {
  const error = new Error('Test error');
  const result = aiAgents.formatError(error);
  assert.strictEqual(result instanceof Error, true);
  assert.strictEqual(result?.message, 'Test error');
});

test('Test formatError with string', () => {
  const result = aiAgents.formatError('Test string error');
  assert.strictEqual(result instanceof Error, true);
  assert.strictEqual(result?.message, 'Test string error');
});

test('Test formatError with object containing message', () => {
  const result = aiAgents.formatError({ message: 'Test object error' });
  assert.strictEqual(result instanceof Error, true);
  assert.strictEqual(result?.message, 'Test object error');
});

test('Test formatError with invalid object', () => {
  const result = aiAgents.formatError({ notMessage: 'Not a message' });
  assert.strictEqual(result, null);
});

test('Test formatErrorWithDetails', () => {
  const error = new Error('Test error details');
  const result = aiAgents.formatErrorWithDetails(error, 'localhost', 8080);
  assert.strictEqual(result instanceof Error, true);
  assert.strictEqual(result.message, 'Host: localhost, Port: 8080, Error: Test error details');
});

test('Test getNetworkDetails', () => {
  const result = aiAgents.getNetworkDetails();
  assert.deepStrictEqual(result, {
    eth0: ['192.168.0.1', '10.0.0.1']
  });
});
