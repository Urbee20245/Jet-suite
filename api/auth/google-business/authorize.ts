import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

if (!supabaseUrl || !supabaseServiceKey || !GOOGLE_CLIENT_ID || !APP_URL) {
  throw new Error('Missing required environment variables for Google Business OAuth setup.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Google OAuth configuration
const GOOGLE_REDIRECT_URI = `${APP_URL}/api/auth/google-business/callback`;
const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

// Generate random state token for CSRF protection
function generateStateToken(): string {
  // Use Web Crypto if available (as in existing Facebook authorize handler)
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Fallback for Node environments
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodeCrypto = require('crypto') as typeof import('crypto');
  return nodeCrypto.randomBytes(32).toString('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const state = generateStateToken();

    // Store state in oauth_states for 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const { error: insertError } = await supabase.from('oauth_states').insert({
      state,
      user_id: userId,
      platform: 'google_business',
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error('Failed to store Google OAuth state:', insertError);
      return res.status(500).json({ error: 'Failed to initiate Google OAuth flow' });
    }

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/business.manage',
      access_type: 'offline',
      include_granted_scopes: 'true',
      state,
      prompt: 'consent',
    });

    const authUrl = `${GOOGLE_OAUTH_URL}?${params.toString()}`;
    res.redirect(302, authUrl);
  } catch (error) {
    console.error('Google Business authorize error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}