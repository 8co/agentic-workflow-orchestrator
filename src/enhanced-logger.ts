import fs from 'fs';
import path from 'path';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class EnhancedLogger {
  private static instance: EnhancedLogger | null = null;
  private logFilePath: string;
  private maxRetries: number = 3;

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
    let attempt = 0;
    while (attempt < this.maxRetries) {
      try {
        fs.appendFileSync(this.logFilePath, message);
        return;
      } catch (error: unknown) {
        attempt++;
        this.logErrorDetail(`Attempt ${attempt} - Failed to write to log file`, error);

        // Attempt to recreate the log directory and file
        if (attempt < this.maxRetries) {
          try {
            const logDirectory: string = path.dirname(this.logFilePath);
            if (!fs.existsSync(logDirectory)) {
              fs.mkdirSync(logDirectory, { recursive: true });
            }
          } catch (recoveryError: unknown) {
            this.logErrorDetail('Recovery attempt failed', recoveryError);
          }
        }
      }
    }
  }

  private logErrorDetail(context: string, error: unknown): void {
    if (this.isError(error)) {
      console.error(`[ERROR] ${context}: ${error.message}. Stack: ${error.stack ?? 'No stack trace available.'}`);
    } else {
      console.error(`[ERROR] ${context}: ${String(error)}`);
    }
  }

  private isError(obj: unknown): obj is Error {
    return obj instanceof Error;
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
