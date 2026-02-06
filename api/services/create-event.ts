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
    const {
      userId,
      businessId,
      service_id,
      title,
      description,
      event_date,
      start_time,
      end_time,
      is_recurring,
      recurrence_pattern,
      status,
    } = req.body;

    if (!userId || !businessId || !title || !event_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newEvent = {
      user_id: userId,
      business_id: businessId,
      service_id: service_id || null,
      title,
      description: description || null,
      event_date,
      start_time: start_time || null,
      end_time: end_time || null,
      is_recurring: is_recurring || false,
      recurrence_pattern: recurrence_pattern || null,
      status: status || 'active',
    };

    const { data, error } = await supabase
      .from('service_calendar_events')
      .insert([newEvent])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({ event: data });
  } catch (error: any) {
    console.error('Create event error:', error);
    return res.status(500).json({
      error: 'Failed to create event',
      message: error.message,
    });
  }
}
