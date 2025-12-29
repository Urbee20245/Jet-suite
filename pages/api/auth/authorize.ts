// api/auth/facebook/authorize.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createFacebookOAuthService } from '../../../services/oauth/facebookOAuth';
import { generateStateToken } from '../../../utils/crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Create Facebook OAuth service
    const facebookOAuth = createFacebookOAuthService();

    // Get authorization URL
    const authUrl = facebookOAuth.getAuthorizationUrl(state);

    // Redirect user to Facebook
    res.redirect(authUrl);
  } catch (error) {
    console.error('Facebook authorization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
