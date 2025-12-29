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
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid userId' });
    }

    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('status')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    const stats = {
      scheduled: 0,
      posted: 0,
      failed: 0,
      draft: 0,
    };

    (data || []).forEach((post: any) => {
      if (post.status in stats) {
        stats[post.status as keyof typeof stats]++;
      }
    });

    return res.status(200).json({ stats });
  } catch (error: any) {
    console.error('Get stats error:', error);
    return res.status(500).json({
      error: 'Failed to get stats',
      message: error.message,
    });
  }
}
