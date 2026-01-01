import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Check for required environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing required environment variables for Stripe webhook setup.');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature']!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    try {
      const userId = session.client_reference_id || session.metadata?.user_id;
      
      if (!userId) {
        console.error('[Webhook] Missing identity in session:', session.id);
        return res.status(200).json({ received: true });
      }

      // Safe subscription retrieval
      let subscription;
      try {
        subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      } catch (err) {
        console.error('[Webhook] Failed to retrieve subscription:', session.subscription);
        return res.status(200).json({ received: true });
      }

      const metadata = subscription.metadata;
      const email = session.customer_email || session.metadata?.email || '';
      const businessName = metadata.business_name || '';
      const website = metadata.website || '';
      const phone = metadata.phone || '';
      const seatCount = parseInt(metadata.seat_count || '0');
      const businessCount = parseInt(metadata.business_count || '1');

      // Check if we need to cancel a previous subscription (from upgrade flow)
      if (metadata.previous_subscription_id) {
        try {
          await stripe.subscriptions.cancel(metadata.previous_subscription_id);
          console.log('[Webhook] Cancelled previous subscription:', metadata.previous_subscription_id);
        } catch (err) {
          console.warn('[Webhook] Failed to cancel old sub during upgrade (already cancelled?):', metadata.previous_subscription_id);
        }
      }

      const { error: billingError } = await supabase
        .from('billing_accounts')
        .upsert({
          user_id: userId,
          user_email: email,
          subscription_status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          seat_count: seatCount,
          business_count: businessCount,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (billingError) throw billingError;

      await supabase
        .from('business_profiles')
        .upsert({
          user_id: userId,
          business_name: businessName,
          website_url: website,
          phone: phone,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      
    } catch (error: any) {
      console.error('[Webhook] Error processing checkout:', error);
    }
  }

  // Sync other status changes
  if (['customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
    const subscription = event.data.object as Stripe.Subscription;
    try {
      await supabase
        .from('billing_accounts')
        .update({
          subscription_status: subscription.status,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);
    } catch (error) {
      console.error('[Webhook] Error syncing status:', error);
    }
  }

  return res.status(200).json({ received: true });
}