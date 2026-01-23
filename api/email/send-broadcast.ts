import type { VercelRequest, VercelResponse } from '@vercel/node';
import emailService from '../../services/emailService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subject, body_html, body_text, target_audience, custom_filter } = req.body;

    // Get recipients based on target audience
    let recipients: string[] = [];

    if (target_audience === 'all') {
      const { data } = await supabase
        .from('profiles')
        .select('email');
      recipients = data?.map(p => p.email) || [];
    } else if (target_audience === 'founder') {
      const { data } = await supabase
        .from('billing_accounts')
        .select('user_email')
        .eq('is_founder', true);
      recipients = data?.map(b => b.user_email) || [];
    } else if (target_audience === 'standard') {
      const { data } = await supabase
        .from('billing_accounts')
        .select('user_email')
        .eq('is_founder', false);
      recipients = data?.map(b => b.user_email) || [];
    } else if (target_audience === 'trial') {
      const { data } = await supabase
        .from('profiles')
        .select('email')
        .not('trial_end_date', 'is', null)
        .gte('trial_end_date', new Date().toISOString().split('T')[0]);
      recipients = data?.map(p => p.email) || [];
    }

    const result = await emailService.sendBroadcastEmail(
      subject,
      body_html,
      body_text,
      recipients
    );

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}