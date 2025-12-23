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
    const { customerId } = req.body;

    // Validate required fields
    if (!customerId) {
      return res.status(400).json({ error: 'Missing required field: customerId' });
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5173';

    // Create Stripe customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/account`,
    });

    return res.status(200).json({
      url: session.url,
    });
  } catch (error: any) {
    console.error('Stripe portal session creation error:', error);
    return res.status(500).json({
      error: 'Failed to create portal session',
      message: error.message,
    });
  }
}
