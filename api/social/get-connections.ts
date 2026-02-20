import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// Server-side client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function decrypt(encryptedText: string): string {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function refreshGoogleToken(refreshToken: string) {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google refresh failed: ${error.error_description || error.error}`);
  }
  return await response.json();
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, businessId } = req.query;

    // Validate required fields
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid userId parameter' });
    }

    if (!businessId || typeof businessId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid businessId parameter' });
    }

    // Get social connections for user and business (only active connections)
    const { data: rawData, error } = await supabase
      .from('social_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Auto-refresh tokens that are expired or expiring soon (for platforms that support it)
    const now = new Date();
    const autoRefresh = req.query.autoRefresh === 'true'; // Optional parameter to enable auto-refresh

    let data = rawData || [];

    if (autoRefresh && data.length > 0) {
      const refreshPromises = data.map(async (conn: any) => {
        if (!conn.token_expires_at || !conn.refresh_token) {
          return conn; // Skip if no expiry or no refresh token
        }

        const expiresAt = new Date(conn.token_expires_at);
        const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60);

        // Only auto-refresh Google Business tokens that expire within 10 minutes
        if (conn.platform === 'google_business' && minutesUntilExpiry < 10) {
          try {
            console.log(`[Auto-refresh] Refreshing ${conn.platform} token (expires in ${minutesUntilExpiry.toFixed(1)} minutes)`);

            const decryptedRefreshToken = decrypt(conn.refresh_token);
            const tokens = await refreshGoogleToken(decryptedRefreshToken);

            const newExpiresAt = new Date();
            newExpiresAt.setSeconds(newExpiresAt.getSeconds() + (tokens.expires_in || 3600));

            // Update the connection with new token
            await supabase
              .from('social_connections')
              .update({
                access_token: encrypt(tokens.access_token),
                token_expires_at: newExpiresAt.toISOString(),
                last_synced_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', conn.id);

            console.log(`[Auto-refresh] Successfully refreshed ${conn.platform} token`);

            // Return updated connection
            return {
              ...conn,
              token_expires_at: newExpiresAt.toISOString(),
              last_synced_at: new Date().toISOString(),
            };
          } catch (err) {
            console.error(`[Auto-refresh] Failed to refresh ${conn.platform} token:`, err);
            return conn; // Return original connection on error
          }
        }

        return conn;
      });

      // Wait for all refresh attempts
      data = await Promise.all(refreshPromises);
    }

    // Enrich connections with health status
    const connections = data.map((conn: any) => {
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
