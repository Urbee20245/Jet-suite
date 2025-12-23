import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      email, 
      seatCount = 0, 
      additionalBusinessCount = 0,
      workspaceId 
    } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Missing required field: email' });
    }

    // Validate counts are non-negative
    if (seatCount < 0 || additionalBusinessCount < 0) {
      return res.status(400).json({ error: 'Seat count and business count must be non-negative' });
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5173';

    // Get Stripe price IDs from environment
    const basePriceId = process.env.STRIPE_PRICE_BASE_149;
    const businessPriceId = process.env.STRIPE_PRICE_BUSINESS_49;
    const seatPriceId = process.env.STRIPE_PRICE_SEAT_15;

    if (!basePriceId || !businessPriceId || !seatPriceId) {
      return res.status(500).json({ 
        error: 'Server configuration error: Missing Stripe price IDs' 
      });
    }

    // Check if user already has a Stripe customer ID
    let customerId: string | null = null;
    
    try {
      const { data: billingAccount } = await supabase
        .from('billing_accounts')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();
      
      customerId = billingAccount?.stripe_customer_id || null;
    } catch (error) {
      // No billing account yet, will create new customer
      console.log('No existing billing account found, will create new customer');
    }

    // If no customer exists, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          userId: userId,
          workspaceId: workspaceId || '',
        },
      });
      customerId = customer.id;

      // Store customer ID in billing_accounts
      await supabase
        .from('billing_accounts')
        .upsert({
          user_id: userId,
          user_email: email,
          stripe_customer_id: customerId,
        }, {
          onConflict: 'user_id',
        });
    }

    // Build line items dynamically
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: basePriceId,
        quantity: 1, // Base plan is always 1
      },
    ];

    // Add additional business profiles if requested
    if (additionalBusinessCount > 0) {
      lineItems.push({
        price: businessPriceId,
        quantity: additionalBusinessCount,
      });
    }

    // Add team seats if requested
    if (seatCount > 0) {
      lineItems.push({
        price: seatPriceId,
        quantity: seatCount,
      });
    }

    // Create Stripe checkout session with existing or new customer
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer: customerId,
      metadata: {
        userId: userId,
        workspaceId: workspaceId || '',
        seatCount: seatCount.toString(),
        additionalBusinessCount: additionalBusinessCount.toString(),
      },
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      subscription_data: {
        metadata: {
          userId: userId,
          workspaceId: workspaceId || '',
          seatCount: seatCount.toString(),
          additionalBusinessCount: additionalBusinessCount.toString(),
        },
      },
    });

    return res.status(200).json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Stripe checkout session creation error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
}
