type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function formatMessage(level: LogLevel, prefix: string, msg: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${prefix}] ${msg}`;
}

function createLogger(prefix: string) {
  const logLevel = process.env.LOG_LEVEL || 'info';
  
  return {
    info(msg: string) {
      console.info(formatMessage('info', prefix, msg));
    },
    warn(msg: string) {
      console.warn(formatMessage('warn', prefix, msg));
    },
    error(msg: string) {
      console.error(formatMessage('error', prefix, msg));
    },
    debug(msg: string) {
      if (logLevel === 'debug') {
        console.debug(formatMessage('debug', prefix, msg));
      }
    }
  };
}

export { createLogger, LogLevel };
