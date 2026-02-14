import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { EnhancedLogger, LogLevel } from '../src/enhanced-logger.ts';

const logsDir = path.resolve(process.cwd(), 'logs');
const logFileName = 'test.log';
const logFilePath = path.join(logsDir, logFileName);

// Helper function to clear logs
function clearLogs() {
  if (fs.existsSync(logFilePath)) {
    fs.unlinkSync(logFilePath);
  }
}

// Helper function to read logs
function readLogs(): string {
  if (fs.existsSync(logFilePath)) {
    return fs.readFileSync(logFilePath, 'utf-8');
  }
  return '';
}

test('EnhancedLogger should log messages to the console and the file', async () => {
  clearLogs();

  const logger = EnhancedLogger.getInstance(logFileName);

  // Redirect console methods to capture outputs
  const originalConsoleInfo = console.info;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  const originalConsoleDebug = console.debug;

  let consoleOutput: { level: LogLevel; message: string }[] = [];

  console.info = (message: string) => {
    consoleOutput.push({ level: 'info', message });
  };
  
  console.warn = (message: string) => {
    consoleOutput.push({ level: 'warn', message });
  };

  console.error = (message: string) => {
    consoleOutput.push({ level: 'error', message });
  };

  console.debug = (message: string) => {
    consoleOutput.push({ level: 'debug', message });
  };

  const infoMessage = "This is an info message";
  const warnMessage = "This is a warning message";
  const errorMessage = "This is an error message";
  const debugMessage = "This is a debug message";

  logger.logInfo(infoMessage);
  logger.logWarn(warnMessage);
  logger.logError(errorMessage);
  logger.logDebug(debugMessage);

  // Restore console methods
  console.info = originalConsoleInfo;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
  console.debug = originalConsoleDebug;

  const logs = readLogs();
  const loggedMessages = logs.split('\n').filter(Boolean);

  // Checking console output
  assert.strictEqual(consoleOutput.length, 4, 'Wrong number of console logs');
  assert.strictEqual(consoleOutput[0].level, 'info');
  assert(consoleOutput[0].message.includes('INFO'), 'Correct log level for info');
  assert(consoleOutput[0].message.includes(infoMessage), 'Correct log message for info');
  
  assert.strictEqual(consoleOutput[1].level, 'warn');
  assert(consoleOutput[1].message.includes('WARN'), 'Correct log level for warn');
  assert(consoleOutput[1].message.includes(warnMessage), 'Correct log message for warn');
  
  assert.strictEqual(consoleOutput[2].level, 'error');
  assert(consoleOutput[2].message.includes('ERROR'), 'Correct log level for error');
  assert(consoleOutput[2].message.includes(errorMessage), 'Correct log message for error');

  assert.strictEqual(consoleOutput[3].level, 'debug');
  assert(consoleOutput[3].message.includes('DEBUG'), 'Correct log level for debug');
  assert(consoleOutput[3].message.includes(debugMessage), 'Correct log message for debug');

  // Checking file output
  assert.strictEqual(loggedMessages.length, 4, 'Wrong number of file logs');
  assert(loggedMessages[0].includes('INFO') && loggedMessages[0].includes(infoMessage));
  assert(loggedMessages[1].includes('WARN') && loggedMessages[1].includes(warnMessage));
  assert(loggedMessages[2].includes('ERROR') && loggedMessages[2].includes(errorMessage));
  assert(loggedMessages[3].includes('DEBUG') && loggedMessages[3].includes(debugMessage));

  clearLogs();
});
