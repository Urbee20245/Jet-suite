/**
 * Date and Time Utilities for JetSuite
 * Ensures consistent date/time handling across all timezone considerations
 */

// Add real-time sync import and getNow helper
import { getRealCurrentTimeSync } from './getCurrentTime';

const getNow = (): Date => {
  return getRealCurrentTimeSync();
};

/**
 * Get the current date and time in ISO format
 * This always returns the actual current UTC time
 */
export const getCurrentDateTime = (): string => {
  return getNow().toISOString();
};

/**
 * Get current date in YYYY-MM-DD format
 * Uses UTC to ensure consistency across all timezones
 */
export const getCurrentDate = (): string => {
  const now = getNow();
  return now.toISOString().split('T')[0];
};

/**
 * Get the current month and year (e.g., "January 2025")
 * Used for display purposes and prompts
 */
export const getCurrentMonthYear = (): string => {
  const now = getNow();
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

/**
 * Get the current year
 */
export const getCurrentYear = (): number => {
  return getNow().getFullYear();
};

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
export const getTomorrowDate = (): string => {
  const tomorrow = getNow();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

/**
 * Get a date N days from now in YYYY-MM-DD format
 * @param days - Number of days to add (can be negative for past dates)
 */
export const getDateNDaysFromNow = (days: number): string => {
  const date = getNow();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

/**
 * Get minimum date for date input (today)
 */
export const getMinDate = (): string => {
  return getCurrentDate();
};

/**
 * Get maximum date N days from now for date input
 * @param days - Number of days ahead (default 7)
 */
export const getMaxDate = (days: number = 7): string => {
  return getDateNDaysFromNow(days);
};

/**
 * Format a date for display (e.g., "Monday, December 29, 2025")
 * @param date - Date object or ISO string
 */
export const formatDateForDisplay = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

/**
 * Get relative date description (e.g., "2 days ago", "in 3 days")
 * @param date - Date object or ISO string
 */
export const getRelativeDateDescription = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = getNow();
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
  const today = getNow();
  today.setHours(0, 0, 0, 0);
  const inputDate = new Date(dateString + 'T00:00:00');
  return inputDate >= today;
};

/**
 * Get the start of today (00:00:00) as a Date object
 */
export const getStartOfToday = (): Date => {
  const today = getNow();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Generate an array of the next N days
 * @param count - Number of days to generate
 * @returns Array of date objects with metadata
 */
export const generateNextNDays = (count: number = 7): Array<{
  date: Date;
  dateString: string;
  isToday: boolean;
  posts: any[];
}> => {
  const days = [];
  const today = getStartOfToday();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    days.push({
      date,
      dateString: date.toISOString().split('T')[0],
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
export const formatTimestamp = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get user's detected timezone
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Format date in user's local timezone
 * @param date - Date object or ISO string
 * @param userTimezone - Optional timezone override (defaults to browser timezone)
 */
export const formatInUserTimezone = (
  date: Date | string,
  userTimezone?: string
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const tz = userTimezone || getUserTimezone();
  
  return dateObj.toLocaleString('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
};

/**
 * Get complete date/time context for AI prompts
 * This ensures all AI tools know the ACTUAL current date/time
 */
export const getAIDateTimeContext = (): string => {
  const now = new Date();
  const timezone = getUserTimezone();
  
  return `CURRENT DATE & TIME CONTEXT:
- Current Date: ${formatDateForDisplay(now)}
- Current Time: ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
- Current Year: ${now.getFullYear()}
- Current Month: ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
- User Timezone: ${timezone}
- ISO Timestamp: ${now.toISOString()}

IMPORTANT: When generating content, use the above current date/time. Do not reference outdated dates.`;
};

/**
 * Get short AI context (for token efficiency)
 */
export const getAIDateTimeContextShort = (): string => {
  const now = new Date();
  return `Current date: ${formatDateForDisplay(now)}. Current year: ${now.getFullYear()}.`;
};