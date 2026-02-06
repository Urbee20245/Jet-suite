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
    const { serviceId } = req.body;

    if (!serviceId) {
      return res.status(400).json({ error: 'Missing serviceId' });
    }

    const { error } = await supabase
      .from('service_listings')
      .delete()
      .eq('id', serviceId);

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Delete service error:', error);
    return res.status(500).json({
      error: 'Failed to delete service',
      message: error.message,
    });
  }
}
