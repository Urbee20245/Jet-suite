import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, startDate, endDate } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid userId' });
    }

    let query = supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', userId);

    if (startDate && typeof startDate === 'string') {
      query = query.gte('scheduled_date', startDate);
    }

    if (endDate && typeof endDate === 'string') {
      query = query.lte('scheduled_date', endDate);
    }

    query = query.order('scheduled_date', { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({ posts: data || [] });
  } catch (error: any) {
    console.error('Get posts error:', error);
    return res.status(500).json({
      error: 'Failed to get posts',
      message: error.message,
    });
  }
}
