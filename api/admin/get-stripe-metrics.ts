import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable for Stripe metrics.');
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // This endpoint should be protected in a real application.

  try {
    let mrr = 0;
    let hasMore = true;
    let startingAfter: string | undefined = undefined;

    while (hasMore) {
      const subscriptions: Stripe.ApiList<Stripe.Subscription> = await stripe.subscriptions.list({
        status: 'active',
        limit: 100,
        starting_after: startingAfter,
      });

      subscriptions.data.forEach(sub => {
        sub.items.data.forEach(item => {
          if (item.price.recurring) {
            const amount = item.price.unit_amount || 0;
            const interval = item.price.recurring.interval;
            const intervalCount = item.price.recurring.interval_count || 1;
            
            if (interval === 'month') {
              mrr += (amount * (item.quantity || 1)) / intervalCount;
            } else if (interval === 'year') {
              mrr += (amount * (item.quantity || 1)) / (intervalCount * 12);
            }
          }
        });
      });

      hasMore = subscriptions.has_more;
      if (hasMore) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
      }
    }

    res.status(200).json({ mrr: mrr / 100 }); // Convert from cents to dollars
  } catch (error: any) {
    console.error('Error fetching Stripe metrics:', error);
    res.status(500).json({ error: 'Failed to fetch Stripe metrics', message: error.message });
  }
}