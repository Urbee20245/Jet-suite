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
    const { 
      userId, 
      post_text, 
      hashtags, 
      visual_suggestion,
      image_url,
      scheduled_date, 
      scheduled_time,
      timezone,
      platforms, 
      status 
    } = req.body;

    if (!userId || !post_text || !scheduled_date || !platforms) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newPost = {
      user_id: userId,
      post_text,
      hashtags: hashtags || null,
      visual_suggestion: visual_suggestion || null,
      image_url: image_url || null,
      scheduled_date,
      scheduled_time: scheduled_time || null,
      timezone: timezone || 'America/New_York',
      platforms: JSON.stringify(platforms),
      status: status || 'scheduled',
    };

    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert([newPost])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({ post: data });
  } catch (error: any) {
    console.error('Create post error:', error);
    return res.status(500).json({
      error: 'Failed to create post',
      message: error.message,
    });
  }
}
