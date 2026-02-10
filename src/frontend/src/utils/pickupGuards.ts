/**
 * Safe conversion utilities for pickup timestamp handling
 */

/**
 * Safely converts a bigint nanosecond timestamp to a JavaScript Date
 * Backend stores timestamps as nanoseconds (ms * 1_000_000)
 */
export function nanosToDate(nanos: bigint): Date {
  try {
    // Convert nanoseconds to milliseconds
    const ms = Number(nanos / BigInt(1000000));
    const date = new Date(ms);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date from nanoseconds:', nanos);
      return new Date(); // Fallback to current date
    }
    
    return date;
  } catch (error) {
    console.error('Error converting nanoseconds to date:', error);
    return new Date(); // Fallback to current date
  }
}

/**
 * Safely extracts HH:MM time string from a bigint nanosecond timestamp
 */
export function nanosToTimeString(nanos: bigint): string {
  try {
    const date = nanosToDate(nanos);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Error converting nanoseconds to time string:', error);
    return '00:00'; // Safe fallback
  }
}

/**
 * Safely parses a time string (HH:MM) and combines with a date to create a nanosecond timestamp
 */
export function timeStringToNanos(timeString: string, baseDate: Date): bigint {
  try {
    if (!timeString || !timeString.includes(':')) {
      console.warn('Invalid time string:', timeString);
      // Return current time as fallback
      const now = new Date(baseDate);
      now.setHours(0, 0, 0, 0);
      return BigInt(now.getTime()) * BigInt(1000000);
    }
    
    const [hoursStr, minutesStr] = timeString.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    if (isNaN(hours) || isNaN(minutes)) {
      console.warn('Invalid time components:', timeString);
      const now = new Date(baseDate);
      now.setHours(0, 0, 0, 0);
      return BigInt(now.getTime()) * BigInt(1000000);
    }
    
    const dateTime = new Date(baseDate);
    dateTime.setHours(hours, minutes, 0, 0);
    return BigInt(dateTime.getTime()) * BigInt(1000000);
  } catch (error) {
    console.error('Error converting time string to nanoseconds:', error);
    const now = new Date(baseDate);
    now.setHours(0, 0, 0, 0);
    return BigInt(now.getTime()) * BigInt(1000000);
  }
}

/**
 * Converts a Date to nanosecond timestamp (for backend)
 */
export function dateToNanos(date: Date): bigint {
  try {
    return BigInt(date.getTime()) * BigInt(1000000);
  } catch (error) {
    console.error('Error converting date to nanoseconds:', error);
    return BigInt(Date.now()) * BigInt(1000000);
  }
}
