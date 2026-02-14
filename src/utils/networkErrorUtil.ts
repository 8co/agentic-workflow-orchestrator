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

export function isNetworkError(err: unknown): boolean {
  if (!isObject(err)) {
    return false;
  }

  const errorObj = err as NetworkError;

  const networkErrorCodes: NetworkErrorCode[] = [
    'ENOTFOUND',   // DNS resolution error
    'ECONNREFUSED',// Connection refused
    'ECONNRESET',  // Connection reset by peer
    'ETIMEDOUT',   // Connection timed out
    'EHOSTUNREACH',// No route to host
    'EPIPE',       // Broken pipe
    'ENETUNREACH', // Network is unreachable
  ];

  return (
    (errorObj.code !== undefined && networkErrorCodes.includes(errorObj.code)) ||
    errorObj.timeout === true
  );
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}
