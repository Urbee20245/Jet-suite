/**
 * Get ACTUAL current date/time from reliable source
 * This bypasses system clock issues in sandboxed environments
 */

let cachedTime: Date | null = null;
let cacheExpiry: number = 0;

export const getRealCurrentTime = async (): Promise<Date> => {
  // Cache for 1 minute to avoid excessive API calls
  if (cachedTime && Date.now() < cacheExpiry) {
    const elapsed = Date.now() - (cacheExpiry - 60000);
    return new Date(cachedTime.getTime() + elapsed);
  }

  try {
    // Use World Time API to get actual current time
    const response = await fetch('https://worldtimeapi.org/api/timezone/America/New_York');
    const data = await response.json();
    
    cachedTime = new Date(data.datetime);
    cacheExpiry = Date.now() + 60000; // Cache for 1 minute
    
    return cachedTime;
  } catch (error) {
    console.warn('Failed to fetch real time, using system time:', error);
    return new Date();
  }
};

/**
 * Synchronous version - uses cached time or system time
 */
export const getRealCurrentTimeSync = (): Date => {
  if (cachedTime && Date.now() < cacheExpiry) {
    const elapsed = Date.now() - (cacheExpiry - 60000);
    return new Date(cachedTime.getTime() + elapsed);
  }
  
  // Fallback to system time if no cache
  return new Date();
};

/**
 * Initialize - call this once at app startup
 */
export const initializeRealTime = async (): Promise<void> => {
  await getRealCurrentTime();
};