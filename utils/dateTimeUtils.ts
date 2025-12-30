/**
 * Date and Time Utilities for JetSuite
 * Ensures consistent date/time handling across all timezone considerations
 */

/**
 * Get the current date and time in ISO format
 * This always returns the actual current UTC time
 */
export const getCurrentDateTime = (): string => {
  return new Date().toISOString();
};

/**
 * Get current date in YYYY-MM-DD format
 * Uses UTC to ensure consistency across all timezones by default
 * @param timezone - Optional IANA timezone string (e.g. 'America/New_York')
 */
export const getCurrentDate = (timezone?: string): string => {
  if (timezone) {
    // en-CA locale formats as YYYY-MM-DD
    return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  }
  const now = new Date();
  return now.toISOString().split('T')[0];
};

/**
 * Get the current month and year (e.g., "January 2025")
 * Used for display purposes and prompts
 * @param timezone - Optional IANA timezone string
 */
export const getCurrentMonthYear = (timezone?: string): string => {
  return new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric',
    timeZone: timezone
  });
};

/**
 * Get the current year
 * @param timezone - Optional IANA timezone string
 */
export const getCurrentYear = (timezone?: string): number => {
  const yearStr = new Date().toLocaleDateString('en-US', { 
    year: 'numeric',
    timeZone: timezone 
  });
  return parseInt(yearStr, 10);
};

/**
 * Get a user-friendly current date time string with timezone
 * Useful for AI context
 * @param timezone - IANA timezone string (defaults to UTC)
 */
export const getUserCurrentDateTimeString = (timezone: string = 'UTC'): string => {
  try {
    return new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZone: timezone,
      timeZoneName: 'short'
    });
  } catch (e) {
    // Fallback if invalid timezone
    return new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short'
    }) + ` (${timezone})`;
  }
};

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
export const getTomorrowDate = (timezone?: string): string => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  if (timezone) {
    return date.toLocaleDateString('en-CA', { timeZone: timezone });
  }
  return date.toISOString().split('T')[0];
};

/**
 * Get a date N days from now in YYYY-MM-DD format
 * @param days - Number of days to add (can be negative for past dates)
 */
export const getDateNDaysFromNow = (days: number, timezone?: string): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  if (timezone) {
    return date.toLocaleDateString('en-CA', { timeZone: timezone });
  }
  return date.toISOString().split('T')[0];
};

/**
 * Get minimum date for date input (today)
 */
export const getMinDate = (timezone?: string): string => {
  return getCurrentDate(timezone);
};

/**
 * Get maximum date N days from now for date input
 * @param days - Number of days ahead (default 7)
 */
export const getMaxDate = (days: number = 7, timezone?: string): string => {
  return getDateNDaysFromNow(days, timezone);
};

/**
 * Format a date for display (e.g., "Monday, December 29, 2025")
 * @param date - Date object or ISO string
 */
export const formatDateForDisplay = (date: Date | string, timezone?: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: timezone
  });
};

/**
 * Get relative date description (e.g., "2 days ago", "in 3 days")
 * @param date - Date object or ISO string
 */
export const getRelativeDateDescription = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffTime = dateObj.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === -1) return 'yesterday';
  if (diffDays > 1) return `in ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
};

/**
 * Validate if a date string is in the future
 * @param dateString - Date in YYYY-MM-DD format
 */
export const isFutureDate = (dateString: string): boolean => {
  const inputDate = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
};

/**
 * Get the start of today (00:00:00) as a Date object
 */
export const getStartOfToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Generate an array of the next N days
 * @param count - Number of days to generate
 * @returns Array of date objects with metadata
 */
export const generateNextNDays = (count: number = 7, timezone?: string): Array<{
  date: Date;
  dateString: string;
  isToday: boolean;
  posts: any[];
}> => {
  const days = [];
  const today = new Date(); // Use current time
  if (timezone) {
      // If timezone is provided, we need to ensure "today" matches the user's timezone date
      // This is complex because Date object is always UTC or local.
      // We will rely on dateString being correct for the timezone.
  }
  
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    // Format appropriately
    let dateString;
    if (timezone) {
       dateString = date.toLocaleDateString('en-CA', { timeZone: timezone });
    } else {
       dateString = date.toISOString().split('T')[0];
    }

    days.push({
      date,
      dateString,
      isToday: i === 0,
      posts: [],
    });
  }
  
  return days;
};

/**
 * Convert UTC timestamp to user-friendly format
 * @param isoString - ISO 8601 timestamp string
 */
export const formatTimestamp = (isoString: string, timezone?: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone
  });
};
