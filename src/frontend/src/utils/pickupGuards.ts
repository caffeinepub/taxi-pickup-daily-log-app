/**
 * Safe conversion utilities for pickup timestamp handling between bigint nanoseconds
 * and JavaScript Date objects, with Pacific time zone support for consistent day grouping.
 */

const PACIFIC_TZ = 'America/Los_Angeles';

/**
 * Convert nanosecond timestamp (bigint) to JavaScript Date
 */
export function nanosToDate(nanos: bigint): Date {
    try {
        const millis = Number(nanos / BigInt(1000000));
        return new Date(millis);
    } catch {
        return new Date(0);
    }
}

/**
 * Convert nanosecond timestamp (bigint) to 12-hour time string with AM/PM in Pacific time
 */
export function nanosToTimeString(nanos: bigint): string {
    try {
        const date = nanosToDate(nanos);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: PACIFIC_TZ,
        });
    } catch {
        return '12:00 AM';
    }
}

/**
 * Format a date in Pacific time for display
 */
export function formatPacificDate(nanos: bigint): string {
    try {
        const date = nanosToDate(nanos);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: PACIFIC_TZ,
        });
    } catch {
        return 'Invalid Date';
    }
}

/**
 * Convert JavaScript Date to nanosecond timestamp (bigint)
 */
export function dateToNanos(date: Date): bigint {
    return BigInt(date.getTime()) * BigInt(1000000);
}

/**
 * Get the start of day (midnight) for a given date in nanoseconds
 */
export function getDayStartNanos(date: Date): bigint {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    return dateToNanos(dayStart);
}

/**
 * Get the end of day (23:59:59.999) for a given date in nanoseconds
 */
export function getDayEndNanos(date: Date): bigint {
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    return dateToNanos(dayEnd);
}

/**
 * Get a stable day identifier (start of day in nanoseconds) for query keys
 */
export function getDayIdentifier(date: Date): string {
    return getDayStartNanos(date).toString();
}

/**
 * Get the Pacific time day grouping (start of day in Pacific time) from a pickup timestamp
 * This ensures pickups are grouped by their Pacific time date, not UTC date
 */
export function getPacificDayGrouping(pickupTimeNanos: bigint): bigint {
    try {
        const date = nanosToDate(pickupTimeNanos);
        
        // Format the date in Pacific time to get year, month, day
        const pacificDateStr = date.toLocaleDateString('en-US', {
            timeZone: PACIFIC_TZ,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        
        // Parse the Pacific date string (MM/DD/YYYY)
        const [month, day, year] = pacificDateStr.split('/').map(Number);
        
        // Create a new Date at midnight Pacific time for that day
        // We use UTC methods but adjust for Pacific offset
        const pacificMidnight = new Date(Date.UTC(year, month - 1, day));
        
        // Get Pacific offset for that date (handles DST)
        const pacificOffsetMs = getPacificOffsetMs(pacificMidnight);
        
        // Adjust to Pacific midnight
        const pacificMidnightMs = pacificMidnight.getTime() - pacificOffsetMs;
        
        return BigInt(pacificMidnightMs) * BigInt(1000000);
    } catch {
        return BigInt(0);
    }
}

/**
 * Get Pacific time offset in milliseconds for a given date (handles DST)
 */
function getPacificOffsetMs(date: Date): number {
    // Create a formatter for Pacific time
    const pacificStr = date.toLocaleString('en-US', {
        timeZone: PACIFIC_TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    
    const utcStr = date.toLocaleString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    
    const pacificTime = new Date(pacificStr).getTime();
    const utcTime = new Date(utcStr).getTime();
    
    return utcTime - pacificTime;
}

/**
 * Convert a date and 12-hour time parts to a Pacific time timestamp in nanoseconds
 */
export function pacificTimeToNanos(
    date: Date,
    hour12: number,
    minute: number,
    isPM: boolean
): bigint {
    try {
        // Convert 12-hour to 24-hour
        let hour24 = hour12;
        if (isPM && hour12 !== 12) {
            hour24 = hour12 + 12;
        } else if (!isPM && hour12 === 12) {
            hour24 = 0;
        }
        
        // Get the date string in Pacific time
        const dateStr = date.toLocaleDateString('en-US', {
            timeZone: PACIFIC_TZ,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        
        const [month, day, year] = dateStr.split('/').map(Number);
        
        // Create a date string in ISO format for the Pacific time
        const isoStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
        
        // Parse as if it's in Pacific time
        const localDate = new Date(isoStr);
        const pacificOffsetMs = getPacificOffsetMs(localDate);
        
        // Adjust for Pacific offset
        const pacificMs = localDate.getTime() - pacificOffsetMs;
        
        return BigInt(pacificMs) * BigInt(1000000);
    } catch {
        return BigInt(0);
    }
}

/**
 * Extract 12-hour time parts from a Pacific time timestamp
 */
export function nanosTo12HourParts(nanos: bigint): {
    hour: number;
    minute: number;
    isPM: boolean;
} {
    try {
        const date = nanosToDate(nanos);
        
        const timeStr = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: PACIFIC_TZ,
        });
        
        // Parse "9:13 PM" format
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) {
            return { hour: 12, minute: 0, isPM: false };
        }
        
        const hour = parseInt(match[1], 10);
        const minute = parseInt(match[2], 10);
        const isPM = match[3].toUpperCase() === 'PM';
        
        return { hour, minute, isPM };
    } catch {
        return { hour: 12, minute: 0, isPM: false };
    }
}

/**
 * Get current time in Pacific time as 12-hour parts
 */
export function getCurrentPacificTime(): {
    hour: number;
    minute: number;
    isPM: boolean;
} {
    const now = new Date();
    const nanos = dateToNanos(now);
    return nanosTo12HourParts(nanos);
}

/**
 * Format current time as HH:MM for time input (24-hour format for input control)
 */
export function getCurrentTimeInputValue(): string {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: PACIFIC_TZ,
    });
    return timeStr;
}
