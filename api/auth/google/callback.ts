// api/auth/google/callback.ts
// Vercel Serverless Function - Google Business Profile OAuth Callback

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!supabaseUrl || !supabaseServiceKey || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !APP_URL || !ENCRYPTION_KEY) {
  throw new Error('Missing required environment variables for Google OAuth callback setup.');
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey
);

// Google API configuration
const GOOGLE_REDIRECT_URI = `${APP_URL}/api/auth/google/callback`;
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_MYBUSINESS_URL = 'https://mybusinessbusinessinformation.googleapis.com/v1';

// Encryption functions
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY!), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Google API functions
async function getAccessToken(code: string) {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID!,
    client_secret: GOOGLE_CLIENT_SECRET!,
    redirect_uri: GOOGLE_REDIRECT_URI,
    code: code,
    grant_type: 'authorization_code',
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Google token error:', error);
    throw new Error(`Failed to get access token: ${error.error_description || 'Unknown error'}`);
  }
  return await response.json();
}

async function getUserInfo(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }
  return await response.json();
}

async function getBusinessAccounts(accessToken: string) {
  try {
    // Get list of accounts
    const response = await fetch(`${GOOGLE_MYBUSINESS_URL}/accounts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error('Failed to get business accounts');
      return [];
    }

    const data = await response.json();
    return data.accounts || [];
  } catch (error) {
    console.error('Error fetching business accounts:', error);
    return [];
  }
}

async function getBusinessLocations(accessToken: string, accountName: string) {
  try {
    const response = await fetch(`${GOOGLE_MYBUSINESS_URL}/${accountName}/locations`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error('Failed to get business locations');
      return [];
    }

    const data = await response.json();
    return data.locations || [];
  } catch (error) {
    console.error('Error fetching business locations:', error);
    return [];
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    console.log('Google callback received, query params:', req.query);
    
    const { code, state, error: googleError, error_description } = req.query;

    // Handle Google OAuth errors
    if (googleError) {
      console.error('Google OAuth error:', googleError, error_description);
      return res.redirect(
        `${APP_URL}/business-details?error=google_auth_failed&details=${googleError}`
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
      .eq('platform', 'google_business')
      .single();

    if (stateError || !stateData) {
      console.error('Invalid OAuth state:', stateError);
      return res.redirect(
        `${APP_URL}/business-details?error=invalid_state`
      );
    }

    // Check if state has expired
    if (new Date(stateData.expires_at) < new Date()) {
      await supabase.from('oauth_states').delete().eq('state', stateStr);
      console.error('State expired');
      return res.redirect(
        `${APP_URL}/business-details?error=state_expired`
      );
    }

    const userId = stateData.user_id;
    console.log('Valid state for user:', userId);

    // Exchange code for access token
    console.log('Exchanging code for access token...');
    const tokens = await getAccessToken(codeStr);
    console.log('Got access token');

    // Get user info
    console.log('Getting user info...');
    const userInfo = await getUserInfo(tokens.access_token);
    console.log('Got user info:', userInfo.email);

    // Get business accounts
    console.log('Getting business accounts...');
    const accounts = await getBusinessAccounts(tokens.access_token);
    console.log('Got accounts:', accounts.length);

    let primaryLocation = null;
    let accountName = null;

    if (accounts.length > 0) {
      // Get locations for first account
      accountName = accounts[0].name;
      console.log('Getting locations for account:', accountName);
      const locations = await getBusinessLocations(tokens.access_token, accountName);
      console.log('Got locations:', locations.length);
      
      if (locations.length > 0) {
        primaryLocation = locations[0];
        console.log('Primary location:', primaryLocation.name);
      }
    }

    // Calculate token expiration
    const expiresAt = new Date();
    if (tokens.expires_in) {
      expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);
    } else {
      // Default to 1 hour if not provided
      expiresAt.setHours(expiresAt.getHours() + 1);
    }

    // Prepare connection data
    const connectionData = {
      user_id: userId,
      platform: 'google_business',
      access_token: encrypt(tokens.access_token),
      refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      token_expires_at: expiresAt.toISOString(),
      platform_user_id: userInfo.id || userInfo.email,
      platform_username: userInfo.email,
      platform_page_id: accountName || null,
      metadata: {
        account_name: accountName,
        location_name: primaryLocation?.name,
        location_count: accounts.length > 0 ? (await getBusinessLocations(tokens.access_token, accountName)).length : 0,
      },
      is_active: true,
    };

    // Save or update connection
    const { data: existingConnection } = await supabase
      .from('social_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', 'google_business')
      .single();

    if (existingConnection) {
      console.log('Updating existing Google Business connection');
      await supabase
        .from('social_connections')
        .update({
          ...connectionData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id);
    } else {
      console.log('Creating new Google Business connection');
      await supabase
        .from('social_connections')
        .insert(connectionData);
    }

    // Clean up state
    await supabase.from('oauth_states').delete().eq('state', stateStr);
    console.log('Connection saved successfully!');

    // Redirect back to app with success
    res.redirect(
      `${APP_URL}/business-details?success=google_business_connected`
    );
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(
      `${APP_URL}/business-details?error=connection_failed&details=${encodeURIComponent(String(error))}`
    );
  }
}
