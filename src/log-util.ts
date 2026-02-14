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

  logInfo(message: string): void {
    this.logger.info(message);
  }

  logWarn(message: string): void {
    this.logger.warn(message);
  }

  logError(message: string): void {
    this.logger.error(message);
  }

  logDebug(message: string): void {
    this.logger.debug(message);
  }
}

export { LogUtil };
