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
    const { userId, platform, platformUsername, platformPageId } = req.body;

    if (!userId || !platform || !platformUsername) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create mock OAuth token (in production, this would come from real OAuth flow)
    const mockToken = 'mock_token_' + Math.random().toString(36).substring(7);

    const newConnection = {
      user_id: userId,
      platform,
      platform_username: platformUsername,
      platform_page_id: platformPageId || null,
      access_token: mockToken,
      is_active: true,
      last_synced_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('social_connections')
      .insert([newConnection])
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return res.status(409).json({ 
          error: 'Connection already exists for this platform' 
        });
      }
      throw error;
    }

    return res.status(200).json({ connection: data });
  } catch (error: any) {
    console.error('Add connection error:', error);
    return res.status(500).json({
      error: 'Failed to add connection',
      message: error.message,
    });
  }
}
