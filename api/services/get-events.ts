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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, businessId, startDate, endDate } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid userId' });
    }

    if (!businessId || typeof businessId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid businessId' });
    }

    let query = supabase
      .from('service_calendar_events')
      .select('*')
      .eq('user_id', userId)
      .eq('business_id', businessId);

    if (startDate && typeof startDate === 'string') {
      query = query.gte('event_date', startDate);
    }

    if (endDate && typeof endDate === 'string') {
      query = query.lte('event_date', endDate);
    }

    query = query.order('event_date', { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({ events: data || [] });
  } catch (error: any) {
    console.error('Get events error:', error);
    return res.status(500).json({
      error: 'Failed to get events',
      message: error.message,
    });
  }
}
