// api/auth/twitter/authorize.ts
// Vercel Serverless Function - Twitter/X OAuth 2.0 with PKCE

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;

if (!supabaseUrl || !supabaseServiceKey || !TWITTER_CLIENT_ID || !APP_URL) {
  throw new Error('Missing required environment variables for Twitter OAuth setup.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TWITTER_REDIRECT_URI = `${APP_URL}/api/auth/twitter/callback`;
const TWITTER_OAUTH_URL = 'https://twitter.com/i/oauth2/authorize';

function generateStateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateCodeVerifier(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { userId, businessId, redirectUrl } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!businessId || typeof businessId !== 'string') {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    const state = generateStateToken();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const redirectUrlStr = Array.isArray(redirectUrl) ? redirectUrl[0] : redirectUrl;
    const metadata: Record<string, string> = { code_verifier: codeVerifier };
    if (redirectUrlStr) {
      metadata.redirect_url = redirectUrlStr;
    }

    const { error: insertError } = await supabase.from('oauth_states').insert({
      state,
      user_id: userId,
      business_id: businessId,
      platform: 'twitter',
      expires_at: expiresAt.toISOString(),
      metadata,
    });

    if (insertError) {
      console.error('Failed to store OAuth state:', insertError);
      return res.status(500).json({ error: 'Failed to initiate OAuth flow' });
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: TWITTER_CLIENT_ID,
      redirect_uri: TWITTER_REDIRECT_URI,
      scope: 'tweet.read tweet.write users.read offline.access',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    res.redirect(302, `${TWITTER_OAUTH_URL}?${params.toString()}`);
  } catch (error) {
    console.error('Twitter authorization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
