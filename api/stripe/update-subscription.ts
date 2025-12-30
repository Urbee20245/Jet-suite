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
    const { data: billingAccount, error: billingError } = await supabase
      .from('billing_accounts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (billingError || !billingAccount) {
      return res.status(404).json({ message: 'No billing account found' });
    }

    const subscription = await stripe.subscriptions.retrieve(
      billingAccount.stripe_subscription_id
    );

    const basePlan = 149;
    const additionalBusinessCost = 49;
    const seatCost = 15;
    
    const additionalBusinessCount = Math.max(0, businessCount - 1);
    const newTotal = basePlan + (additionalBusinessCount * additionalBusinessCost) + (seatCount * seatCost);

    const currentBusinessCount = parseInt(billingAccount.business_count || '1');
    const currentSeatCount = parseInt(billingAccount.seat_count || '0');
    const currentAdditionalBusinessCount = Math.max(0, currentBusinessCount - 1);
    const currentTotal = basePlan + (currentAdditionalBusinessCount * additionalBusinessCost) + (currentSeatCount * seatCost);

    const isUpgrade = newTotal > currentTotal;

    if (isUpgrade) {
      const productId = typeof subscription.items.data[0].price.product === 'string' 
        ? subscription.items.data[0].price.product 
        : subscription.items.data[0].price.product.id;

      const session = await stripe.checkout.sessions.create({
        customer: billingAccount.stripe_customer_id,
        payment_method_types: ['card'],
        mode: 'subscription',
        client_reference_id: userId,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product: productId,
              recurring: {
                interval: 'month',
              },
              unit_amount: newTotal * 100,
            },
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            user_id: userId,
            business_count: businessCount.toString(),
            seat_count: seatCount.toString(),
            previous_subscription_id: subscription.id // Pass for webhook to cancel old sub safely
          },
        },
        success_url: `${process.env.APP_URL}/account?upgrade=success`,
        cancel_url: `${process.env.APP_URL}/account?upgrade=cancelled`,
      });

      // DO NOT cancel the old subscription yet. 
      // The webhook will handle the cleanup once payment for the new one is confirmed.
      return res.json({ url: session.url });
    } else {
      // Downgrade Path
      await stripe.subscriptions.update(subscription.id, {
        metadata: {
          user_id: userId,
          business_count: businessCount.toString(),
          seat_count: seatCount.toString(),
        },
        proration_behavior: 'none',
      });

      // REMOVED: Immediate database update. 
      // Limits should only change at the end of the period (via webhook).
      return res.json({ 
        success: true,
        message: 'Plan update requested. Changes will take effect at the end of your current billing period.',
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