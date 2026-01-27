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
      // Fetch email settings
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Also fetch today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: sentToday } = await supabase
        .from('email_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent')
        .gte('created_at', today.toISOString());

      const { count: failedToday } = await supabase
        .from('email_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', today.toISOString());

      return res.status(200).json({
        settings: data || null,
        stats: {
          sent_today: sentToday || 0,
          failed_today: failedToday || 0
        }
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      // Save email settings
      const {
        resend_api_key,
        from_email,
        from_name,
        reply_to_email,
        forward_to_email,
        forward_enabled,
        auto_reply_enabled,
        auto_reply_message,
        default_signature,
        daily_email_limit,
        hourly_email_limit
      } = req.body;

      const settingsData = {
        id: 1, // Fixed ID to ensure only one row
        resend_api_key,
        from_email,
        from_name,
        reply_to_email,
        forward_to_email,
        forward_enabled: forward_enabled || false,
        auto_reply_enabled: auto_reply_enabled || false,
        auto_reply_message,
        default_signature,
        daily_email_limit: daily_email_limit || 100,
        hourly_email_limit: hourly_email_limit || 20,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('email_settings')
        .upsert(settingsData, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Email settings API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
