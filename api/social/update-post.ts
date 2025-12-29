import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { postId, updates } = req.body;

    if (!postId || !updates) {
      return res.status(400).json({ error: 'Missing postId or updates' });
    }

    // If platforms is in updates, stringify it
    if (updates.platforms) {
      updates.platforms = JSON.stringify(updates.platforms);
    }

    const { data, error } = await supabase
      .from('scheduled_posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({ post: data });
  } catch (error: any) {
    console.error('Update post error:', error);
    return res.status(500).json({
      error: 'Failed to update post',
      message: error.message,
    });
  }
}
