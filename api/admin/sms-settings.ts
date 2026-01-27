import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'theivsightcompany@gmail.com';
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify admin user
  const userEmail = req.headers['x-user-email'] as string;
  if (userEmail !== ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      // Fetch SMS settings (without credentials - those come from env vars)
      const { data, error } = await supabase
        .from('sms_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Check if Twilio env vars are configured
      const twilioConfigured = !!(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER
      );

      return res.status(200).json({
        settings: data || null,
        env_configured: {
          twilio: twilioConfigured
        }
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      // Save SMS settings (credentials are NOT stored in DB - they come from env vars)
      const {
        sms_enabled,
        urgent_tickets_sms,
        daily_sms_limit,
        hourly_sms_limit
      } = req.body;

      const settingsData = {
        id: 1, // Fixed ID to ensure only one row
        sms_enabled: sms_enabled || false,
        urgent_tickets_sms: urgent_tickets_sms || false,
        daily_sms_limit: daily_sms_limit || 50,
        hourly_sms_limit: hourly_sms_limit || 10,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('sms_settings')
        .upsert(settingsData, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('SMS settings API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
