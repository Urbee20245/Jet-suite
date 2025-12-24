/**
 * Subscription Access Control Service
 * Enforces billing rules: only 'active' subscriptions get app access
 */

import { getBillingAccount } from './stripeService';

export type SubscriptionStatus = 
  | 'active'           // ✅ Full access
  | 'trialing'         // ✅ Full access (if you add trials later)
  | 'past_due'         // ❌ Payment failed, show warning
  | 'canceled'         // ❌ Subscription canceled
  | 'unpaid'           // ❌ Payment failed multiple times
  | 'incomplete'       // ❌ Initial payment not completed
  | 'incomplete_expired' // ❌ Initial payment expired
  | 'paused'           // ❌ Subscription paused (future feature)
  | null;              // ❌ No subscription

/**
 * Check if user has access to the application based on subscription status
 * 
 * RULE: Only 'active' or 'trialing' subscriptions get app access
 * All other statuses => locked and redirect to /pricing or /billing
 */
export async function checkSubscriptionAccess(userId: string): Promise<{
  hasAccess: boolean;
  status: SubscriptionStatus;
  reason?: string;
  redirectTo?: string;
}> {
  try {
    const billingAccount = await getBillingAccount(userId);
    
    if (!billingAccount) {
      console.log('[subscriptionService] No billing account found for user:', userId);
      return {
        hasAccess: false,
        status: null,
        reason: 'No active subscription found. Subscribe to access JetSuite tools.',
        redirectTo: '/pricing',
      };
    }
    
    console.log('[subscriptionService] Billing account found:', {
      userId,
      status: billingAccount.subscription_status,
      customerId: billingAccount.stripe_customer_id,
    });
    
    const status = billingAccount.subscription_status as SubscriptionStatus;
        // ✅ ADMIN CHECK: Admins bypass ALL subscription checks
if (billingAccount.is_admin === true) {
  console.log('[subscriptionService] 🔑 ADMIN ACCESS GRANTED:', userId);
  return {
    hasAccess: true,
    status: 'active',
  };
}
    // Only 'active' and 'trialing' statuses grant access
    if (status === 'active' || status === 'trialing') {
      return {
        hasAccess: true,
        status: status,
      };
    }
    
    // All other statuses: deny access
    const accessDeniedReasons: Record<string, { reason: string; redirectTo: string }> = {
      past_due: {
        reason: 'Payment failed. Please update your payment method to continue.',
        redirectTo: '/account', // Redirect to account/billing page
      },
      unpaid: {
        reason: 'Your subscription is unpaid. Please update your payment method.',
        redirectTo: '/account',
      },
      canceled: {
        reason: 'Your subscription has been canceled.',
        redirectTo: '/pricing',
      },
      incomplete: {
        reason: 'Subscription payment incomplete. Please complete checkout.',
        redirectTo: '/pricing',
      },
      incomplete_expired: {
        reason: 'Your checkout session expired. Please subscribe again.',
        redirectTo: '/pricing',
      },
      paused: {
        reason: 'Your subscription is paused.',
        redirectTo: '/account',
      },
    };
    
    const denialInfo = accessDeniedReasons[status || ''] || {
      reason: 'Subscription is not active.',
      redirectTo: '/pricing',
    };
    
    return {
      hasAccess: false,
      status: status,
      ...denialInfo,
    };
  } catch (error) {
    console.error('Error checking subscription access:', error);
    
    // On error, deny access but don't redirect (allow graceful degradation)
    return {
      hasAccess: false,
      status: null,
      reason: 'Unable to verify subscription status. Please try again.',
      redirectTo: '/pricing',
    };
  }
}

/**
 * Get human-readable subscription status label
 */
export function getSubscriptionStatusLabel(status: SubscriptionStatus): string {
  const labels: Record<string, string> = {
    active: '✅ Active',
    trialing: '🎯 Trial Active',
    past_due: '⚠️ Payment Past Due',
    canceled: '❌ Canceled',
    unpaid: '❌ Unpaid',
    incomplete: '⏳ Payment Incomplete',
    incomplete_expired: '❌ Payment Expired',
    paused: '⏸️ Paused',
  };
  
  return labels[status || ''] || '❓ Unknown';
}

/**
 * Get subscription status color for UI display
 */
export function getSubscriptionStatusColor(status: SubscriptionStatus): string {
  const colors: Record<string, string> = {
    active: 'text-green-500',
    trialing: 'text-blue-500',
    past_due: 'text-yellow-500',
    canceled: 'text-red-500',
    unpaid: 'text-red-500',
    incomplete: 'text-gray-500',
    incomplete_expired: 'text-red-500',
    paused: 'text-gray-500',
  };
  
  return colors[status || ''] || 'text-gray-500';
}
