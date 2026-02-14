import { connectToAIAgents } from '../src/aiAgents.js';
import assert from 'node:assert';
import { test } from 'node:test';
import { execSync } from 'node:child_process';

// Mock dependencies
import { createConnection, Socket } from 'net';
import { accessSync } from 'fs';

let mockCreateConnection: typeof createConnection;
let mockAccessSync: typeof accessSync;

test('connectToAIAgents - successful connection', (t) => {
  mockCreateConnection = createConnection as any;
  mockAccessSync = accessSync as any;

  const mockSocket = {
    on: (event: string, handler: Function): void => {
      if (event === 'close') {
        handler(false); // simulate graceful close
      }
    },
    end: (): void => {},
  } as unknown as Socket;

  let connectionCallback: Function | undefined;

  mockCreateConnection = (_options, callback) => {
    connectionCallback = callback;
    return mockSocket;
  };

  mockAccessSync = (_path: string, _flags: number): void => {};

  const spyLogConnectionEvent = t.mock.fn();
  const spyHandleConnectionError = t.mock.fn();

  (connectToAIAgents as any).__set__('logConnectionEvent', spyLogConnectionEvent);
  (connectToAIAgents as any).__set__('handleConnectionError', spyHandleConnectionError);

  connectToAIAgents();

  // Validate mock functions
  assert.strictEqual(spyLogConnectionEvent.mock.calls.length, 1);
  assert.strictEqual(spyHandleConnectionError.mock.calls.length, 0);

  if (connectionCallback) connectionCallback();

  assert.strictEqual(spyLogConnectionEvent.mock.calls.length, 2);
  assert.strictEqual(spyHandleConnectionError.mock.calls.length, 0);
});

test('connectToAIAgents - connection error', (t) => {
  mockCreateConnection = createConnection as any;
  mockAccessSync = accessSync as any;

  const mockSocket = {
    on: (event: string, handler: Function): void => {
      if (event === 'error') {
        const error = new Error('Mock connection error');
        handler(error);
      }
    },
    destroy: (): void => {},
  } as unknown as Socket;

  mockCreateConnection = (_options) => {
    return mockSocket;
  };

  mockAccessSync = (_path: string, _flags: number): void => {};

  const spyLogConnectionEvent = t.mock.fn();
  const spyHandleConnectionError = t.mock.fn();

  (connectToAIAgents as any).__set__('logConnectionEvent', spyLogConnectionEvent);
  (connectToAIAgents as any).__set__('handleConnectionError', spyHandleConnectionError);

  connectToAIAgents();

  // Validate mock functions
  assert.strictEqual(spyLogConnectionEvent.mock.calls.length, 1);
  assert.strictEqual(spyHandleConnectionError.mock.calls.length, 1);
  assert.strictEqual(
    spyHandleConnectionError.mock.calls[0][0].message,
    'Error connecting to AI agent APIs: Host: ai-agent-api.example.com, Port: 443, Error: Mock connection error'
  );
});

test('connectToAIAgents - network permission error', (t) => {
  mockCreateConnection = createConnection as any;
  mockAccessSync = accessSync as any;

  mockAccessSync = (_path: string, _flags: number): void => {
    throw new Error('Mock permissions error');
  };

  const spyLogConnectionEvent = t.mock.fn();
  const spyHandleConnectionError = t.mock.fn();

  (connectToAIAgents as any).__set__('logConnectionEvent', spyLogConnectionEvent);
  (connectToAIAgents as any).__set__('handleConnectionError', spyHandleConnectionError);

  assert.throws(() => {
    connectToAIAgents();
  }, /Network permission error: Mock permissions error/);

  // Validate mock functions
  assert.strictEqual(spyLogConnectionEvent.mock.calls.length, 1);
  assert.strictEqual(spyHandleConnectionError.mock.calls.length, 1);
  assert.strictEqual(
    spyHandleConnectionError.mock.calls[0][0].message,
    'Error connecting to AI agent APIs: Network permission error: Mock permissions error'
  );
});

// Cleanup mocks
execSync('git checkout -- tests'); // Revert changes in tests to clean state
