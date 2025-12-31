import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;

let ai: GoogleGenAI | null = null;
try {
  if (GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  } else {
    console.warn('GEMINI_API_KEY not set - will use system time for real time sync.');
  }
} catch (e) {
  console.error('Failed to initialize Gemini client for real time sync:', e);
}

let cachedRealDate: Date | null = null;
let cacheExpiry: number = 0;

/**
 * Get ACTUAL current date/time using Gemini with Google Search
 */
export const fetchRealDateTime = async (): Promise<Date> => {
  // Return cached if less than 5 minutes old
  if (cachedRealDate && Date.now() < cacheExpiry) {
    const elapsed = Date.now() - (cacheExpiry - 300000);
    return new Date(cachedRealDate.getTime() + elapsed);
  }

  if (!ai) {
    return new Date();
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: 'What is the current date and time right now in ISO 8601 format? Use Google Search to get the accurate current date and time. Respond with ONLY the ISO timestamp, nothing else.',
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0,
      }
    });

    const timestamp = response.text.trim();
    const realDate = new Date(timestamp);
    
    // Validate it's a valid date
    if (isNaN(realDate.getTime())) {
      throw new Error('Invalid date from Gemini');
    }

    // Cache for 5 minutes
    cachedRealDate = realDate;
    cacheExpiry = Date.now() + 300000;
    
    console.log('Real current date from Gemini:', timestamp);
    return realDate;
    
  } catch (error) {
    console.error('Failed to get real date from Gemini, falling back to system time:', error);
    return new Date();
  }
};

/**
 * Get real current time synchronously (uses cache or system time)
 */
export const getRealTimeSync = (): Date => {
  if (cachedRealDate && Date.now() < cacheExpiry) {
    const elapsed = Date.now() - (cacheExpiry - 300000);
    return new Date(cachedRealDate.getTime() + elapsed);
  }
  return new Date();
};

/**
 * Get user's timezone (from browser)
 */
export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'America/New_York'; // Default fallback
  }
};

/**
 * Format date in user's local timezone
 */
export const formatInUserTimezone = (date: Date): string => {
  const timezone = getUserTimezone();
  return date.toLocaleString('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
};