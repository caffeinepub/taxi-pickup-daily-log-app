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

/**
 * Extract a short, user-friendly summary from an error
 * Suitable for toast messages and primary error displays
 */
export function getShortErrorSummary(error: unknown): string {
  const fullMessage = getErrorMessage(error);
  
  // Truncate very long messages
  if (fullMessage.length > 150) {
    return fullMessage.substring(0, 147) + '...';
  }
  
  return fullMessage;
}

/**
 * Extract full technical details from an error for debugging
 * Returns a string suitable for display in a scrollable container
 */
export function getErrorDetails(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n\nStack:\n${error.stack || 'No stack trace available'}`;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object') {
    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return String(error);
    }
  }
  
  return String(error);
}

/**
 * Get a user-friendly import error message
 */
export function getImportErrorSummary(error: unknown): string {
  const message = getErrorMessage(error);
  
  // JSON parse errors
  if (message.includes('JSON') || message.includes('parse') || message.includes('Unexpected token')) {
    return 'The selected file is not a valid JSON file. Please check the file format.';
  }
  
  // Normalization errors
  if (message.includes('Invalid pickup') || message.includes('Invalid record')) {
    return 'Some pickup records in the file have invalid data. Please check the file contents.';
  }
  
  if (message.includes('No pickup records found')) {
    return 'The import file does not contain any pickup records.';
  }
  
  if (message.includes('Invalid import file format')) {
    return 'The import file format is not recognized. Please use a file exported from this app.';
  }
  
  // Backend errors
  if (message.includes('Invalid nat argument')) {
    return 'Some numeric values in the file are invalid. The file may be from an incompatible version.';
  }
  
  if (message.includes('Unauthorized')) {
    return 'You do not have permission to import data. Please log in again.';
  }
  
  // Generic fallback
  if (message.length > 100) {
    return 'Import failed due to a data format issue. Please check the file and try again.';
  }
  
  return message;
}
