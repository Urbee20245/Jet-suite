import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      email,
      seatCount = 0,
      additionalBusinessCount = 0,
      isFounder = true, // ← TEMP: trusted for now
      metadata = {},
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Select correct price set
    const basePriceId = isFounder
      ? process.env.STRIPE_PRICE_BASE_FOUNDER
      : process.env.STRIPE_PRICE_BASE_STANDARD;

    const additionalBusinessPriceId = isFounder
      ? process.env.STRIPE_PRICE_BUSINESS_FOUNDER
      : process.env.STRIPE_PRICE_BUSINESS_STANDARD;

    const seatPriceId = isFounder
      ? process.env.STRIPE_PRICE_SEAT_FOUNDER
      : process.env.STRIPE_PRICE_SEAT_STANDARD;

    // Defensive checks (PREVENTS Stripe line_items[*] error)
    if (!basePriceId) {
      throw new Error('Missing Stripe base price env var');
    }
    if (additionalBusinessCount > 0 && !additionalBusinessPriceId) {
      throw new Error('Missing Stripe additional business price env var');
    }
    if (seatCount > 0 && !seatPriceId) {
      throw new Error('Missing Stripe seat price env var');
    }

    // Build line items safely (NO zero quantities)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: basePriceId,
        quantity: 1,
      },
    ];

    if (additionalBusinessCount > 0) {
      lineItems.push({
        price: additionalBusinessPriceId!,
        quantity: additionalBusinessCount,
      });
    }

    if (seatCount > 0) {
      lineItems.push({
        price: seatPriceId!,
        quantity: seatCount,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      payment_method_types: ['card'],
      allow_promotion_codes: true, // coupons enabled
      line_items: lineItems,
      subscription_data: {
        metadata: {
          seat_count: String(seatCount),
          business_count: String(additionalBusinessCount + 1),
          first_name: metadata.firstName || '',
          last_name: metadata.lastName || '',
          business_name: metadata.businessName || '',
          phone: metadata.phone || '',
          website: metadata.website || '',
          pricing_tier: isFounder ? 'founder' : 'standard',
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
