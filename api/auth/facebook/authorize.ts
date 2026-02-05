// api/auth/facebook/authorize.ts
// Vercel Serverless Function

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Check for required environment variables (support both NEXT_PUBLIC_ and non-prefixed)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;

if (!supabaseUrl || !supabaseServiceKey || !FACEBOOK_APP_ID || !APP_URL) {
  throw new Error('Missing required environment variables for Facebook OAuth setup.');
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey
);

// Facebook OAuth configuration
const FACEBOOK_REDIRECT_URI = `${APP_URL}/api/auth/facebook/callback`;
const FACEBOOK_OAUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth';

// Generate state token
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
        platform: 'facebook',
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Failed to store OAuth state:', insertError);
      return res.status(500).json({ error: 'Failed to initiate OAuth flow' });
    }

    // Build Facebook OAuth URL with basic permissions (Development Mode)
    // NOTE: For full posting functionality, these permissions require Facebook App Review:
    // - pages_manage_posts (post to Facebook Pages)
    // - pages_read_engagement (read metrics)
    // - instagram_basic (Instagram access)
    // - instagram_content_publish (post to Instagram)
    // Once approved, add them back to the scope string below
    const params = new URLSearchParams({
      client_id: FACEBOOK_APP_ID,
      redirect_uri: FACEBOOK_REDIRECT_URI,
      state: state,
      scope: 'public_profile,pages_show_list', // Basic permissions that work without review
      response_type: 'code',
    });

    const authUrl = `${FACEBOOK_OAUTH_URL}?${params.toString()}`;

    // Redirect user to Facebook
    res.redirect(302, authUrl);
  } catch (error) {
    console.error('Facebook authorization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}