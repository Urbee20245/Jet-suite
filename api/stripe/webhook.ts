import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendWelcomeEmail } from '../utils/emailService'; // Import email service

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

// Function to generate a secure temporary password
function generateTemporaryPassword(): string {
  const length = 16;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
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
      // Safe subscription retrieval
      let subscription;
      try {
        subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      } catch (err) {
        console.error('[Webhook] Failed to retrieve subscription:', session.subscription);
        return res.status(200).json({ received: true });
      }

      const metadata = subscription.metadata;
      const email = session.customer_email || metadata.email || '';
      const isNewUser = metadata.is_new_user === 'true';
      
      let userId = session.client_reference_id || metadata.user_id;
      let tempPassword = ''; // Store temp password here

      if (!email) {
          console.error('[Webhook] CRITICAL: Missing email in session metadata or customer email.', session.id);
          return res.status(200).json({ received: true });
      }

      // 1. Handle New User Creation (if unauthenticated user paid)
      if (isNewUser && !userId) {
          console.log(`[Webhook] Detected new user signup for email: ${email}. Attempting to create Supabase user.`);
          tempPassword = generateTemporaryPassword();
          console.log(`[Webhook] Generated temporary password: ${tempPassword}`); // Log for testing

          try {
              const { data: newUserData, error: createUserError } = await supabase.auth.admin.createUser({
                  email: email,
                  password: tempPassword,
                  email_confirm: true, // Auto-confirm email
                  user_metadata: {
                      first_name: metadata.first_name || '',
                      last_name: metadata.last_name || '',
                      business_name: metadata.business_name || '',
                      phone: metadata.phone || '',
                      website: metadata.website || '',
                  },
              });

              if (createUserError) {
                  // If creation fails (e.g., user already exists), try to retrieve existing user
                  if (createUserError.message.includes('User already exists')) {
                      console.warn(`[Webhook] User already exists for ${email}. Attempting to retrieve existing user.`);
                      
                      // FIX: Use listUsers and filter manually as getUserByEmail is not available on GoTrueAdminApi
                      const { data: { users }, error: fetchUserError } = await supabase.auth.admin.listUsers();
                      
                      if (fetchUserError) {
                          throw new Error(`Failed to retrieve existing user list: ${fetchUserError.message}`);
                      }
                      
                      const existingUser = users?.find(u => u.email === email);
                      
                      if (!existingUser) {
                          throw new Error(`User with email ${email} not found after listUsers call.`);
                      }
                      
                      userId = existingUser.id;
                      console.log(`[Webhook] Using existing user ID: ${userId}`);
                  } else {
                      throw createUserError;
                  }
              } else {
                  userId = newUserData?.user?.id;
                  console.log(`[Webhook] Successfully created new user with ID: ${userId}`);
              }
          } catch (e) {
              console.error('[Webhook] CRITICAL: Failed to create or retrieve user:', e);
              return res.status(200).json({ received: true }); // Cannot proceed without a valid userId
          }
      }
      
      if (!userId) {
          console.error('[Webhook] CRITICAL: Final userId is missing after all attempts.', session.id);
          return res.status(200).json({ received: true });
      }

      // 2. Continue with database upserts using the determined userId
      
      const phone = metadata.phone || '';
      const businessName = metadata.business_name || '';
      const website = metadata.website || '';
      const pricingTier = metadata.pricing_tier || 'standard';
      
      // Calculate total seats and businesses from metadata
      const additionalSeatCount = parseInt(metadata.seat_count || '0');
      const totalBusinessCount = parseInt(metadata.business_count || '1');
      const totalSeatCount = 1 + additionalSeatCount; // Assuming 1 base seat is included

      // Check if we need to cancel a previous subscription (from upgrade flow)
      if (metadata.previous_subscription_id) {
        try {
          await stripe.subscriptions.cancel(metadata.previous_subscription_id);
          console.log('[Webhook] Cancelled previous subscription:', metadata.previous_subscription_id);
        } catch (err) {
          console.warn('[Webhook] Failed to cancel old sub during upgrade (already cancelled?):', metadata.previous_subscription_id);
        }
      }

      // Upsert billing account
      const { error: billingError } = await supabase
        .from('billing_accounts')
        .upsert({
          user_id: userId,
          user_email: email,
          subscription_status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          seat_count: totalSeatCount,
          business_count: totalBusinessCount,
          subscription_plan: pricingTier,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (billingError) throw billingError;
      console.log(`[Webhook] Billing account upserted for user: ${userId}`);

      // Upsert initial business profile
      await supabase
        .from('business_profiles')
        .upsert({
          user_id: userId,
          business_name: businessName,
          business_website: website,
          business_phone: phone,
          is_primary: true, // Set as primary business
          is_complete: false, // User still needs to complete onboarding steps
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      
      console.log(`[Webhook] Initial business profile upserted for user: ${userId}`);

      // 3. Send welcome email if a temporary password was generated
      if (tempPassword) {
          try {
              await sendWelcomeEmail({
                  email: email,
                  firstName: metadata.first_name || '',
                  lastName: metadata.last_name || '',
                  businessName: businessName,
                  tempPassword: tempPassword,
              });
              console.log(`[Webhook] Successfully logged welcome email content for ${email}`);
          } catch (e) {
              console.error(`[Webhook] FAILED to send welcome email to ${email}:`, e);
          }
      }
      
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