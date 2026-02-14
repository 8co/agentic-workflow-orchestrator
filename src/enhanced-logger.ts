import fs from 'fs';
import path from 'path';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class EnhancedLogger {
  private static instance: EnhancedLogger | null = null;
  private logFilePath: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // Delay in milliseconds between retries

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

  private async logToFile(message: string): Promise<void> {
    let attempt = 0;
    while (attempt < this.maxRetries) {
      try {
        fs.appendFileSync(this.logFilePath, message, { flag: 'a', encoding: 'utf8' });
        return;
      } catch (error: unknown) {
        attempt++;
        this.logRetryErrorDetail(attempt, error);

        if (attempt < this.maxRetries) {
          // Attempt to delay before retrying
          await this.delay(this.retryDelay);
          // Attempt to recreate the log directory if necessary
          this.recoverLogDirectory();
        } else {
          // Emit a final warning to console if all retries have failed
          this.logFinalFailure(attempt, error);
        }
      }
    }
  }

  private logRetryErrorDetail(attempt: number, error: unknown): void {
    const errorDescription: string = this.getErrorDescription(error);
    console.error(`[ERROR] Attempt ${attempt} to write to log file failed: ${errorDescription}`);

    if (this.isTimeoutError(error)) {
      console.warn(`[ERROR] The operation timed out. Retrying in ${this.retryDelay / 1000} seconds, attempt ${attempt + 1}...`);
    } else if (this.isTypeError(error)) {
      console.warn(`[ERROR] Type-related error encountered. Please check for type mismatches. Retrying in ${this.retryDelay / 1000} seconds, attempt ${attempt + 1}...`);
    } else {
      console.warn(`[ERROR] Unknown write error encountered. Retrying in ${this.retryDelay / 1000} seconds, attempt ${attempt + 1}...`);
    }
  }

  private logFinalFailure(attempt: number, error: unknown): void {
    const errorDescription: string = this.getErrorDescription(error);
    console.error(`[FATAL ERROR] All ${attempt} attempts to write to log file have failed: ${errorDescription}`);
  }

  private getErrorDescription(error: unknown): string {
    if (this.isError(error)) {
      return `${error.name}: ${error.message}. Stack: ${error.stack ?? 'No stack trace available.'}`;
    } else {
      return `Non-error thrown: ${String(error)}`;
    }
  }

  private recoverLogDirectory(): void {
    try {
      const logDirectory: string = path.dirname(this.logFilePath);
      if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, { recursive: true });
      }
    } catch (recoveryError: unknown) {
      this.logErrorDetail('Recovery attempt failed', recoveryError);
    }
  }

  private logErrorDetail(context: string, error: unknown): void {
    const errorDescription: string = this.getErrorDescription(error);
    console.error(`[ERROR] ${context}: ${errorDescription}`);
  }

  private isError(obj: unknown): obj is Error {
    return obj instanceof Error;
  }

  private isTimeoutError(error: unknown): boolean {
    return this.isError(error) && error.message.includes('ETIMEDOUT');
  }

  private isTypeError(error: unknown): boolean {
    return this.isError(error) && error.name === 'TypeError';
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
