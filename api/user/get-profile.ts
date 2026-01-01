import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Server-side client with service role (bypasses RLS for admin/trusted read)
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
      return res.status(400).json({ error: 'Missing or invalid userId parameter' });
    }

    // Fetch profile data from the public.profiles table
    // We use the service key here to ensure we can read the profile even if RLS is complex,
    // but the query is restricted by the provided userId.
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      throw error;
    }

    return res.status(200).json({ profile: data });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      error: 'Failed to get profile',
      message: error.message,
    });
  }
}