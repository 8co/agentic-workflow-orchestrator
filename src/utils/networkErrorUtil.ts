export type NetworkErrorCode = 
  | 'ENOTFOUND'
  | 'ECONNREFUSED'
  | 'ECONNRESET'
  | 'ETIMEDOUT'
  | 'EHOSTUNREACH'
  | 'EPIPE'
  | 'ENETUNREACH';

export interface NetworkError {
  code?: NetworkErrorCode;
  timeout?: boolean;
}

export function isNetworkError(err: unknown): err is NetworkError {
  if (!isObject(err)) {
    return false;
  }

  const errorObj = err as NetworkError;

  const networkErrorCodes: readonly NetworkErrorCode[] = [
    'ENOTFOUND',   // DNS resolution error
    'ECONNREFUSED',// Connection refused
    'ECONNRESET',  // Connection reset by peer
    'ETIMEDOUT',   // Connection timed out
    'EHOSTUNREACH',// No route to host
    'EPIPE',       // Broken pipe
    'ENETUNREACH', // Network is unreachable
  ];

  return (
    (typeof errorObj.code === 'string' && networkErrorCodes.includes(errorObj.code)) ||
    errorObj.timeout === true
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
