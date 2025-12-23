import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getPriceIds, validateStripePrices, areFounderPricesConfigured } from '../../config/stripePrices';

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

    // Validate Stripe price IDs are configured
    try {
      validateStripePrices();
    } catch (error: any) {
      console.error('Stripe price configuration error:', error.message);
      return res.status(500).json({ 
        error: 'Server configuration error: Missing Stripe price IDs',
        details: error.message,
      });
    }

    // Check if user already has a billing account and get founder status
    let customerId: string | null = null;
    let isFounder: boolean = false;
    let existingSubscription: boolean = false;
    
    try {
      const { data: billingAccount } = await supabase
        .from('billing_accounts')
        .select('stripe_customer_id, stripe_subscription_id, is_founder')
        .eq('user_id', userId)
        .single();
      
      if (billingAccount) {
        customerId = billingAccount.stripe_customer_id || null;
        isFounder = billingAccount.is_founder || false;
        existingSubscription = !!billingAccount.stripe_subscription_id;
        
        console.log('Found existing billing account:', {
          customerId,
          isFounder,
          hasSubscription: existingSubscription,
        });
      }
    } catch (error) {
      // No billing account yet, will create new customer
      console.log('No existing billing account found, will create new customer');
    }

    // Prevent creating a second subscription if one already exists
    if (existingSubscription) {
      return res.status(400).json({
        error: 'Active subscription already exists',
        message: 'This account already has an active subscription. Please manage it from your account page.',
      });
    }

    // Get appropriate price IDs based on founder status
    // Founder pricing is lifetime-locked once set
    const priceIds = getPriceIds(isFounder);
    const basePriceId = priceIds.BASE_PRICE_ID;
    const businessPriceId = priceIds.BUSINESS_ADDON_PRICE_ID;
    const seatPriceId = priceIds.SEAT_PRICE_ID;

    // Log pricing tier being used
    console.log('Using pricing tier:', {
      tier: isFounder ? 'founder' : 'standard',
      founderPricesAvailable: areFounderPricesConfigured(),
      basePriceId,
    });

    // If no customer exists, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          userId: userId,
          workspaceId: workspaceId || '',
          isFounder: isFounder.toString(),
        },
      });
      customerId = customer.id;

      // Store customer ID in billing_accounts with founder flag
      await supabase
        .from('billing_accounts')
        .upsert({
          user_id: userId,
          user_email: email,
          stripe_customer_id: customerId,
          is_founder: isFounder, // Lifetime-locked once set
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
        isFounder: isFounder.toString(), // Track pricing tier
        pricingTier: isFounder ? 'founder' : 'standard',
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
          isFounder: isFounder.toString(),
          pricingTier: isFounder ? 'founder' : 'standard',
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
