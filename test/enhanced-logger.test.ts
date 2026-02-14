import { strict as assert } from 'node:assert';
import { describe, it, beforeEach } from 'node:test';
import fs from 'fs';
import path from 'path';
import { EnhancedLogger } from '../src/enhanced-logger';

describe('EnhancedLogger', () => {
  const logFileName = 'test-log.log';
  const logDirectory = path.resolve(process.cwd(), 'logs');
  const logFilePath = path.join(logDirectory, logFileName);

  beforeEach(() => {
    if (fs.existsSync(logFilePath)) {
      fs.unlinkSync(logFilePath);
    }
  });

  const simulateLogFunction = (delay: number) => {
    return (fs.appendFileSync as jest.Mock).mockImplementationOnce(() => {
      throw new Error('ETIMEDOUT: simulated timeout');
    }).mockImplementationOnce((_, __) => {
      return new Promise((resolve) => setTimeout(resolve, delay));
    });
  };

  it('should retry writing to a log file on timeout and succeed', async () => {
    const logger = EnhancedLogger.getInstance(logFileName);
    
    jest.spyOn(fs, 'appendFileSync').mockImplementation(() => { 
      throw new Error('ETIMEDOUT: simulated timeout') 
    });

    logger.logInfo('Test message');

    await new Promise(resolve => setTimeout(resolve, 3500)); // Wait for retries

    assert.ok(fs.existsSync(logFilePath));
    const contents = fs.readFileSync(logFilePath, 'utf8');
    assert.match(contents, /Test message/);
  });

  it('should handle all retries failing due to timeout', async () => {
    const logger = EnhancedLogger.getInstance(logFileName);

    jest.spyOn(fs, 'appendFileSync').mockImplementation(() => { 
      throw new Error('ETIMEDOUT: simulated timeout') 
    });

    logger.logError('Test error message');

    await new Promise(resolve => setTimeout(resolve, 3500)); // Wait enough time for retries to be exhausted

    assert.ok(!fs.existsSync(logFilePath));
  });
});
