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
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Missing eventId' });
    }

    const { error } = await supabase
      .from('service_calendar_events')
      .delete()
      .eq('id', eventId);

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Delete event error:', error);
    return res.status(500).json({
      error: 'Failed to delete event',
      message: error.message,
    });
  }
}
