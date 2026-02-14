import { createLogger, LogLevel } from './logger.js';

interface ExceptionDetails {
  name: string;
  message: string;
  stack?: string;
}

function logException(
  loggerPrefix: string,
  error: Error,
  level: LogLevel = 'error'
): void {
  const logger = createLogger(loggerPrefix);
  const exceptionDetails: ExceptionDetails = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  const logMessage = `Exception caught: ${JSON.stringify(exceptionDetails)}`;

  switch (level) {
    case 'debug':
      logger.debug(logMessage);
      break;
    case 'info':
      logger.info(logMessage);
      break;
    case 'warn':
      logger.warn(logMessage);
      break;
    case 'error':
      logger.error(logMessage);
      break;
  }
}

export { logException, ExceptionDetails };
