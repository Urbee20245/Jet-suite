/**
 * Stripe Integration Service
 * Client-side helpers for interacting with Stripe API endpoints
 */

interface CreateCheckoutSessionParams {
  /** MUST be the Supabase Auth UUID, not an email address. */
  userId: string;
  email: string;
  seatCount?: number;
  additionalBusinessCount?: number;
  workspaceId?: string;
}

interface CreateCheckoutSessionResponse {
  url: string;
  sessionId: string;
}

interface CreatePortalSessionResponse {
  url: string;
}

/**
 * Create a Stripe Checkout session and redirect user to payment
 * 
 * @param params - Subscription details including userId, email, seat count, and additional business profiles
 * @returns Promise with checkout URL
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CreateCheckoutSessionResponse> {
  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: params.userId,
        email: params.email,
        seatCount: params.seatCount || 0,
        additionalBusinessCount: params.additionalBusinessCount || 0,
        workspaceId: params.workspaceId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Stripe checkout session error:', error);
    throw error;
  }
}

/**
 * Create a Stripe Customer Portal session for managing subscription
 * 
 * @param customerId - Stripe customer ID
 * @returns Promise with portal URL
 */
export async function createPortalSession(
  customerId: string
): Promise<CreatePortalSessionResponse> {
  try {
    const response = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create portal session');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Stripe portal session error:', error);
    throw error;
  }
}

/**
 * Get billing account information for a user
 * 
 * @param userId - MUST be the Supabase Auth UUID (not email)
 * @returns Promise with billing account data
 */
export async function getBillingAccount(userId: string) {
  try {
    const response = await fetch(`/api/billing/get-account?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch billing account');
    }

    const data = await response.json();
    return data.account;
  } catch (error: any) {
    console.error('Get billing account error:', error);
    throw error;
  }
}