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
        this.logger.error(`Unexpected log level: ${level}. ${logMessage}`);
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
