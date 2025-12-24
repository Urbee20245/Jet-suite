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
      // Get subscription metadata
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const metadata = subscription.metadata;
      
      const email = session.customer_email!;
      const firstName = metadata.first_name || '';
      const lastName = metadata.last_name || '';
      const businessName = metadata.business_name || '';
      const phone = metadata.phone || '';
      const website = metadata.website || '';
      const seatCount = parseInt(metadata.seat_count || '0');
      const businessCount = parseInt(metadata.business_count || '1');

      // 1. Create auth user in Supabase
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'; // Random temp password
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          business_name: businessName,
        }
      });

      if (authError) {
        console.error('Failed to create auth user:', authError);
        throw authError;
      }

      const userId = authData.user.id;

      // 2. Create billing account record
      const { error: billingError } = await supabase
        .from('billing_accounts')
        .insert({
          user_id: userId,
          user_email: email,
          subscription_status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          seat_count: seatCount,
          business_count: businessCount,
          is_admin: false, // Regular customer
        });

      if (billingError) {
        console.error('Failed to create billing account:', billingError);
        throw billingError;
      }

      // 3. Create business profile
      const { error: profileError } = await supabase
        .from('business_profiles')
        .insert({
          user_id: userId,
          business_name: businessName,
          website_url: website,
          phone: phone,
          // Other fields can be filled in by user later
        });

      if (profileError) {
        console.error('Failed to create business profile:', profileError);
        // Don't throw - this is less critical
      }

      // 4. Send welcome email with login link (optional)
      // TODO: Implement email sending via SendGrid, Resend, etc.
      // Should include:
      // - Welcome message
      // - Login link: ${process.env.APP_URL}/login
      // - Instructions to reset password
      
      console.log(`Account created for ${email} (User ID: ${userId})`);
      
    } catch (error: any) {
      console.error('Error processing checkout.session.completed:', error);
      // Don't return error to Stripe - we already have their payment
      // Instead, log for manual intervention
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
