import fs from 'fs';
import path from 'path';

type HealthLogLevel = 'status' | 'alert';

class HealthLogger {
  private static instance: HealthLogger | null = null;
  private logFilePath: string;
  private maxRetries: number = 3;

  private constructor(logFileName: string) {
    const logDirectory: string = path.resolve(process.cwd(), 'health_logs');
    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory, { recursive: true });
    }
    this.logFilePath = path.join(logDirectory, logFileName);
  }

  static getInstance(logFileName: string = 'health.log'): HealthLogger {
    if (!HealthLogger.instance) {
      HealthLogger.instance = new HealthLogger(logFileName);
    }
    return HealthLogger.instance;
  }

  private log(message: string, level: HealthLogLevel): void {
    const timestamp: string = new Date().toISOString();
    const formattedMessage: string = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

    // Log to console
    this.logToConsole(formattedMessage, level);

    // Log to file with error handling
    this.logToFile(formattedMessage);
  }

  private logToConsole(message: string, level: HealthLogLevel): void {
    switch (level) {
      case 'status':
        console.info(message);
        break;
      case 'alert':
        console.warn(message);
        break;
    }
  }

  private logToFile(message: string): void {
    let attempt = 0;
    while (attempt < this.maxRetries) {
      try {
        fs.appendFileSync(this.logFilePath, message, { flag: 'a', encoding: 'utf8' });
        return;
      } catch (error: unknown) {
        attempt++;
        this.logRetryErrorDetail(attempt, error);

        // Attempt to recreate the log directory if necessary
        if (attempt < this.maxRetries) {
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
  }

  private logFinalFailure(attempt: number, error: unknown): void {
    const errorDescription: string = this.getErrorDescription(error);
    console.error(`[FATAL ERROR] All ${attempt} attempts to write to log file have failed: ${errorDescription}`);
  }

  private getErrorDescription(error: unknown): string {
    if (this.isError(error)) {
      return `${error.message}. Stack: ${error.stack ?? 'No stack trace available.'}`;
    } else {
      return String(error);
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

  logStatus(message: string): void {
    this.log(message, 'status');
  }

  logAlert(message: string): void {
    this.log(message, 'alert');
  }
}

export { HealthLogger, HealthLogLevel };
