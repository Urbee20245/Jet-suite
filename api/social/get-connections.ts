import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Server-side client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    // Validate required fields
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid userId parameter' });
    }

    // Get social connections for user (include ALL connections, even inactive for reconnect)
    const { data, error } = await supabase
      .from('social_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Enrich connections with health status
    const now = new Date();
    const connections = (data || []).map((conn: any) => {
      let connection_status: 'active' | 'expiring_soon' | 'expired' = 'active';

      if (conn.token_expires_at) {
        const expiresAt = new Date(conn.token_expires_at);
        const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilExpiry <= 0) {
          connection_status = 'expired';
        } else if (hoursUntilExpiry <= 72) {
          // Warn 3 days before expiry
          connection_status = 'expiring_soon';
        }
      }

      return {
        ...conn,
        connection_status,
        has_refresh_token: !!conn.refresh_token,
      };
    });

    return res.status(200).json({ connections });
  } catch (error: any) {
    console.error('Get social connections error:', error);
    return res.status(500).json({
      error: 'Failed to get social connections',
      message: error.message,
    });
  }
}
