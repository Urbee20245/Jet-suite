import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      email, 
      seatCount = 0, 
      additionalBusinessCount = 0,
      metadata = {}
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const basePriceId = process.env.STRIPE_PRICE_BASE_149!;
    const additionalBusinessPriceId = process.env.STRIPE_PRICE_BUSINESS_49!;
    const seatPriceId = process.env.STRIPE_PRICE_SEAT_15!;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: basePriceId,
          quantity: 1,
        },
        ...(additionalBusinessCount > 0 ? [{
          price: additionalBusinessPriceId,
          quantity: additionalBusinessCount,
        }] : []),
        ...(seatCount > 0 ? [{
          price: seatPriceId,
          quantity: seatCount,
        }] : []),
      ],
      subscription_data: {
        // NO trial period - immediate charge
        metadata: {
          seat_count: seatCount.toString(),
          business_count: (additionalBusinessCount + 1).toString(),
          first_name: metadata.firstName || '',
          last_name: metadata.lastName || '',
          business_name: metadata.businessName || '',
          phone: metadata.phone || '',
          website: metadata.website || '',
          // Email will be in customer_email, no need to duplicate
        },
      },
      success_url: `${process.env.APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/get-started`,
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('Stripe checkout session error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
}
