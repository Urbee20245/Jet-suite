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
        
        // TODO: Update your database with successful subscription
        // - Mark user as subscribed
        // - Store customerId for future portal access
        // - Record subscription details
        
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
        
        // TODO: Update database with subscription details
        
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
        });
        
        // TODO: Handle subscription changes (upgrade/downgrade)
        
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription canceled:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
        });
        
        // TODO: Handle subscription cancellation
        // - Mark user as unsubscribed
        // - Disable premium features
        
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice paid:', {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          amount: invoice.amount_paid,
        });
        
        // TODO: Record successful payment
        
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment failed:', {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          attemptCount: invoice.attempt_count,
        });
        
        // TODO: Handle failed payment
        // - Notify user
        // - Grace period before disabling access
        
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
