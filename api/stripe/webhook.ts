import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, need raw body for webhook signature verification
  },
};

// Helper to get raw body as buffer
async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature as string,
        webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', {
          sessionId: session.id,
          customerId: session.customer,
          email: session.customer_email,
          metadata: session.metadata,
        });
        
        // Update billing account with customer ID and counts
        if (session.customer && session.metadata?.userId) {
          try {
            const seatCount = parseInt(session.metadata.seatCount || '0', 10);
            const businessCount = 1 + parseInt(session.metadata.additionalBusinessCount || '0', 10);
            
            await fetch(`${process.env.APP_URL}/api/billing/upsert-account`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: session.metadata.userId,
                userEmail: session.customer_email,
                stripeCustomerId: session.customer as string,
                seatCount: seatCount,
                businessCount: businessCount,
              }),
            });
          } catch (err) {
            console.error('Failed to update billing account:', err);
          }
        }
        
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription created:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          priceId: subscription.items.data[0]?.price.id,
        });
        
        // Get billing account by customer ID to find user ID
        try {
          const billingResponse = await fetch(
            `${process.env.APP_URL}/api/billing/get-by-customer?customerId=${subscription.customer}`,
            { method: 'GET' }
          );
          
          if (billingResponse.ok) {
            const { billingAccount } = await billingResponse.json();
            
            // Update with subscription details
            await fetch(`${process.env.APP_URL}/api/billing/upsert-account`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: billingAccount.user_id,
                userEmail: billingAccount.user_email,
                stripeSubscriptionId: subscription.id,
                subscriptionStatus: subscription.status,
                subscriptionPlan: subscription.items.data[0]?.price.id || '',
                currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
              }),
            });
          }
        } catch (err) {
          console.error('Failed to update subscription in database:', err);
        }
        
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
        });
        
        // Get billing account and update
        try {
          const billingResponse = await fetch(
            `${process.env.APP_URL}/api/billing/get-by-customer?customerId=${subscription.customer}`,
            { method: 'GET' }
          );
          
          if (billingResponse.ok) {
            const { billingAccount } = await billingResponse.json();
            
            await fetch(`${process.env.APP_URL}/api/billing/upsert-account`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: billingAccount.user_id,
                userEmail: billingAccount.user_email,
                subscriptionStatus: subscription.status,
                subscriptionPlan: subscription.items.data[0]?.price.id || '',
                currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
              }),
            });
          }
        } catch (err) {
          console.error('Failed to update subscription status:', err);
        }
        
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription canceled:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
        });
        
        // Mark subscription as canceled in database
        try {
          const billingResponse = await fetch(
            `${process.env.APP_URL}/api/billing/get-by-customer?customerId=${subscription.customer}`,
            { method: 'GET' }
          );
          
          if (billingResponse.ok) {
            const { billingAccount } = await billingResponse.json();
            
            await fetch(`${process.env.APP_URL}/api/billing/upsert-account`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: billingAccount.user_id,
                userEmail: billingAccount.user_email,
                subscriptionStatus: 'canceled',
              }),
            });
          }
        } catch (err) {
          console.error('Failed to mark subscription as canceled:', err);
        }
        
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment succeeded:', {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          amount: invoice.amount_paid,
          subscriptionId: invoice.subscription,
        });
        
        // Payment successful - ensure subscription status is active
        if (invoice.subscription) {
          try {
            // Fetch full subscription to get current_period_end
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            
            const billingResponse = await fetch(
              `${process.env.APP_URL}/api/billing/get-by-customer?customerId=${invoice.customer}`,
              { method: 'GET' }
            );
            
            if (billingResponse.ok) {
              const { billingAccount } = await billingResponse.json();
              
              await fetch(`${process.env.APP_URL}/api/billing/upsert-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: billingAccount.user_id,
                  userEmail: billingAccount.user_email,
                  subscriptionStatus: subscription.status, // Should be 'active'
                  currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
                  currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
                }),
              });
              
              console.log('✅ Subscription marked as active after successful payment');
            }
          } catch (err) {
            console.error('Failed to update subscription after payment:', err);
          }
        }
        
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('⚠️ Invoice payment failed:', {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          attemptCount: invoice.attempt_count,
          subscriptionId: invoice.subscription,
        });
        
        // Payment failed - mark subscription as past_due
        if (invoice.subscription) {
          try {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            
            const billingResponse = await fetch(
              `${process.env.APP_URL}/api/billing/get-by-customer?customerId=${invoice.customer}`,
              { method: 'GET' }
            );
            
            if (billingResponse.ok) {
              const { billingAccount } = await billingResponse.json();
              
              await fetch(`${process.env.APP_URL}/api/billing/upsert-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: billingAccount.user_id,
                  userEmail: billingAccount.user_email,
                  subscriptionStatus: subscription.status, // Will be 'past_due' or 'unpaid'
                }),
              });
              
              console.log('⚠️ Subscription marked as past_due after failed payment');
              
              // TODO: Send email notification to user about failed payment
              // TODO: Consider grace period (Stripe handles retries automatically)
            }
          } catch (err) {
            console.error('Failed to update subscription after payment failure:', err);
          }
        }
        
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      error: 'Webhook handler failed',
      message: error.message,
    });
  }
}
