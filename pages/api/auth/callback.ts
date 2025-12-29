// pages/api/auth/facebook/callback.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createFacebookOAuthService } from '../../../../services/oauth/facebookOAuth';
import { encrypt } from '../../../../utils/crypto';

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
    const { code, state, error: fbError, error_description } = req.query;

    // Handle Facebook OAuth errors
    if (fbError) {
      console.error('Facebook OAuth error:', fbError, error_description);
      return res.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/business-details?error=facebook_auth_failed`
      );
    }

    // Validate required parameters
    if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
      return res.status(400).json({ error: 'Invalid callback parameters' });
    }

    // Verify state token (CSRF protection)
    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('platform', 'facebook')
      .single();

    if (stateError || !stateData) {
      console.error('Invalid OAuth state:', stateError);
      return res.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/business-details?error=invalid_state`
      );
    }

    // Check if state has expired
    if (new Date(stateData.expires_at) < new Date()) {
      await supabase.from('oauth_states').delete().eq('state', state);
      return res.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/business-details?error=state_expired`
      );
    }

    const userId = stateData.user_id;

    // Create Facebook OAuth service
    const facebookOAuth = createFacebookOAuthService();

    // Exchange code for access token
    const tokens = await facebookOAuth.getAccessToken(code);

    // Get long-lived token (60 days)
    const longLivedTokens = await facebookOAuth.getLongLivedToken(tokens.access_token);

    // Get user profile
    const userProfile = await facebookOAuth.getUserProfile(longLivedTokens.access_token);

    // Get user's Facebook pages
    const pages = await facebookOAuth.getUserPages(longLivedTokens.access_token);

    // Calculate token expiration (60 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('social_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', 'facebook')
      .single();

    if (existingConnection) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from('social_connections')
        .update({
          access_token: encrypt(longLivedTokens.access_token),
          token_expires_at: expiresAt.toISOString(),
          platform_user_id: userProfile.id,
          platform_username: userProfile.name,
          platform_page_id: pages.length > 0 ? pages[0].id : null,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Create new connection
      const { error: insertError } = await supabase
        .from('social_connections')
        .insert({
          user_id: userId,
          platform: 'facebook',
          access_token: encrypt(longLivedTokens.access_token),
          token_expires_at: expiresAt.toISOString(),
          platform_user_id: userProfile.id,
          platform_username: userProfile.name,
          platform_page_id: pages.length > 0 ? pages[0].id : null,
          is_active: true,
        });

      if (insertError) {
        throw insertError;
      }
    }

    // Clean up state
    await supabase.from('oauth_states').delete().eq('state', state);

    // Redirect back to app with success
    res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/business-details?success=facebook_connected`
    );
  } catch (error) {
    console.error('Facebook callback error:', error);
    res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/business-details?error=connection_failed`
    );
  }
}
