import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Server-side client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface UpsertBillingAccountRequest {
  userId: string;
  userEmail: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  seatCount?: number;
  businessCount?: number;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      userId,
      userEmail,
      stripeCustomerId,
      stripeSubscriptionId,
      subscriptionStatus,
      subscriptionPlan,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      seatCount,
      businessCount,
    } = req.body as UpsertBillingAccountRequest;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId' });
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'Missing required field: userEmail' });
    }

    // Build the upsert data
    const billingData: any = {
      user_id: userId,
      user_email: userEmail,
    };

    // Only include fields that are provided
    if (stripeCustomerId !== undefined) billingData.stripe_customer_id = stripeCustomerId;
    if (stripeSubscriptionId !== undefined) billingData.stripe_subscription_id = stripeSubscriptionId;
    if (subscriptionStatus !== undefined) billingData.subscription_status = subscriptionStatus;
    if (subscriptionPlan !== undefined) billingData.subscription_plan = subscriptionPlan;
    if (currentPeriodStart !== undefined) billingData.current_period_start = currentPeriodStart;
    if (currentPeriodEnd !== undefined) billingData.current_period_end = currentPeriodEnd;
    if (cancelAtPeriodEnd !== undefined) billingData.cancel_at_period_end = cancelAtPeriodEnd;
    if (seatCount !== undefined) billingData.seat_count = seatCount;
    if (businessCount !== undefined) billingData.business_count = businessCount;

    // Upsert billing account (insert or update)
    const { data, error } = await supabase
      .from('billing_accounts')
      .upsert(billingData, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({ billingAccount: data });
  } catch (error: any) {
    console.error('Upsert billing account error:', error);
    return res.status(500).json({
      error: 'Failed to upsert billing account',
      message: error.message,
    });
  }
}
