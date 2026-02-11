/**
 * Extracts a stable English error message from unknown error types,
 * normalizing backend trap/error shapes into actionable strings
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object') {
    // Try to extract message from common error shapes
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }
    
    // Handle agent/backend error objects with nested structures
    if ('error' in error && error.error && typeof error.error === 'object') {
      const nestedError = error.error as any;
      if ('message' in nestedError && typeof nestedError.message === 'string') {
        return nestedError.message;
      }
    }
    
    // Try to stringify the error object
    try {
      const stringified = JSON.stringify(error);
      
      // Extract common backend trap patterns
      if (stringified.includes('missing required field')) {
        const match = stringified.match(/missing required field[:\s]+["']?(\w+)["']?/i);
        if (match) {
          return `Missing required field: ${match[1]}`;
        }
      }
      
      if (stringified.includes('Unauthorized')) {
        return 'Unauthorized: You do not have permission to perform this action';
      }
      
      // If it's a simple object with a message, extract it
      if (stringified.includes('"message"')) {
        const parsed = JSON.parse(stringified);
        if (parsed.message) return parsed.message;
      }
      
      // Return a more readable version if possible
      if (stringified.length < 200 && stringified.length > 2) {
        // Clean up common JSON artifacts
        return stringified
          .replace(/^["']|["']$/g, '')
          .replace(/\\"/g, '"')
          .replace(/\\/g, '');
      }
      
      return 'An error occurred during the operation';
    } catch {
      return 'An unknown error occurred';
    }
  }
  
  return 'An unknown error occurred';
}
