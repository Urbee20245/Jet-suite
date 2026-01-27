import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user's subscription status from header (optional, for targeting)
    const userSubscriptionStatus = req.headers['x-user-subscription'] as string || 'all';

    // Fetch active announcements that haven't expired
    const now = new Date().toISOString();

    let query = supabase
      .from('announcements')
      .select('id, title, message, type, priority, target_audience, created_at')
      .eq('is_active', true)
      .or(`end_date.is.null,end_date.gt.${now}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Filter announcements based on target audience
    const filteredAnnouncements = (data || []).filter(announcement => {
      const audience = announcement.target_audience;

      // 'all' targets everyone
      if (audience === 'all') return true;

      // Match specific audience
      if (audience === 'free' && (!userSubscriptionStatus || userSubscriptionStatus === 'none')) return true;
      if (audience === 'paid' && userSubscriptionStatus === 'active') return true;
      if (audience === 'trial' && userSubscriptionStatus === 'trialing') return true;

      return false;
    });

    return res.status(200).json({ announcements: filteredAnnouncements });
  } catch (error: any) {
    console.error('Announcements API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
