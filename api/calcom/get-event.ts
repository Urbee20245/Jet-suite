import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch Cal.com settings from the database
    const { data, error } = await supabase
      .from('calcom_settings')
      .select('calcom_event_id')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data || !data.calcom_event_id) {
      return res.status(404).json({ error: 'Cal.com event not configured' });
    }

    return res.status(200).json({
      eventId: data.calcom_event_id
    });
  } catch (error: any) {
    console.error('Cal.com get-event API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
