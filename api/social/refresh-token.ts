import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || '';
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
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

async function refreshTikTokToken(refreshToken: string) {
  const params = new URLSearchParams({
    client_key: TIKTOK_CLIENT_KEY,
    client_secret: TIKTOK_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`TikTok refresh failed: ${error.error_description || error.error}`);
  }
  return await response.json();
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { connectionId } = req.body;

    if (!connectionId) {
      return res.status(400).json({ error: 'Missing connectionId' });
    }

    // Get the connection
    const { data: connection, error: fetchError } = await supabase
      .from('social_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('is_active', true)
      .single();

    if (fetchError || !connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    if (!connection.refresh_token) {
      return res.status(400).json({
        error: 'No refresh token available',
        needs_reconnect: true,
      });
    }

    const decryptedRefreshToken = decrypt(connection.refresh_token);
    let newAccessToken: string;
    let newRefreshToken: string | null = null;
    let expiresAt: Date;

    if (connection.platform === 'google_business') {
      const tokens = await refreshGoogleToken(decryptedRefreshToken);
      newAccessToken = tokens.access_token;
      expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 3600));
    } else if (connection.platform === 'tiktok') {
      const tokens = await refreshTikTokToken(decryptedRefreshToken);
      newAccessToken = tokens.access_token;
      if (tokens.refresh_token) {
        newRefreshToken = tokens.refresh_token;
      }
      expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 86400));
    } else {
      return res.status(400).json({
        error: `Token refresh not supported for ${connection.platform}`,
        needs_reconnect: connection.platform === 'facebook' || connection.platform === 'instagram',
      });
    }

    // Update the connection with new tokens
    const updateData: Record<string, any> = {
      access_token: encrypt(newAccessToken),
      token_expires_at: expiresAt.toISOString(),
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (newRefreshToken) {
      updateData.refresh_token = encrypt(newRefreshToken);
    }

    const { error: updateError } = await supabase
      .from('social_connections')
      .update(updateData)
      .eq('id', connectionId);

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({
      success: true,
      token_expires_at: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      error: 'Failed to refresh token',
      message: error.message,
      needs_reconnect: true,
    });
  }
}
