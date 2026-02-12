// api/auth/tiktok/callback.ts
// Vercel Serverless Function - TikTok OAuth Callback

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Check for required environment variables (support both NEXT_PUBLIC_ and non-prefixed)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!supabaseUrl || !supabaseServiceKey || !TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET || !APP_URL || !ENCRYPTION_KEY) {
  throw new Error('Missing required environment variables for TikTok OAuth callback setup.');
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey
);

// TikTok API configuration
const TIKTOK_REDIRECT_URI = `${APP_URL}/api/auth/tiktok/callback`;
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_USERINFO_URL = 'https://open.tiktokapis.com/v2/user/info/';

// Encryption functions
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY!), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// TikTok API functions
async function getAccessToken(code: string, codeVerifier: string) {
  const params = new URLSearchParams({
    client_key: TIKTOK_CLIENT_KEY!,
    client_secret: TIKTOK_CLIENT_SECRET!,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: TIKTOK_REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  const response = await fetch(TIKTOK_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('TikTok token error:', error);
    throw new Error(`Failed to get access token: ${error.error_description || error.message || 'Unknown error'}`);
  }
  return await response.json();
}

async function getUserInfo(accessToken: string) {
  const params = new URLSearchParams({
    fields: 'open_id,union_id,avatar_url,display_name,username',
  });

  const response = await fetch(`${TIKTOK_USERINFO_URL}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('TikTok user info error:', error);
    throw new Error('Failed to get user info');
  }
  
  const data = await response.json();
  return data.data?.user || data;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    console.log('TikTok callback received, query params:', req.query);
    
    const { code, state, error: tiktokError, error_description } = req.query;

    // Handle TikTok OAuth errors
    if (tiktokError) {
      console.error('TikTok OAuth error:', tiktokError, error_description);
      return res.redirect(
        `${APP_URL}/business-details?error=tiktok_auth_failed&details=${tiktokError}`
      );
    }

    // Validate code parameter
    if (!code) {
      console.error('Missing code parameter');
      return res.redirect(
        `${APP_URL}/business-details?error=missing_code`
      );
    }

    // Validate state parameter
    if (!state) {
      console.error('Missing state parameter');
      return res.redirect(
        `${APP_URL}/business-details?error=missing_state`
      );
    }

    // Convert to strings
    const codeStr = Array.isArray(code) ? code[0] : code;
    const stateStr = Array.isArray(state) ? state[0] : state;

    console.log('Code:', codeStr?.substring(0, 20) + '...');
    console.log('State:', stateStr);

    // Verify state token (CSRF protection)
    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', stateStr)
      .eq('platform', 'tiktok')
      .single();

    if (stateError || !stateData) {
      console.error('Invalid OAuth state:', stateError);
      return res.redirect(
        `${APP_URL}/business-details?error=invalid_state`
      );
    }

    // Get redirect URL from state metadata (default to /business-details if not provided)
    const redirectUrl = stateData.metadata?.redirect_url || '/business-details';
    const redirectPath = redirectUrl.startsWith('/') ? redirectUrl : `/${redirectUrl}`;

    // Check if state has expired
    if (new Date(stateData.expires_at) < new Date()) {
      await supabase.from('oauth_states').delete().eq('state', stateStr);
      console.error('State expired');
      return res.redirect(
        `${APP_URL}${redirectPath}?error=state_expired`
      );
    }

    const userId = stateData.user_id;
    const codeVerifier = stateData.metadata?.code_verifier;

    if (!codeVerifier) {
      console.error('Missing code_verifier');
      return res.redirect(
        `${APP_URL}${redirectPath}?error=missing_code_verifier`
      );
    }

    console.log('Valid state for user:', userId);

    // Exchange code for access token
    console.log('Exchanging code for access token...');
    const tokens = await getAccessToken(codeStr, codeVerifier);
    console.log('Got access token');

    // Get user info
    console.log('Getting user info...');
    const userInfo = await getUserInfo(tokens.access_token);
    console.log('Got user info:', userInfo.display_name || userInfo.username);

    // Calculate token expiration
    const expiresAt = new Date();
    if (tokens.expires_in) {
      expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);
    } else {
      // TikTok tokens typically expire in 24 hours
      expiresAt.setHours(expiresAt.getHours() + 24);
    }

    // Prepare connection data
    const connectionData = {
      user_id: userId,
      platform: 'tiktok',
      access_token: encrypt(tokens.access_token),
      refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      token_expires_at: expiresAt.toISOString(),
      platform_user_id: userInfo.open_id || userInfo.union_id,
      platform_username: userInfo.username || userInfo.display_name,
      platform_page_id: userInfo.open_id,
      metadata: {
        display_name: userInfo.display_name,
        avatar_url: userInfo.avatar_url,
        union_id: userInfo.union_id,
      },
      is_active: true,
    };

    // Save or update connection
    const { data: existingConnection } = await supabase
      .from('social_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', 'tiktok')
      .maybeSingle();

    if (existingConnection) {
      console.log('Updating existing TikTok connection');
      await supabase
        .from('social_connections')
        .update({
          ...connectionData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id);
    } else {
      console.log('Creating new TikTok connection');
      await supabase
        .from('social_connections')
        .insert(connectionData);
    }

    // Clean up state
    await supabase.from('oauth_states').delete().eq('state', stateStr);
    console.log('Connection saved successfully!');

    // Redirect back to the original page with success
    const separator = redirectPath.includes('?') ? '&' : '?';
    res.redirect(
      `${APP_URL}${redirectPath}${separator}success=tiktok_connected`
    );
  } catch (error) {
    console.error('TikTok callback error:', error);
    // Try to get redirect URL from state if possible, otherwise use default
    const redirectPath = '/business-details';
    res.redirect(
      `${APP_URL}${redirectPath}?error=connection_failed&details=${encodeURIComponent(String(error))}`
    );
  }
}
