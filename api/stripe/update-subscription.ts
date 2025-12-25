// /api/stripe/update-subscription.ts
// Backend API to handle plan upgrades/downgrades

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, businessCount, seatCount } = req.body;

  if (!email || businessCount === undefined || seatCount === undefined) {
    return res.status(400).json({ 
      message: 'Missing required fields: email, businessCount, seatCount' 
    });
  }

  try {
    // Get user's billing account from database
    const { data: billingAccount, error: billingError } = await supabase
      .from('billing_accounts')
      .select('*')
      .eq('user_email', email)
      .single();

    if (billingError || !billingAccount) {
      return res.status(404).json({ message: 'No billing account found' });
    }

    // Get current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      billingAccount.stripe_subscription_id
    );

    // Calculate new pricing
    const basePlan = 149;
    const additionalBusinessCost = 49;
    const seatCost = 15;
    
    const additionalBusinessCount = Math.max(0, businessCount - 1);
    const newTotal = basePlan + (additionalBusinessCount * additionalBusinessCost) + (seatCount * seatCost);

    // Calculate current pricing
    const currentBusinessCount = parseInt(billingAccount.business_count || '1');
    const currentSeatCount = parseInt(billingAccount.seat_count || '0');
    const currentAdditionalBusinessCount = Math.max(0, currentBusinessCount - 1);
    const currentTotal = basePlan + (currentAdditionalBusinessCount * additionalBusinessCost) + (currentSeatCount * seatCost);

    // Determine if this is an upgrade (requires payment) or downgrade
    const isUpgrade = newTotal > currentTotal;

    if (isUpgrade) {
      // Create a new checkout session for the upgrade
      const session = await stripe.checkout.sessions.create({
        customer: billingAccount.stripe_customer_id,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product: subscription.items.data[0].price.product,
              recurring: {
                interval: 'month',
              },
              unit_amount: newTotal * 100, // Convert to cents
            },
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            businessCount: businessCount.toString(),
            seatCount: seatCount.toString(),
          },
        },
        success_url: `${process.env.APP_URL}/account?upgrade=success`,
        cancel_url: `${process.env.APP_URL}/account?upgrade=cancelled`,
      });

      // Cancel the old subscription
      await stripe.subscriptions.cancel(billingAccount.stripe_subscription_id);

      return res.json({ url: session.url });
    } else {
      // Downgrade - update subscription immediately (takes effect at period end)
      await stripe.subscriptions.update(subscription.id, {
        metadata: {
          businessCount: businessCount.toString(),
          seatCount: seatCount.toString(),
        },
        proration_behavior: 'none', // Don't prorate downgrades
      });

      // Update database
      await supabase
        .from('billing_accounts')
        .update({
          business_count: businessCount,
          seat_count: seatCount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_email', email);

      return res.json({ 
        success: true,
        message: 'Plan updated successfully. Changes will take effect at the end of your current billing period.',
      });
    }

  } catch (error) {
    console.error('Error updating subscription:', error);
    return res.status(500).json({ 
      message: 'Failed to update subscription',
      error: error.message 
    });
  }
}
