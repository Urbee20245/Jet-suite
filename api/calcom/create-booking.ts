import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, email, start, timeZone, notes } = req.body;

    if (!name || !email || !start) {
      return res.status(400).json({ error: 'name, email, and start are required' });
    }

    // Get Cal.com settings from DB
    const { data: settings, error: dbError } = await supabase
      .from('calcom_settings')
      .select('calcom_api_key, calcom_event_id')
      .single();

    if (dbError && dbError.code !== 'PGRST116') throw dbError;
    if (!settings?.calcom_api_key || !settings?.calcom_event_id) {
      return res.status(404).json({ error: 'Cal.com not configured' });
    }

    // Create booking via Cal.com API
    const bookingBody = {
      eventTypeId: parseInt(settings.calcom_event_id, 10),
      start,
      timeZone: timeZone || 'America/New_York',
      language: 'en',
      metadata: {},
      responses: {
        name,
        email,
        location: { optionValue: '', value: 'integrations:google:meet' },
        ...(notes ? { notes } : {}),
      },
    };

    const calRes = await fetch(`https://api.cal.com/v1/bookings?apiKey=${settings.calcom_api_key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingBody),
    });

    if (!calRes.ok) {
      const errorData = await calRes.json().catch(() => ({}));
      console.error('Cal.com booking API error:', calRes.status, errorData);
      return res.status(calRes.status).json({
        error: errorData.message || 'Failed to create booking',
      });
    }

    const bookingData = await calRes.json();
    return res.status(200).json(bookingData);
  } catch (error: any) {
    console.error('Cal.com create-booking error:', error);
    return res.status(500).json({ error: error.message });
  }
}
