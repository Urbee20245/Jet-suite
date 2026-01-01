import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!supabaseUrl || !supabaseServiceKey || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !APP_URL || !ENCRYPTION_KEY) {
  throw new Error('Missing required environment variables for Google Business OAuth callback setup.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const GOOGLE_REDIRECT_URI = `${APP_URL}/api/auth/google-business/callback`;
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const MY_BUSINESS_API_BASE = 'https://mybusiness.googleapis.com/v4';

// Encryption helpers (AES-256-CBC)
function getKeyBuffer() {
  // Ensure 32-byte key for AES-256
  return crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', getKeyBuffer(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function getTokens(code: string) {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID!,
    client_secret: GOOGLE_CLIENT_SECRET!,
    code,
    grant_type: 'authorization_code',
    redirect_uri: GOOGLE_REDIRECT_URI,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Google token error:', error);
    throw new Error('Failed to get Google OAuth tokens');
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    token_type: string;
  }>;
}

async function getAccounts(accessToken: string) {
  const response = await fetch(`${MY_BUSINESS_API_BASE}/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Google My Business accounts error:', error);
    throw new Error('Failed to fetch Google Business accounts');
  }

  return response.json() as Promise<{ accounts?: Array<{ name: string; accountName?: string }> }>;
}

async function getLocations(accessToken: string, accountName: string) {
  const response = await fetch(`${MY_BUSINESS_API_BASE}/${accountName}/locations`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Google My Business locations error:', error);
    throw new Error('Failed to fetch Google Business locations');
  }

  return response.json() as Promise<{ locations?: Array<{ name: string; locationName?: string; title?: string }> }>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { code, state, error: googleError } = req.query;

    if (googleError) {
      console.error('Google OAuth error:', googleError);
      return res.redirect(
        `${APP_URL}/business-details?error=google_business_auth_failed&details=${googleError}`
      );
    }

    if (!code || !state) {
      console.error('Missing code or state in Google callback');
      return res.redirect(
        `${APP_URL}/business-details?error=missing_google_code_or_state`
      );
    }

    const codeStr = Array.isArray(code) ? code[0] : code;
    const stateStr = Array.isArray(state) ? state[0] : state;

    // Validate state from oauth_states
    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', stateStr)
      .eq('platform', 'google_business')
      .single();

    if (stateError || !stateData) {
      console.error('Invalid Google OAuth state:', stateError);
      return res.redirect(
        `${APP_URL}/business-details?error=invalid_google_state`
      );
    }

    if (new Date(stateData.expires_at) < new Date()) {
      await supabase.from('oauth_states').delete().eq('state', stateStr);
      console.error('Google OAuth state expired');
      return res.redirect(
        `${APP_URL}/business-details?error=google_state_expired`
      );
    }

    const userId = stateData.user_id as string;

    // Exchange code for tokens
    const tokens = await getTokens(codeStr);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + tokens.expires_in * 1000);

    // Fetch accounts and locations to pick a default location
    const accountsResp = await getAccounts(tokens.access_token);
    const account = accountsResp.accounts && accountsResp.accounts[0];

    if (!account) {
      console.error('No Google Business accounts found');
      return res.redirect(
        `${APP_URL}/business-details?error=no_google_accounts`
      );
    }

    const locationsResp = await getLocations(tokens.access_token, account.name);
    const location = locationsResp.locations && locationsResp.locations[0];

    if (!location) {
      console.error('No Google Business locations found');
      return res.redirect(
        `${APP_URL}/business-details?error=no_google_locations`
      );
    }

    const locationName = location.name; // e.g. "accounts/123456789/locations/987654321"
    const businessTitle = location.title || location.locationName || 'My Business';

    // Upsert into social_connections as platform 'google_business'
    const { data: existingConnection } = await supabase
      .from('social_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', 'google_business')
      .single();

    const payload = {
      user_id: userId,
      platform: 'google_business' as const,
      access_token: encrypt(tokens.access_token),
      refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      token_expires_at: expiresAt.toISOString(),
      platform_user_id: account.name, // accounts/xxxx
      platform_username: businessTitle,
      platform_page_id: locationName, // accounts/xxxx/locations/yyyy
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    if (existingConnection) {
      await supabase
        .from('social_connections')
        .update(payload)
        .eq('id', existingConnection.id);
    } else {
      await supabase.from('social_connections').insert(payload);
    }

    // Clean up state
    await supabase.from('oauth_states').delete().eq('state', stateStr);

    res.redirect(
      `${APP_URL}/business-details?success=google_business_connected`
    );
  } catch (error) {
    console.error('Google Business callback error:', error);
    res.redirect(
      `${APP_URL}/business-details?error=google_business_connection_failed&details=${encodeURIComponent(String(error))}`
    );
  }
}