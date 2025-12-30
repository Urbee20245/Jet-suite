// /api/stripe/update-subscription.ts
// Backend API to handle plan upgrades/downgrades

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, businessCount, seatCount } = req.body;

  if (!userId || businessCount === undefined || seatCount === undefined) {
    return res.status(400).json({ 
      message: 'Missing required fields: userId, businessCount, seatCount' 
    });
  }

  try {
    // Get user's billing account from database using UUID as primary key
    const { data: billingAccount, error: billingError } = await supabase
      .from('billing_accounts')
      .select('*')
      .eq('user_id', userId)
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
      const productId = typeof subscription.items.data[0].price.product === 'string' 
        ? subscription.items.data[0].price.product 
        : subscription.items.data[0].price.product.id;

      const session = await stripe.checkout.sessions.create({
        customer: billingAccount.stripe_customer_id,
        payment_method_types: ['card'],
        mode: 'subscription',
        client_reference_id: userId, // Ensure UUID link persists
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product: productId,
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
            user_id: userId,
            business_count: businessCount.toString(),
            seat_count: seatCount.toString(),
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
          user_id: userId,
          business_count: businessCount.toString(),
          seat_count: seatCount.toString(),
        },
        proration_behavior: 'none', // Don't prorate downgrades
      });

      // Update database using UUID as the key
      await supabase
        .from('billing_accounts')
        .update({
          business_count: businessCount,
          seat_count: seatCount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      return res.json({ 
        success: true,
        message: 'Plan updated successfully. Changes will take effect at the end of your current billing period.',
      });
    }

  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return res.status(500).json({ 
      message: 'Failed to update subscription',
      error: error.message 
    });
  }
}