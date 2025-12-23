/**
 * Stripe Price Configuration
 * 
 * Centralized configuration for all Stripe price IDs.
 * All price IDs are read exclusively from environment variables.
 * 
 * This allows future price changes by updating environment variables only,
 * without code changes or subscription migration.
 * 
 * Environment Variables Required:
 * - STRIPE_PRICE_BASE_149: Base plan price ID ($149/mo)
 * - STRIPE_PRICE_BUSINESS_49: Additional business price ID ($49/mo)
 * - STRIPE_PRICE_SEAT_15: Team seat price ID ($15/mo)
 * 
 * Usage:
 * ```typescript
 * import { STRIPE_PRICES } from './config/stripePrices';
 * 
 * const basePriceId = STRIPE_PRICES.BASE_PRICE_ID;
 * ```
 */

// Server-side environment variable access
const getServerEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

/**
 * Stripe Price IDs
 * 
 * These are read from environment variables and should NEVER be hard-coded.
 * If a price ID is missing, it will throw an error to prevent misconfiguration.
 */
export const STRIPE_PRICES = {
  /**
   * Base Plan Price ID
   * Default: $149/month
   * Includes: 1 business profile, 1 user seat, all tools
   */
  BASE_PRICE_ID: getServerEnv('STRIPE_PRICE_BASE_149') || '',
  
  /**
   * Additional Business Profile Price ID
   * Default: $49/month per additional business
   */
  BUSINESS_ADDON_PRICE_ID: getServerEnv('STRIPE_PRICE_BUSINESS_49') || '',
  
  /**
   * Team Seat Price ID
   * Default: $15/month per seat
   */
  SEAT_PRICE_ID: getServerEnv('STRIPE_PRICE_SEAT_15') || '',
} as const;

/**
 * Validate that all required price IDs are configured
 * 
 * This should be called during application startup to ensure
 * all environment variables are properly set.
 * 
 * @throws Error if any required price ID is missing
 */
export function validateStripePrices(): void {
  const missing: string[] = [];
  
  if (!STRIPE_PRICES.BASE_PRICE_ID) {
    missing.push('STRIPE_PRICE_BASE_149');
  }
  
  if (!STRIPE_PRICES.BUSINESS_ADDON_PRICE_ID) {
    missing.push('STRIPE_PRICE_BUSINESS_49');
  }
  
  if (!STRIPE_PRICES.SEAT_PRICE_ID) {
    missing.push('STRIPE_PRICE_SEAT_15');
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required Stripe price ID environment variables: ${missing.join(', ')}\n` +
      'Please ensure all price IDs are configured in your environment variables.'
    );
  }
}

/**
 * Get all price IDs as an object
 * 
 * Useful for debugging or logging purposes
 */
export function getStripePriceConfig(): Record<string, string> {
  return {
    BASE_PRICE_ID: STRIPE_PRICES.BASE_PRICE_ID,
    BUSINESS_ADDON_PRICE_ID: STRIPE_PRICES.BUSINESS_ADDON_PRICE_ID,
    SEAT_PRICE_ID: STRIPE_PRICES.SEAT_PRICE_ID,
  };
}

/**
 * Check if all price IDs are configured
 * 
 * Returns true if all required price IDs are set, false otherwise
 */
export function areStripePricesConfigured(): boolean {
  return !!(
    STRIPE_PRICES.BASE_PRICE_ID &&
    STRIPE_PRICES.BUSINESS_ADDON_PRICE_ID &&
    STRIPE_PRICES.SEAT_PRICE_ID
  );
}

// Export individual constants for convenience
export const BASE_PRICE_ID = STRIPE_PRICES.BASE_PRICE_ID;
export const BUSINESS_ADDON_PRICE_ID = STRIPE_PRICES.BUSINESS_ADDON_PRICE_ID;
export const SEAT_PRICE_ID = STRIPE_PRICES.SEAT_PRICE_ID;
