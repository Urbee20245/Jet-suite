import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { serviceId, updates } = req.body;

    if (!serviceId || !updates) {
      return res.status(400).json({ error: 'Missing serviceId or updates' });
    }

    const { data, error } = await supabase
      .from('service_listings')
      .update(updates)
      .eq('id', serviceId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({ service: data });
  } catch (error: any) {
    console.error('Update service error:', error);
    return res.status(500).json({
      error: 'Failed to update service',
      message: error.message,
    });
  }
}
