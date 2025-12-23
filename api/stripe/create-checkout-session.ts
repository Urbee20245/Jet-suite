import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, email, userId, mode = 'subscription' } = req.body;

    // Validate required fields
    if (!priceId) {
      return res.status(400).json({ error: 'Missing required field: priceId' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Missing required field: email' });
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5173';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: mode as 'subscription' | 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        userId: userId || '',
      },
      success_url: `${appUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${appUrl}?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      // Automatically create customer for future billing portal access
      customer_creation: 'always',
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Stripe checkout session creation error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
}
