import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    try {
      // 1. Extract the definitive Supabase UUID
      const userId = session.client_reference_id || session.metadata?.user_id;
      
      if (!userId) {
        console.error('[Webhook] Missing client_reference_id (UUID) in session:', session.id);
        return res.status(400).json({ error: 'Missing user identity' });
      }

      // Get subscription details for metadata
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const metadata = subscription.metadata;
      
      const email = session.customer_email!;
      const businessName = metadata.business_name || '';
      const website = metadata.website || '';
      const phone = metadata.phone || '';
      const seatCount = parseInt(metadata.seat_count || '0');
      const businessCount = parseInt(metadata.business_count || '1');

      // 2. Link the Stripe Customer to the existing Supabase User in billing_accounts
      // We use upsert on user_id to ensure we update if exists or create if missing
      const { error: billingError } = await supabase
        .from('billing_accounts')
        .upsert({
          user_id: userId,
          user_email: email, // informational only
          subscription_status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          seat_count: seatCount,
          business_count: businessCount,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (billingError) {
        console.error('[Webhook] Failed to upsert billing account:', billingError);
        throw billingError;
      }

      // 3. Update or create business profile for this UUID
      const { error: profileError } = await supabase
        .from('business_profiles')
        .upsert({
          user_id: userId,
          business_name: businessName,
          website_url: website,
          phone: phone,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (profileError) {
        console.error('[Webhook] Failed to update business profile:', profileError);
      }
      
      console.log(`[Webhook] Subscription successfully linked to UUID: ${userId}`);
      
    } catch (error: any) {
      console.error('[Webhook] Error processing checkout.session.completed:', error);
    }
  }

  // Handle subscription updates
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    
    try {
      const { error } = await supabase
        .from('billing_accounts')
        .update({
          subscription_status: subscription.status,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Failed to update subscription status:', error);
      }
    } catch (error) {
      console.error('Error processing customer.subscription.updated:', error);
    }
  }

  // Handle subscription cancellation
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    
    try {
      const { error } = await supabase
        .from('billing_accounts')
        .update({
          subscription_status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Failed to update subscription to canceled:', error);
      }
    } catch (error) {
      console.error('Error processing customer.subscription.deleted:', error);
    }
  }

  return res.status(200).json({ received: true });
}