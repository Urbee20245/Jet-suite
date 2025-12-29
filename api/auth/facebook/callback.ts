// api/auth/facebook/callback.ts
// Vercel Serverless Function

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Facebook API configuration
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const FACEBOOK_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`;
const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token';
const FACEBOOK_GRAPH_URL = 'https://graph.facebook.com/v18.0';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

// Encryption functions
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Facebook API functions
async function getAccessToken(code: string) {
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    client_secret: FACEBOOK_APP_SECRET,
    redirect_uri: FACEBOOK_REDIRECT_URI,
    code: code,
  });

  const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to get access token');
  }
  return await response.json();
}

async function getLongLivedToken(shortToken: string) {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: FACEBOOK_APP_ID,
    client_secret: FACEBOOK_APP_SECRET,
    fb_exchange_token: shortToken,
  });

  const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to get long-lived token');
  }
  return await response.json();
}

async function getUserProfile(accessToken: string) {
  const params = new URLSearchParams({
    fields: 'id,name,email',
    access_token: accessToken,
  });

  const response = await fetch(`${FACEBOOK_GRAPH_URL}/me?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to get user profile');
  }
  return await response.json();
}

async function getUserPages(accessToken: string) {
  const params = new URLSearchParams({
    access_token: accessToken,
  });

  const response = await fetch(`${FACEBOOK_GRAPH_URL}/me/accounts?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to get user pages');
  }
  const data = await response.json();
  return data.data || [];
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
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

    // Exchange code for access token
    const tokens = await getAccessToken(code);

    // Get long-lived token (60 days)
    const longLivedTokens = await getLongLivedToken(tokens.access_token);

    // Get user profile
    const userProfile = await getUserProfile(longLivedTokens.access_token);

    // Get user's Facebook pages
    const pages = await getUserPages(longLivedTokens.access_token);

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
