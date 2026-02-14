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

export function isNetworkError(err: unknown): err is NetworkError {
  if (!isRecord(err)) {
    return false;
  }

  const errorObj = err as Partial<NetworkError>;

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

  // Ensuring the code is one of the known error codes
  const hasValidCode = typeof errorObj.code === 'string' && networkErrorCodes.has(errorObj.code);

  // Ensuring the timeout property is properly defined
  const hasValidTimeout = errorObj.timeout === true || errorObj.timeout === false || errorObj.timeout === undefined;

  return (
    hasValidCode || errorObj.timeout === true
  ) && hasValidTimeout && (typeof errorObj.message === 'string' || errorObj.message === undefined);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
