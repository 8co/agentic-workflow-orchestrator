import { createLogger, LogLevel } from './logger.js';

class LogUtil {
  private static instance: LogUtil;
  private logger = createLogger('Application');

  private constructor() {}

  static getInstance(): LogUtil {
    if (!LogUtil.instance) {
      LogUtil.instance = new LogUtil();
    }
    return LogUtil.instance;
  }

  private log(level: LogLevel, message: string, error?: Error): void {
    try {
      const logMessage = error ? `${message} - Error: ${error.message}` : message;
      switch (level) {
        case 'info':
          this.logger.info(logMessage);
          break;
        case 'warn':
          this.logger.warn(logMessage);
          break;
        case 'error':
          this.logger.error(logMessage);
          break;
        case 'debug':
          this.logger.debug(logMessage);
          break;
        default:
          throw new Error(`Invalid log level: ${level}`);
      }
    } catch (loggingError) {
      const errorMessage = loggingError instanceof Error ? loggingError.message : 'Unknown error';
      this.logger.error(`Logging failed for original message: ${message}. Error: ${errorMessage}`);
    }
  }

  logInfo(message: string): void {
    this.log('info', message);
  }

  logWarn(message: string): void {
    this.log('warn', message);
  }

  logError(message: string, error?: Error): void {
    this.log('error', message, error);
  }

  logDebug(message: string): void {
    this.log('debug', message);
  }
}

export { LogUtil };
