import { LogUtil } from '../src/log-util.js';
import assert from 'node:assert';
import { test } from 'node:test';

// Mocking the createLogger function
const mockedLogger = {
  info: (msg: string) => {},
  warn: (msg: string) => {},
  error: (msg: string) => {},
  debug: (msg: string) => {}
};

function createLogger(name: string) {
  assert.strictEqual(name, 'Application');
  return mockedLogger;
}

import proxyquire from 'proxyquire';

const { LogUtil: ProxiedLogUtil } = proxyquire('../src/log-util.js', {
  './logger.js': { createLogger }
});

test('LogUtil should return the same instance', (t) => {
  const instance1 = ProxiedLogUtil.getInstance();
  const instance2 = ProxiedLogUtil.getInstance();
  assert.strictEqual(instance1, instance2);
});

test('LogUtil should log info messages', (t) => {
  let messageLogged: string | null = null;
  mockedLogger.info = (msg: string) => {
    messageLogged = msg;
  };

  const logUtil = ProxiedLogUtil.getInstance();
  logUtil.logInfo('Info message');
  assert.strictEqual(messageLogged, 'Info message');
});

test('LogUtil should log warn messages', (t) => {
  let messageLogged: string | null = null;
  mockedLogger.warn = (msg: string) => {
    messageLogged = msg;
  };

  const logUtil = ProxiedLogUtil.getInstance();
  logUtil.logWarn('Warn message');
  assert.strictEqual(messageLogged, 'Warn message');
});

test('LogUtil should log error messages', (t) => {
  let messageLogged: string | null = null;
  mockedLogger.error = (msg: string) => {
    messageLogged = msg;
  };

  const logUtil = ProxiedLogUtil.getInstance();
  logUtil.logError('Error message');
  assert.strictEqual(messageLogged, 'Error message');
});

test('LogUtil should log debug messages', (t) => {
  let messageLogged: string | null = null;
  mockedLogger.debug = (msg: string) => {
    messageLogged = msg;
  };

  const logUtil = ProxiedLogUtil.getInstance();
  logUtil.logDebug('Debug message');
  assert.strictEqual(messageLogged, 'Debug message');
});
