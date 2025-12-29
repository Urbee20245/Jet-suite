import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { connectionId } = req.body;

    if (!connectionId) {
      return res.status(400).json({ error: 'Missing connectionId' });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('social_connections')
      .update({ is_active: false })
      .eq('id', connectionId);

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Remove connection error:', error);
    return res.status(500).json({
      error: 'Failed to remove connection',
      message: error.message,
    });
  }
}
