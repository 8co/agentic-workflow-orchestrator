import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { EnhancedLogger, LogLevel } from '../src/enhanced-logger';

test('EnhancedLogger should create log directory and file', (t) => {
  const logFileName = 'test.log';
  const logger = EnhancedLogger.getInstance(logFileName);
  const expectedLogPath = path.resolve(process.cwd(), 'logs', logFileName);

  assert.strictEqual(fs.existsSync(expectedLogPath), true, 'Log file should be created');
});

test('EnhancedLogger should log messages with correct format', (t) => {
  const logFileName = 'format-test.log';
  const logger = EnhancedLogger.getInstance(logFileName);
  const message = 'This is a test message';
  
  logger.logInfo(message);
  const logContent = fs.readFileSync(path.resolve(process.cwd(), 'logs', logFileName), 'utf8');
  
  assert.match(logContent, /INFO/] This is a test message/, 'Message should be logged with correct format');
});

test('EnhancedLogger should handle invalid log level gracefully', (t) => {
  // Since the type LogLevel restricts invalid levels, we directly test the log method's error handling
  const logFileName = 'invalid-level.log';
  const logger = EnhancedLogger.getInstance(logFileName);
  const errLevel = 'invalid' as unknown as LogLevel;

  assert.throws(() => {
    //@ts-expect-error private access modification
    logger.log('This should not work', errLevel);
  }, /TypeError: invalid log level/, 'Should throw type error for invalid log level');
});

test('EnhancedLogger should handle file write errors gracefully', (t) => {
  const logFileName = '/root/fail.log';
  const logger = EnhancedLogger.getInstance(logFileName);

  assert.doesNotThrow(() => {
    logger.logInfo('This should not write to a file');
  }, 'File write errors should be handled gracefully');
});

// Clean up test logs
test('Clean up log files', (t) => {
  const logDirectory = path.resolve(process.cwd(), 'logs');
  if (fs.existsSync(logDirectory)) {
    fs.readdirSync(logDirectory).forEach(file => {
      fs.unlinkSync(path.join(logDirectory, file));
    });
    fs.rmdirSync(logDirectory);
  }
  assert.strictEqual(fs.existsSync(logDirectory), false, 'Logs directory should be deleted');
});
