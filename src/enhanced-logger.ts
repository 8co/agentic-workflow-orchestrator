import fs from 'fs';
import path from 'path';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class EnhancedLogger {
  private static instance: EnhancedLogger | null = null;
  private logFilePath: string;

  private constructor(logFileName: string) {
    const logDirectory: string = path.resolve(process.cwd(), 'logs');
    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory, { recursive: true });
    }
    this.logFilePath = path.join(logDirectory, logFileName);
  }

  static getInstance(logFileName: string = 'application.log'): EnhancedLogger {
    if (!EnhancedLogger.instance) {
      EnhancedLogger.instance = new EnhancedLogger(logFileName);
    }
    return EnhancedLogger.instance;
  }

  private log(message: string, level: LogLevel): void {
    const timestamp: string = new Date().toISOString();
    const formattedMessage: string = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

    // Log to console
    this.logToConsole(formattedMessage, level);

    // Log to file with error handling
    this.logToFile(formattedMessage);
  }

  private logToConsole(message: string, level: LogLevel): void {
    switch (level) {
      case 'info':
        console.info(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'error':
        console.error(message);
        break;
      case 'debug':
        console.debug(message);
        break;
    }
  }

  private logToFile(message: string): void {
    try {
      fs.appendFileSync(this.logFilePath, message);
    } catch (error: unknown) {
      console.error(`[ERROR] Failed to write to log file: ${error instanceof Error ? error.message : String(error)}`);
      
      // Attempt to recreate the log directory and file
      try {
        const logDirectory: string = path.dirname(this.logFilePath);
        if (!fs.existsSync(logDirectory)) {
          fs.mkdirSync(logDirectory, { recursive: true });
        }
        fs.appendFileSync(this.logFilePath, message);
      } catch (recoveryError: unknown) {
        console.error(`[ERROR] Recovery attempt failed: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`);
      }
    }
  }

  logInfo(message: string): void {
    this.log(message, 'info');
  }

  logWarn(message: string): void {
    this.log(message, 'warn');
  }

  logError(message: string): void {
    this.log(message, 'error');
  }

  logDebug(message: string): void {
    this.log(message, 'debug');
  }
}

export { EnhancedLogger, LogLevel };
