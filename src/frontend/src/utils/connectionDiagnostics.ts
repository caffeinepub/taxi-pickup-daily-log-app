import { getErrorMessage } from './errorMessage';

/**
 * Connection diagnostics utilities for actor initialization errors
 */

export interface HealthCheckResult {
  success: boolean;
  timestamp: number;
  message: string;
  error?: string;
}

/**
 * Normalizes initialization errors into stable English strings
 */
export function normalizeInitializationError(error: unknown): string {
  const rawMessage = getErrorMessage(error);
  
  // Map common agent/replica errors to user-friendly messages
  const lowerMessage = rawMessage.toLowerCase();
  
  if (lowerMessage.includes('fetch') || lowerMessage.includes('network')) {
    return 'Network error: Unable to reach the backend service. Please check your internet connection.';
  }
  
  if (lowerMessage.includes('timeout')) {
    return 'Connection timeout: The backend service is taking too long to respond.';
  }
  
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('authentication')) {
    return 'Authentication error: Unable to verify your identity. Please try logging out and back in.';
  }
  
  if (lowerMessage.includes('replica') || lowerMessage.includes('canister')) {
    return 'Backend service error: The canister may be temporarily unavailable or updating.';
  }
  
  if (lowerMessage.includes('certificate')) {
    return 'Security certificate error: Unable to verify the backend service identity.';
  }
  
  // Return sanitized raw message if no pattern matches
  return `Connection error: ${rawMessage}`;
}

/**
 * Checks if the user appears to be offline
 */
export function isUserOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Generates a diagnostic message combining health check and error info
 */
export function generateDiagnosticMessage(
  error: unknown,
  healthCheck: HealthCheckResult | null
): string {
  const errorMessage = normalizeInitializationError(error);
  
  if (isUserOffline()) {
    return 'You appear to be offline. Please check your internet connection and try again.';
  }
  
  if (healthCheck?.success) {
    return `${errorMessage}\n\nThe backend service is reachable, but initialization failed. This may be a temporary issue.`;
  }
  
  if (healthCheck && !healthCheck.success) {
    return `${errorMessage}\n\nBackend health check failed: ${healthCheck.message}`;
  }
  
  return errorMessage;
}
