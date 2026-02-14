/**
 * Utility functions for handling network errors with enhanced type safety.
 */

// Defined type for network errors
export type NetworkError = {
  statusCode: number;
  message: string;
};

// Predicate function to check if an error is a network error
export const isNetworkError = (error: unknown): error is NetworkError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    'message' in error &&
    typeof (error as Record<string, unknown>)['statusCode'] === 'number' &&
    typeof (error as Record<string, unknown>)['message'] === 'string'
  );
};

// Function to handle network errors by logging
export const handleNetworkError = (error: unknown): void => {
  if (isNetworkError(error)) {
    console.error(`Network Error: ${error.statusCode} - ${error.message}`);
  } else {
    console.error('Unknown error:', error);
  }
};

// Example function simulating a network operation that can produce errors
export const networkOperation = async (): Promise<void> => {
  try {
    // Simulate network request
    throw { statusCode: 404, message: 'Resource not found' };
  } catch (error) {
    handleNetworkError(error);
  }
};
