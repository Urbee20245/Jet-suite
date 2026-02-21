// api/auth/linkedin/authorize.ts
// Vercel Serverless Function - LinkedIn OAuth

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;

if (!supabaseUrl || !supabaseServiceKey || !LINKEDIN_CLIENT_ID || !APP_URL) {
  throw new Error('Missing required environment variables for LinkedIn OAuth setup.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const LINKEDIN_REDIRECT_URI = `${APP_URL}/api/auth/linkedin/callback`;
const LINKEDIN_OAUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';

function generateStateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
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

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const redirectUrlStr = Array.isArray(redirectUrl) ? redirectUrl[0] : redirectUrl;
    const metadata = redirectUrlStr ? { redirect_url: redirectUrlStr } : null;

    const { error: insertError } = await supabase.from('oauth_states').insert({
      state,
      user_id: userId,
      business_id: businessId,
      platform: 'linkedin',
      expires_at: expiresAt.toISOString(),
      metadata,
    });

    if (insertError) {
      console.error('Failed to store OAuth state:', insertError);
      return res.status(500).json({ error: 'Failed to initiate OAuth flow' });
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: LINKEDIN_CLIENT_ID,
      redirect_uri: LINKEDIN_REDIRECT_URI,
      state,
      scope: 'openid profile email w_member_social',
    });

    res.redirect(302, `${LINKEDIN_OAUTH_URL}?${params.toString()}`);
  } catch (error) {
    console.error('LinkedIn authorization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
