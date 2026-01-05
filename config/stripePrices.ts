/**
 * Stripe Price Configuration
 * 
 * Centralized configuration for all Stripe price IDs.
 * All price IDs are read exclusively from environment variables.
 * 
 * This allows future price changes by updating environment variables only,
 * without code changes or subscription migration.
 * 
 * FOUNDER PRICING:
 * Supports both standard and founder pricing variants.
 * If user has is_founder flag set, automatically uses founder price IDs.
 * Founder pricing is lifetime-locked once a subscription is created.
 * 
 * Environment Variables Required:
 * 
 * Standard Pricing:
 * - STRIPE_PRICE_BASE_STANDARD: Base plan price ID ($149/mo)
 * - STRIPE_PRICE_BUSINESS_STANDARD: Additional business price ID ($49/mo)
 * - STRIPE_PRICE_SEAT_STANDARD: Team seat price ID ($15/mo)
 * 
 * Founder Pricing (optional - if not set, falls back to standard):
 * - STRIPE_PRICE_BASE_FOUNDER: Founder base plan price ID
 * - STRIPE_PRICE_BUSINESS_FOUNDER: Founder additional business price ID
 * - STRIPE_PRICE_SEAT_FOUNDER: Founder team seat price ID
 * 
 * Usage:
 * ```typescript
 * import { getPriceIds } from './config/stripePrices';
 * 
 * const priceIds = getPriceIds(isFounder);
 * const basePriceId = priceIds.BASE_PRICE_ID;
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
 * Standard Stripe Price IDs
 * 
 * These are read from environment variables and should NEVER be hard-coded.
 * If a price ID is missing, it will throw an error to prevent misconfiguration.
 */
export const STANDARD_PRICES = {
  /**
   * Base Plan Price ID
   * Default: $149/month
   * Includes: 1 business profile, 1 user seat, all tools
   */
  BASE_PRICE_ID: getServerEnv('STRIPE_PRICE_BASE_STANDARD') || '',
  
  /**
   * Additional Business Profile Price ID
   * Default: $49/month per additional business
   */
  BUSINESS_ADDON_PRICE_ID: getServerEnv('STRIPE_PRICE_BUSINESS_STANDARD') || '',
  
  /**
   * Team Seat Price ID
   * Default: $15/month per seat
   */
  SEAT_PRICE_ID: getServerEnv('STRIPE_PRICE_SEAT_STANDARD') || '',
} as const;

/**
 * Founder Stripe Price IDs (optional)
 * 
 * If not configured, system will fall back to standard pricing.
 * Founder pricing is lifetime-locked once a subscription is created.
 */
export const FOUNDER_PRICES = {
  /**
   * Founder Base Plan Price ID
   * Special founder pricing (set in Stripe Dashboard)
   */
  BASE_PRICE_ID: getServerEnv('STRIPE_PRICE_BASE_FOUNDER') || '',
  
  /**
   * Founder Additional Business Profile Price ID
   */
  BUSINESS_ADDON_PRICE_ID: getServerEnv('STRIPE_PRICE_BUSINESS_FOUNDER') || '',
  
  /**
   * Founder Team Seat Price ID
   */
  SEAT_PRICE_ID: getServerEnv('STRIPE_PRICE_SEAT_FOUNDER') || '',
} as const;

/**
 * Get price IDs based on founder status
 * 
 * @param isFounder - Whether the user has founder pricing
 * @returns Price IDs for the appropriate tier
 */
export function getPriceIds(isFounder: boolean) {
  if (isFounder && areFounderPricesConfigured()) {
    return FOUNDER_PRICES;
  }
  return STANDARD_PRICES;
}

// Backward compatibility exports (use standard prices)
export const STRIPE_PRICES = STANDARD_PRICES;
export const BASE_PRICE_ID = STANDARD_PRICES.BASE_PRICE_ID;
export const BUSINESS_ADDON_PRICE_ID = STANDARD_PRICES.BUSINESS_ADDON_PRICE_ID;
export const SEAT_PRICE_ID = STANDARD_PRICES.SEAT_PRICE_ID;

/**
 * Validate that all required standard price IDs are configured
 * 
 * This should be called during application startup to ensure
 * all environment variables are properly set.
 * 
 * @throws Error if any required price ID is missing
 */
export function validateStripePrices(): void {
  const missing: string[] = [];
  
  if (!STANDARD_PRICES.BASE_PRICE_ID) {
    missing.push('STRIPE_PRICE_BASE_STANDARD');
  }
  
  if (!STANDARD_PRICES.BUSINESS_ADDON_PRICE_ID) {
    missing.push('STRIPE_PRICE_BUSINESS_STANDARD');
  }
  
  if (!STANDARD_PRICES.SEAT_PRICE_ID) {
    missing.push('STRIPE_PRICE_SEAT_STANDARD');
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required Stripe price ID environment variables: ${missing.join(', ')}\n` +
      'Please ensure all price IDs are configured in your environment variables.'
    );
  }
}

/**
 * Check if founder prices are configured
 * 
 * Returns true if all founder price IDs are set, false otherwise
 */
export function areFounderPricesConfigured(): boolean {
  return !!(
    FOUNDER_PRICES.BASE_PRICE_ID &&
    FOUNDER_PRICES.BUSINESS_ADDON_PRICE_ID &&
    FOUNDER_PRICES.SEAT_PRICE_ID
  );
}

/**
 * Get all price IDs as an object (for debugging)
 * 
 * @param isFounder - Whether to get founder or standard prices
 */
export function getStripePriceConfig(isFounder: boolean = false): Record<string, string> {
  const prices = getPriceIds(isFounder);
  return {
    BASE_PRICE_ID: prices.BASE_PRICE_ID,
    BUSINESS_ADDON_PRICE_ID: prices.BUSINESS_ADDON_PRICE_ID,
    SEAT_PRICE_ID: prices.SEAT_PRICE_ID,
    tier: isFounder ? 'founder' : 'standard',
  };
}

/**
 * Check if all standard price IDs are configured
 * 
 * Returns true if all required price IDs are set, false otherwise
 */
export function areStripePricesConfigured(): boolean {
  return !!(
    STANDARD_PRICES.BASE_PRICE_ID &&
    STANDARD_PRICES.BUSINESS_ADDON_PRICE_ID &&
    STANDARD_PRICES.SEAT_PRICE_ID
  );
}