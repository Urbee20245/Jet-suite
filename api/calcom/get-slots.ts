import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { startTime, endTime, timeZone } = req.query;

    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'startTime and endTime are required' });
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

    // Proxy request to Cal.com API
    const params = new URLSearchParams({
      apiKey: settings.calcom_api_key,
      eventTypeId: settings.calcom_event_id,
      startTime: startTime as string,
      endTime: endTime as string,
    });
    if (timeZone) params.set('timeZone', timeZone as string);

    const calRes = await fetch(`https://api.cal.com/v1/slots?${params.toString()}`);

    if (!calRes.ok) {
      const errorText = await calRes.text();
      console.error('Cal.com slots API error:', calRes.status, errorText);
      return res.status(calRes.status).json({ error: 'Failed to fetch available slots' });
    }

    const calData = await calRes.json();
    return res.status(200).json(calData);
  } catch (error: any) {
    console.error('Cal.com get-slots error:', error);
    return res.status(500).json({ error: error.message });
  }
}
