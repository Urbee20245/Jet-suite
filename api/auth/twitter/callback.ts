// api/auth/twitter/callback.ts
// Vercel Serverless Function - Twitter/X OAuth 2.0 Callback

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!supabaseUrl || !supabaseServiceKey || !TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET || !APP_URL || !ENCRYPTION_KEY) {
  throw new Error('Missing required environment variables for Twitter OAuth callback setup.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TWITTER_REDIRECT_URI = `${APP_URL}/api/auth/twitter/callback`;
const TWITTER_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
const TWITTER_USERINFO_URL = 'https://api.twitter.com/2/users/me';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY!), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function getAccessToken(code: string, codeVerifier: string) {
  // Twitter OAuth 2.0 PKCE uses Basic Auth with client credentials
  const credentials = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');

  const params = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    redirect_uri: TWITTER_REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  const response = await fetch(TWITTER_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Twitter token error:', error);
    throw new Error(`Failed to get access token: ${error.error_description || error.error || 'Unknown error'}`);
  }
  return await response.json();
}

async function getUserInfo(accessToken: string) {
  const response = await fetch(`${TWITTER_USERINFO_URL}?user.fields=id,name,username,profile_image_url`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get Twitter user info');
  }
  const data = await response.json();
  return data.data || data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('Twitter callback received, query params:', req.query);

    const { code, state, error: twitterError, error_description } = req.query;

    if (twitterError) {
      console.error('Twitter OAuth error:', twitterError, error_description);
      return res.redirect(`${APP_URL}/business-details?error=twitter_auth_failed&details=${twitterError}`);
    }

    if (!code) {
      return res.redirect(`${APP_URL}/business-details?error=missing_code`);
    }

    if (!state) {
      return res.redirect(`${APP_URL}/business-details?error=missing_state`);
    }

    const codeStr = Array.isArray(code) ? code[0] : code;
    const stateStr = Array.isArray(state) ? state[0] : state;

    // Clean up expired oauth_states rows to avoid accumulation
    await supabase.from('oauth_states').delete().lt('expires_at', new Date().toISOString());

    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', stateStr)
      .eq('platform', 'twitter')
      .single();

    if (stateError || !stateData) {
      console.error('Invalid OAuth state:', stateError);
      return res.redirect(`${APP_URL}/business-details?error=invalid_state`);
    }

    const redirectUrl = stateData.metadata?.redirect_url || '/business-details';
    const redirectPath = redirectUrl.startsWith('/') ? redirectUrl : `/${redirectUrl}`;

    if (new Date(stateData.expires_at) < new Date()) {
      await supabase.from('oauth_states').delete().eq('state', stateStr);
      return res.redirect(`${APP_URL}${redirectPath}?error=state_expired`);
    }

    const userId = stateData.user_id;
    const businessId = stateData.business_id;
    const codeVerifier = stateData.metadata?.code_verifier;

    if (!businessId) {
      console.error('Missing business_id in OAuth state');
      return res.redirect(`${APP_URL}${redirectPath}?error=missing_business_id`);
    }

    if (!codeVerifier) {
      console.error('Missing code_verifier');
      return res.redirect(`${APP_URL}${redirectPath}?error=missing_code_verifier`);
    }

    console.log('Valid state for user:', userId, 'business:', businessId);

    const tokens = await getAccessToken(codeStr, codeVerifier);
    console.log('Got Twitter access token');

    const userInfo = await getUserInfo(tokens.access_token);
    console.log('Got Twitter user info:', userInfo.username);

    // Twitter OAuth 2.0 tokens expire in 2 hours; refresh tokens don't expire
    const expiresAt = new Date();
    if (tokens.expires_in) {
      expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);
    } else {
      expiresAt.setHours(expiresAt.getHours() + 2);
    }

    const connectionData = {
      user_id: userId,
      business_id: businessId,
      platform: 'twitter',
      access_token: encrypt(tokens.access_token),
      refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      token_expires_at: expiresAt.toISOString(),
      platform_user_id: userInfo.id,
      platform_username: userInfo.username,
      platform_page_id: userInfo.id,
      metadata: {
        name: userInfo.name,
        profile_image_url: userInfo.profile_image_url,
      },
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    // Upsert: update if existing record (active or inactive), insert if new
    const { data: existingConnection } = await supabase
      .from('social_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .eq('platform', 'twitter')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingConnection) {
      console.log('Updating existing Twitter connection');
      await supabase
        .from('social_connections')
        .update(connectionData)
        .eq('id', existingConnection.id);
    } else {
      console.log('Creating new Twitter connection');
      await supabase.from('social_connections').insert(connectionData);
    }

    // Clean up state
    await supabase.from('oauth_states').delete().eq('state', stateStr);
    console.log('Twitter connection saved successfully!');

    const separator = redirectPath.includes('?') ? '&' : '?';
    res.redirect(`${APP_URL}${redirectPath}${separator}connected=twitter`);
  } catch (error) {
    console.error('Twitter callback error:', error);
    res.redirect(
      `${APP_URL}/business-details?error=connection_failed&details=${encodeURIComponent(String(error))}`
    );
  }
}
