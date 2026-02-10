/**
 * Safe numeric formatting utilities that never crash on invalid input
 */

/**
 * Safely formats a number as currency, returning a fallback for invalid values
 */
export function safeCurrency(value: number | undefined | null, fallback: string = '$0.00'): string {
  if (value === undefined || value === null || !isFinite(value)) {
    return fallback;
  }
  
  try {
    return `$${value.toFixed(2)}`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return fallback;
  }
}

/**
 * Safely formats a number to a fixed number of decimal places
 */
export function safeFixed(value: number | undefined | null, decimals: number = 2, fallback: string = '0.00'): string {
  if (value === undefined || value === null || !isFinite(value)) {
    return fallback;
  }
  
  try {
    return value.toFixed(decimals);
  } catch (error) {
    console.error('Error formatting number:', error);
    return fallback;
  }
}

/**
 * Safely parses a string to a float, returning 0 for invalid values
 */
export function safeParseFloat(value: string | undefined | null): number {
  if (!value) return 0;
  
  const parsed = parseFloat(value);
  return isFinite(parsed) ? parsed : 0;
}
