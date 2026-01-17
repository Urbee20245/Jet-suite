/**
 * Trial Management Helper Functions
 * Centralized utilities for managing user trial periods
 */

export const TRIAL_DURATION_DAYS = 7;

/**
 * Check if a trial is currently active
 */
export function isTrialActive(trialEndDate: string | null): boolean {
  if (!trialEndDate) return false;
  
  const endDate = new Date(trialEndDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return endDate >= today;
}

/**
 * Check if a trial has expired
 */
export function isTrialExpired(trialEndDate: string | null): boolean {
  if (!trialEndDate) return false;
  
  const endDate = new Date(trialEndDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return endDate < today;
}

/**
 * Calculate trial end date from creation date
 */
export function calculateTrialEndDate(createdAt: string): string {
  const created = new Date(createdAt);
  const endDate = new Date(created);
  endDate.setDate(endDate.getDate() + TRIAL_DURATION_DAYS);
  
  return endDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}

/**
 * Format trial end date for display
 */
export function formatTrialEndDate(trialEndDate: string): string {
  const date = new Date(trialEndDate);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Get days remaining in trial
 */
export function getDaysRemainingInTrial(trialEndDate: string | null): number {
  if (!trialEndDate) return 0;
  
  const endDate = new Date(trialEndDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}
