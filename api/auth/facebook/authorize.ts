// api/auth/facebook/authorize.ts
// Vercel Serverless Function

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Facebook OAuth configuration
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`;
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

    // Build Facebook OAuth URL with Instagram permissions
    const params = new URLSearchParams({
      client_id: FACEBOOK_APP_ID,
      redirect_uri: FACEBOOK_REDIRECT_URI,
      state: state,
      scope: 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish',
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
