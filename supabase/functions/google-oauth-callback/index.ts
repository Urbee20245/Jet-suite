/**
 * Google OAuth Callback - Supabase Edge Function
 * Handles the OAuth callback from Google Business Profile
 *
 * This function:
 * 1. Validates the OAuth state (CSRF protection)
 * 2. Exchanges authorization code for access/refresh tokens
 * 3. Fetches user info and business account details
 * 4. Encrypts and stores tokens in the database
 * 5. Redirects back to the application
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encrypt } from '../_shared/encryption.ts';
import { getCorsHeaders, handleCorsPreflightRequest, errorResponse } from '../_shared/cors.ts';

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const APP_URL = Deno.env.get('APP_URL') || 'https://www.getjetsuite.com';

// Google API endpoints
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_MYBUSINESS_URL = 'https://mybusinessbusinessinformation.googleapis.com/v1';
// Use environment variable or default to production URL
const GOOGLE_REDIRECT_URI = Deno.env.get('GOOGLE_REDIRECT_URI') || 'https://www.getjetsuite.com/api/auth/google/callback';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface UserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  picture: string;
}

interface BusinessAccount {
  name: string;
  accountName: string;
  type: string;
}

interface BusinessLocation {
  name: string;
  title?: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
  };
}

/**
 * Exchange authorization code for access/refresh tokens
 */
async function getAccessToken(code: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
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

/**
 * Get user info from Google
 */
async function getUserInfo(accessToken: string): Promise<UserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return await response.json();
}

/**
 * Get business accounts from Google Business Profile
 */
async function getBusinessAccounts(accessToken: string): Promise<BusinessAccount[]> {
  try {
    const response = await fetch(`${GOOGLE_MYBUSINESS_URL}/accounts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error('Failed to get business accounts:', response.status);
      return [];
    }

    const data = await response.json();
    return data.accounts || [];
  } catch (error) {
    console.error('Error fetching business accounts:', error);
    return [];
  }
}

/**
 * Get business locations for an account
 */
async function getBusinessLocations(
  accessToken: string,
  accountName: string
): Promise<BusinessLocation[]> {
  try {
    const response = await fetch(`${GOOGLE_MYBUSINESS_URL}/${accountName}/locations`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error('Failed to get business locations:', response.status);
      return [];
    }

    const data = await response.json();
    return data.locations || [];
  } catch (error) {
    console.error('Error fetching business locations:', error);
    return [];
  }
}

/**
 * Create a redirect response
 */
function redirectResponse(url: string, origin?: string | null): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      ...getCorsHeaders(origin),
    },
  });
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const googleError = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    console.log('Google OAuth callback received');

    // Handle Google OAuth errors
    if (googleError) {
      console.error('Google OAuth error:', googleError, errorDescription);
      return redirectResponse(
        `${APP_URL}/business-details?error=google_auth_failed&details=${googleError}`,
        origin
      );
    }

    // Validate required parameters
    if (!code) {
      console.error('Missing code parameter');
      return redirectResponse(
        `${APP_URL}/business-details?error=missing_code`,
        origin
      );
    }

    if (!state) {
      console.error('Missing state parameter');
      return redirectResponse(
        `${APP_URL}/business-details?error=missing_state`,
        origin
      );
    }

    console.log('Code:', code.substring(0, 20) + '...');
    console.log('State:', state);

    // Verify state token (CSRF protection)
    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('platform', 'google_business')
      .single();

    if (stateError || !stateData) {
      console.error('Invalid OAuth state:', stateError);
      return redirectResponse(
        `${APP_URL}/business-details?error=invalid_state`,
        origin
      );
    }

    // Get redirect URL from state metadata
    const redirectUrl = stateData.metadata?.redirect_url || '/business-details';
    const redirectPath = redirectUrl.startsWith('/') ? redirectUrl : `/${redirectUrl}`;

    // Check if state has expired (10 minutes)
    if (new Date(stateData.expires_at) < new Date()) {
      await supabase.from('oauth_states').delete().eq('state', state);
      console.error('State expired');
      return redirectResponse(
        `${APP_URL}${redirectPath}?error=state_expired`,
        origin
      );
    }

    const userId = stateData.user_id;
    const businessId = stateData.business_id;

    if (!businessId) {
      console.error('Missing business_id in OAuth state');
      return redirectResponse(
        `${APP_URL}${redirectPath}?error=missing_business_id`,
        origin
      );
    }

    console.log('Valid state for user:', userId, 'business:', businessId);

    // Exchange code for access token
    console.log('Exchanging code for access token...');
    const tokens = await getAccessToken(code);
    console.log('Got access token, has refresh token:', !!tokens.refresh_token);

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
    let locationCount = 0;

    if (accounts.length > 0) {
      accountName = accounts[0].name;
      console.log('Getting locations for account:', accountName);
      const locations = await getBusinessLocations(tokens.access_token, accountName);
      locationCount = locations.length;
      console.log('Got locations:', locationCount);

      if (locations.length > 0) {
        primaryLocation = locations[0];
        console.log('Primary location:', primaryLocation.name);
      }
    }

    // Calculate token expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 3600));

    // Encrypt tokens
    const encryptedAccessToken = await encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token
      ? await encrypt(tokens.refresh_token)
      : null;

    // Prepare connection data
    const connectionData = {
      user_id: userId,
      business_id: businessId,
      platform: 'google_business',
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      token_expires_at: expiresAt.toISOString(),
      platform_user_id: userInfo.id || userInfo.email,
      platform_username: userInfo.email,
      platform_page_id: accountName || null,
      metadata: {
        account_name: accountName,
        location_name: primaryLocation?.name,
        location_count: locationCount,
        has_refresh_token: !!tokens.refresh_token,
      },
      is_active: true,
    };

    // Check for existing connection (active or inactive)
    const { data: existingConnection } = await supabase
      .from('social_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .eq('platform', 'google_business')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

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
    await supabase.from('oauth_states').delete().eq('state', state);
    console.log('Connection saved successfully!');

    // Redirect back to the original page with success
    const separator = redirectPath.includes('?') ? '&' : '?';
    return redirectResponse(
      `${APP_URL}${redirectPath}${separator}success=google_business_connected`,
      origin
    );
  } catch (error) {
    console.error('Google callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return redirectResponse(
      `${APP_URL}/business-details?error=connection_failed&details=${encodeURIComponent(errorMessage)}`,
      origin
    );
  }
});
