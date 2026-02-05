// api/auth/tiktok/authorize.ts
// Vercel Serverless Function - TikTok OAuth

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Check for required environment variables (support both NEXT_PUBLIC_ and non-prefixed)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;

if (!supabaseUrl || !supabaseServiceKey || !TIKTOK_CLIENT_KEY || !APP_URL) {
  throw new Error('Missing required environment variables for TikTok OAuth setup.');
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey
);

// TikTok OAuth configuration
const TIKTOK_REDIRECT_URI = `${APP_URL}/api/auth/tiktok/callback`;
const TIKTOK_OAUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';

// Generate state token for CSRF protection
function generateStateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate code verifier for PKCE (TikTok requires this)
function generateCodeVerifier(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate code challenge from verifier
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Generate CSRF protection state token
    const state = generateStateToken();
    
    // Generate PKCE code verifier and challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store state and code_verifier in database (expires in 10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const { error: insertError } = await supabase
      .from('oauth_states')
      .insert({
        state,
        user_id: userId,
        platform: 'tiktok',
        expires_at: expiresAt.toISOString(),
        metadata: {
          code_verifier: codeVerifier, // Store for callback
        },
      });

    if (insertError) {
      console.error('Failed to store OAuth state:', insertError);
      return res.status(500).json({ error: 'Failed to initiate OAuth flow' });
    }

    // Build TikTok OAuth URL
    // TikTok uses a different parameter format
    const params = new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      redirect_uri: TIKTOK_REDIRECT_URI,
      response_type: 'code',
      scope: 'user.info.basic,video.list,video.upload', // Basic permissions
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const authUrl = `${TIKTOK_OAUTH_URL}?${params.toString()}`;

    // Redirect user to TikTok
    res.redirect(302, authUrl);
  } catch (error) {
    console.error('TikTok authorization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
