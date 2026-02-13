import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createLogger } from './logger.js';

describe('createLogger', () => {
  it('should return an object with info, warn, error, and debug methods', () => {
    const logger = createLogger('testPrefix');
    
    assert.strictEqual(typeof logger.info, 'function');
    assert.strictEqual(typeof logger.warn, 'function');
    assert.strictEqual(typeof logger.error, 'function');
    assert.strictEqual(typeof logger.debug, 'function');
  });

  it('should not throw when calling info, warn, error methods', () => {
    const logger = createLogger('testPrefix');
    assert.doesNotThrow(() => logger.info('info message'));
    assert.doesNotThrow(() => logger.warn('warn message'));
    assert.doesNotThrow(() => logger.error('error message'));
  });

  it('should not throw when calling debug method if log level is debug', () => {
    process.env.LOG_LEVEL = 'debug';
    const logger = createLogger('testPrefix');
    assert.doesNotThrow(() => logger.debug('debug message'));
    delete process.env.LOG_LEVEL;
  });

  it('should include prefix and log level in the message format for info', () => {
    const logger = createLogger('testPrefix');
    const consoleInfo = console.info;
    let output = '';

    console.info = (msg: string) => { output = msg; };
    logger.info('test message');
    console.info = consoleInfo;

    assert.match(output, /\[INFO\] \[testPrefix\] test message/);
  });

  it('should include prefix and log level in the message format for warn', () => {
    const logger = createLogger('testPrefix');
    const consoleWarn = console.warn;
    let output = '';

    console.warn = (msg: string) => { output = msg; };
    logger.warn('test message');
    console.warn = consoleWarn;

    assert.match(output, /\[WARN\] \[testPrefix\] test message/);
  });

  it('should include prefix and log level in the message format for error', () => {
    const logger = createLogger('testPrefix');
    const consoleError = console.error;
    let output = '';

    console.error = (msg: string) => { output = msg; };
    logger.error('test message');
    console.error = consoleError;

    assert.match(output, /\[ERROR\] \[testPrefix\] test message/);
  });

  it('should include prefix and log level in the message format for debug', () => {
    process.env.LOG_LEVEL = 'debug';
    const logger = createLogger('testPrefix');
    const consoleDebug = console.debug;
    let output = '';

    console.debug = (msg: string) => { output = msg; };
    logger.debug('test message');
    console.debug = consoleDebug;

    assert.match(output, /\[DEBUG\] \[testPrefix\] test message/);

    delete process.env.LOG_LEVEL;
  });
});
