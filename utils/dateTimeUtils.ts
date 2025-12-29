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
 * Uses UTC to ensure consistency across all timezones
 */
export const getCurrentDate = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

/**
 * Get the current month and year (e.g., "January 2025")
 * Used for display purposes and prompts
 */
export const getCurrentMonthYear = (): string => {
  const now = new Date();
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

/**
 * Get the current year
 */
export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
export const getTomorrowDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

/**
 * Get a date N days from now in YYYY-MM-DD format
 * @param days - Number of days to add (can be negative for past dates)
 */
export const getDateNDaysFromNow = (days: number): string => {
  const date = new Date();
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
