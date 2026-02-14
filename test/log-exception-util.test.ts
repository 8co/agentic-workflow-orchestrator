import { test } from 'node:test';
import assert from 'node:assert';
import { logException, ExceptionDetails } from '../src/log-exception-util.js';

type LogFunction = (message: string) => void;

interface Logger {
  debug: LogFunction;
  info: LogFunction;
  warn: LogFunction;
  error: LogFunction;
}

function createMockLogger(logs: Record<string, string[]>): Logger {
  return {
    debug: (message: string) => logs.debug.push(message),
    info: (message: string) => logs.info.push(message),
    warn: (message: string) => logs.warn.push(message),
    error: (message: string) => logs.error.push(message),
  };
}

const createLogger = (prefix: string): Logger => {
  const logs = {
    debug: [],
    info: [],
    warn: [],
    error: [],
  };
  return createMockLogger(logs);
};

// Mock the external dependency createLogger
function setupTests() {
  const originalCreateLogger = (global as any).createLogger;
  (global as any).createLogger = createLogger;

  return () => {
    (global as any).createLogger = originalCreateLogger;
  };
}

test('logException should log error at default level when no level is provided', (t) => {
  // Setup test environment
  const cleanupTests = setupTests();

  const logs = {
    debug: [] as string[],
    info: [] as string[],
    warn: [] as string[],
    error: [] as string[],
  };

  const loggerPrefix = 'TestLogger';
  const error = new Error('Test error message');
  const logger = createMockLogger(logs);

  logException(loggerPrefix, error);

  assert.strictEqual(logs.error.length, 1);
  const expectedLogMessage = `Exception caught: ${JSON.stringify({
    name: error.name,
    message: error.message,
    stack: error.stack,
  })}`;
  assert.strictEqual(logs.error[0], expectedLogMessage);

  cleanupTests();
});

test('logException should respect logging level "debug"', (t) => {
  // Setup test environment
  const cleanupTests = setupTests();

  const logs = {
    debug: [] as string[],
    info: [] as string[],
    warn: [] as string[],
    error: [] as string[],
  };

  const loggerPrefix = 'TestLogger';
  const error = new Error('Debug level error');
  const logger = createMockLogger(logs);

  logException(loggerPrefix, error, 'debug');

  assert.strictEqual(logs.debug.length, 1);
  const expectedLogMessage = `Exception caught: ${JSON.stringify({
    name: error.name,
    message: error.message,
    stack: error.stack,
  })}`;
  assert.strictEqual(logs.debug[0], expectedLogMessage);

  cleanupTests();
});

test('logException should respect logging level "info"', (t) => {
  // Setup test environment
  const cleanupTests = setupTests();

  const logs = {
    debug: [] as string[],
    info: [] as string[],
    warn: [] as string[],
    error: [] as string[],
  };

  const loggerPrefix = 'TestLogger';
  const error = new Error('Info level error');
  const logger = createMockLogger(logs);

  logException(loggerPrefix, error, 'info');

  assert.strictEqual(logs.info.length, 1);
  const expectedLogMessage = `Exception caught: ${JSON.stringify({
    name: error.name,
    message: error.message,
    stack: error.stack,
  })}`;
  assert.strictEqual(logs.info[0], expectedLogMessage);

  cleanupTests();
});

test('logException should respect logging level "warn"', (t) => {
  // Setup test environment
  const cleanupTests = setupTests();

  const logs = {
    debug: [] as string[],
    info: [] as string[],
    warn: [] as string[],
    error: [] as string[],
  };

  const loggerPrefix = 'TestLogger';
  const error = new Error('Warning level error');
  const logger = createMockLogger(logs);

  logException(loggerPrefix, error, 'warn');

  assert.strictEqual(logs.warn.length, 1);
  const expectedLogMessage = `Exception caught: ${JSON.stringify({
    name: error.name,
    message: error.message,
    stack: error.stack,
  })}`;
  assert.strictEqual(logs.warn[0], expectedLogMessage);

  cleanupTests();
});

test('logException with missing stack trace in error should still log correctly', (t) => {
  // Setup test environment
  const cleanupTests = setupTests();

  const logs = {
    debug: [] as string[],
    info: [] as string[],
    warn: [] as string[],
    error: [] as string[],
  };

  const loggerPrefix = 'TestLogger';
  const error: Error = { name: 'NoStackError', message: 'No stack trace' };
  const logger = createMockLogger(logs);

  logException(loggerPrefix, error);

  assert.strictEqual(logs.error.length, 1);
  const expectedLogMessage = `Exception caught: ${JSON.stringify({
    name: error.name,
    message: error.message,
    stack: undefined,
  })}`;
  assert.strictEqual(logs.error[0], expectedLogMessage);

  cleanupTests();
});
