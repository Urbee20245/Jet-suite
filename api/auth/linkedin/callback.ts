// api/auth/linkedin/callback.ts
// Vercel Serverless Function - LinkedIn OAuth Callback

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!supabaseUrl || !supabaseServiceKey || !LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET || !APP_URL || !ENCRYPTION_KEY) {
  throw new Error('Missing required environment variables for LinkedIn OAuth callback setup.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const LINKEDIN_REDIRECT_URI = `${APP_URL}/api/auth/linkedin/callback`;
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY!), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function getAccessToken(code: string) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: LINKEDIN_REDIRECT_URI,
    client_id: LINKEDIN_CLIENT_ID!,
    client_secret: LINKEDIN_CLIENT_SECRET!,
  });

  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('LinkedIn token error:', error);
    throw new Error(`Failed to get access token: ${error.error_description || 'Unknown error'}`);
  }
  return await response.json();
}

async function getUserInfo(accessToken: string) {
  const response = await fetch(LINKEDIN_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get LinkedIn user info');
  }
  return await response.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('LinkedIn callback received, query params:', req.query);

    const { code, state, error: linkedinError, error_description } = req.query;

    if (linkedinError) {
      console.error('LinkedIn OAuth error:', linkedinError, error_description);
      return res.redirect(`${APP_URL}/business-details?error=linkedin_auth_failed&details=${linkedinError}`);
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
      .eq('platform', 'linkedin')
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

    if (!businessId) {
      console.error('Missing business_id in OAuth state');
      return res.redirect(`${APP_URL}${redirectPath}?error=missing_business_id`);
    }

    console.log('Valid state for user:', userId, 'business:', businessId);

    const tokens = await getAccessToken(codeStr);
    console.log('Got LinkedIn access token');

    const userInfo = await getUserInfo(tokens.access_token);
    console.log('Got LinkedIn user info:', userInfo.email);

    // LinkedIn access tokens expire in 60 days; refresh tokens in 365 days
    const expiresAt = new Date();
    if (tokens.expires_in) {
      expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 60);
    }

    const connectionData = {
      user_id: userId,
      business_id: businessId,
      platform: 'linkedin',
      access_token: encrypt(tokens.access_token),
      refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      token_expires_at: expiresAt.toISOString(),
      platform_user_id: userInfo.sub,
      platform_username: userInfo.name || userInfo.email,
      platform_page_id: userInfo.sub,
      metadata: {
        email: userInfo.email,
        picture: userInfo.picture,
        locale: userInfo.locale,
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
      .eq('platform', 'linkedin')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingConnection) {
      console.log('Updating existing LinkedIn connection');
      await supabase
        .from('social_connections')
        .update(connectionData)
        .eq('id', existingConnection.id);
    } else {
      console.log('Creating new LinkedIn connection');
      await supabase.from('social_connections').insert(connectionData);
    }

    // Clean up state
    await supabase.from('oauth_states').delete().eq('state', stateStr);
    console.log('LinkedIn connection saved successfully!');

    const separator = redirectPath.includes('?') ? '&' : '?';
    res.redirect(`${APP_URL}${redirectPath}${separator}connected=linkedin`);
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.redirect(
      `${APP_URL}/business-details?error=connection_failed&details=${encodeURIComponent(String(error))}`
    );
  }
}
