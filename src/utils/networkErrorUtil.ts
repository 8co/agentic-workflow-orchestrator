export type NetworkErrorCode = 
  | 'ENOTFOUND'
  | 'ECONNREFUSED'
  | 'ECONNRESET'
  | 'ETIMEDOUT'
  | 'EHOSTUNREACH'
  | 'EPIPE'
  | 'ENETUNREACH'
  | 'ESOCKETTIMEDOUT' // Socket timed out
  | 'ECONNABORTED';  // Connection aborted

export interface NetworkError {
  code?: NetworkErrorCode;
  timeout?: boolean;
  message?: string;
}

const networkErrorCodes: ReadonlySet<NetworkErrorCode> = new Set([
  'ENOTFOUND',       // DNS resolution error
  'ECONNREFUSED',    // Connection refused
  'ECONNRESET',      // Connection reset by peer
  'ETIMEDOUT',       // Connection timed out
  'EHOSTUNREACH',    // No route to host
  'EPIPE',           // Broken pipe
  'ENETUNREACH',     // Network is unreachable
  'ESOCKETTIMEDOUT', // Socket timed out
  'ECONNABORTED',    // Connection aborted
]);

export function isNetworkError(err: unknown): err is NetworkError {
  if (!isRecord(err)) {
    return false;
  }

  const errorObj = err as Partial<NetworkError>;

  return (
    isValidNetworkErrorCode(errorObj.code) || errorObj.timeout === true
  ) && isValidTimeout(errorObj.timeout) && isValidMessage(errorObj.message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidNetworkErrorCode(code: unknown): code is NetworkErrorCode {
  return typeof code === 'string' && networkErrorCodes.has(code as NetworkErrorCode);
}

function isValidTimeout(timeout: unknown): timeout is boolean | undefined {
  return timeout === true || timeout === false || timeout === undefined;
}

function isValidMessage(message: unknown): message is string | undefined {
  return typeof message === 'string' || message === undefined;
}
