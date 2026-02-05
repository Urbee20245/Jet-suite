// api/auth/google/authorize.ts
// Vercel Serverless Function - Google Business Profile OAuth

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Check for required environment variables (support both NEXT_PUBLIC_ and non-prefixed)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;

if (!supabaseUrl || !supabaseServiceKey || !GOOGLE_CLIENT_ID || !APP_URL) {
  throw new Error('Missing required environment variables for Google OAuth setup.');
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey
);

// Google OAuth configuration
const GOOGLE_REDIRECT_URI = `${APP_URL}/api/auth/google/callback`;
const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

// Generate state token for CSRF protection
function generateStateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
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

    // Store state in database (expires in 10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const { error: insertError } = await supabase
      .from('oauth_states')
      .insert({
        state,
        user_id: userId,
        platform: 'google_business',
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Failed to store OAuth state:', insertError);
      return res.status(500).json({ error: 'Failed to initiate OAuth flow' });
    }

    // Build Google OAuth URL with Business Profile scopes
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/business.manage', // Manage Google Business Profile
      ].join(' '),
      state: state,
      access_type: 'offline', // Request refresh token
      prompt: 'consent', // Force consent screen to get refresh token
    });

    const authUrl = `${GOOGLE_OAUTH_URL}?${params.toString()}`;

    // Redirect user to Google
    res.redirect(302, authUrl);
  } catch (error) {
    console.error('Google authorization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
