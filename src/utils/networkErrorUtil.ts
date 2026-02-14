export function isNetworkError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) {
    return false;
  }

  const errorObj = err as { code?: string, timeout?: boolean };

  const networkErrorCodes = [
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
