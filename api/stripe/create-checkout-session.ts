import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Check for required environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables for Stripe checkout setup.');
}

const stripe = new Stripe(STRIPE_SECRET_KEY);
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      userId, // Supabase UUID (optional)
      email,
      seatCount = 0,
      additionalBusinessCount = 0,
      isFounder = true,
      isNewUser = false, // NEW: Flag indicating if user is unauthenticated
      metadata = {},
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // 1. DEDUPLICATION: Check for existing customer ID only if user is authenticated
    let account: { stripe_customer_id: string | null } | null = null;
    if (userId) {
        const { data: existingAccount } = await supabase
            .from('billing_accounts')
            .select('stripe_customer_id')
            .eq('user_id', userId)
            .single();
        account = existingAccount;
    }

    // Select correct price set
    const basePriceId = isFounder
      ? process.env.STRIPE_PRICE_FOUNDER_BASE
      : process.env.STRIPE_PRICE_BASE_149;

    const additionalBusinessPriceId = isFounder
      ? process.env.STRIPE_PRICE_FOUNDER_BUSINESS
      : process.env.STRIPE_PRICE_BUSINESS_49;

    const seatPriceId = isFounder
      ? process.env.STRIPE_PRICE_FOUNDER_SEAT
      : process.env.STRIPE_PRICE_SEAT_15;

    if (!basePriceId) {
      throw new Error(`Missing Stripe base price env var for ${isFounder ? 'founder' : 'standard'} tier`);
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: basePriceId,
        quantity: 1,
      },
    ];

    if (additionalBusinessCount > 0 && additionalBusinessPriceId) {
      lineItems.push({
        price: additionalBusinessPriceId,
        quantity: additionalBusinessCount,
      });
    }

    if (seatCount > 0 && seatPriceId) {
      lineItems.push({
        price: seatPriceId,
        quantity: seatCount,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      // 2. Use existing customer if available, otherwise use email to create/link
      ...(account?.stripe_customer_id 
        ? { customer: account.stripe_customer_id } 
        : { customer_email: email }),
      
      // Only include client_reference_id if userId is present (authenticated user)
      ...(userId ? { client_reference_id: userId } : {}),
      
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      line_items: lineItems,
      metadata: {
        user_id: userId || 'unauthenticated', // Pass user ID or placeholder
        is_new_user: String(isNewUser), // NEW
        email: email, // Always include email
      },
      subscription_data: {
        metadata: {
          user_id: userId || 'unauthenticated',
          seat_count: String(seatCount),
          business_count: String(additionalBusinessCount + 1),
          first_name: metadata.firstName || '',
          last_name: metadata.lastName || '',
          business_name: metadata.businessName || '',
          phone: metadata.phone || '',
          website: metadata.website || '',
          pricing_tier: isFounder ? 'founder' : 'standard',
          is_new_user: String(isNewUser), // NEW
          email: email, // Always include email
        },
      },
      success_url: `${process.env.APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/get-started`,
    });

    return res.status(200).json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('[Stripe Checkout Error]', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
}