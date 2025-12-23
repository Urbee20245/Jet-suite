import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Server-side client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId } = req.query;

    // Validate required fields
    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid customerId parameter' });
    }

    // Get billing account by Stripe customer ID
    const { data, error } = await supabase
      .from('billing_accounts')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (error) {
      // If no record found
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Billing account not found' });
      }
      throw error;
    }

    return res.status(200).json({ billingAccount: data });
  } catch (error: any) {
    console.error('Get billing account by customer error:', error);
    return res.status(500).json({
      error: 'Failed to get billing account',
      message: error.message,
    });
  }
}
