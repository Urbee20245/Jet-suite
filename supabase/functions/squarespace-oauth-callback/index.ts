/**
 * Squarespace OAuth Callback - Supabase Edge Function
 *
 * This function handles the OAuth 2.0 callback from Squarespace.
 *
 * Squarespace OAuth Flow:
 * 1. User initiates OAuth in your app
 * 2. App creates state token and stores it in oauth_states table
 * 3. App redirects user to Squarespace authorization URL
 * 4. User authorizes the app
 * 5. Squarespace redirects back to THIS function with code & state
 * 6. This function exchanges code for access/refresh tokens
 * 7. Tokens are encrypted and stored in website_connections table
 * 8. User is redirected back to the app
 *
 * Squarespace API Documentation:
 * https://developers.squarespace.com/squarespace-apis/authentication/oauth
 *
 * HOW IT WORKS:
 * 1. Validates OAuth state parameter (CSRF protection)
 * 2. Exchanges authorization code for access/refresh tokens
 * 3. Fetches website information from Squarespace
 * 4. Encrypts and stores tokens in database
 * 5. Redirects back to application
 *
 * QUERY PARAMETERS:
 * - code: Authorization code from Squarespace
 * - state: CSRF token to validate
 *
 * RESPONSE:
 * Redirects to app URL with success or error parameter
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encrypt } from '../_shared/encryption.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SQUARESPACE_CLIENT_ID = Deno.env.get('SQUARESPACE_CLIENT_ID')!;
const SQUARESPACE_CLIENT_SECRET = Deno.env.get('SQUARESPACE_CLIENT_SECRET')!;
const SQUARESPACE_REDIRECT_URI = Deno.env.get('SQUARESPACE_REDIRECT_URI')!;
const APP_URL = Deno.env.get('APP_URL') || 'https://www.getjetsuite.com';

// Squarespace API endpoints
const SQUARESPACE_TOKEN_URL = 'https://login.squarespace.com/api/1/login/oauth/provider/tokens';
const SQUARESPACE_API_BASE = 'https://api.squarespace.com/1.0';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Squarespace token response
 */
interface SquarespaceTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Squarespace website info
 */
interface SquarespaceWebsiteInfo {
  id: string;
  title: string;
  siteUrl: string;
  description?: string;
}

/**
 * Exchange authorization code for access/refresh tokens
 */
async function getAccessToken(code: string): Promise<SquarespaceTokenResponse> {
  console.log('Exchanging code for access token...');

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    client_id: SQUARESPACE_CLIENT_ID,
    client_secret: SQUARESPACE_CLIENT_SECRET,
    redirect_uri: SQUARESPACE_REDIRECT_URI,
  });

  const response = await fetch(SQUARESPACE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Squarespace token error:', error);
    throw new Error(`Failed to get access token: ${error.error_description || 'Unknown error'}`);
  }

  const tokens = await response.json();
  console.log('Access token received');

  return tokens;
}

/**
 * Get website info from Squarespace
 */
async function getWebsiteInfo(accessToken: string): Promise<SquarespaceWebsiteInfo> {
  console.log('Fetching website info from Squarespace...');

  const response = await fetch(`${SQUARESPACE_API_BASE}/sites`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to get website info:', error);
    throw new Error('Failed to fetch website information');
  }

  const data = await response.json();

  // Squarespace API returns an array of sites
  // We'll use the first site
  if (!data.sites || data.sites.length === 0) {
    throw new Error('No Squarespace websites found');
  }

  const site = data.sites[0];
  console.log('Website info retrieved:', site.title);

  return {
    id: site.id,
    title: site.title,
    siteUrl: site.siteUrl,
    description: site.description,
  };
}

/**
 * Create a redirect response
 */
function redirectResponse(url: string, origin?: string | null): Response {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': url,
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
    console.log('=== Squarespace OAuth Callback ===');

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Handle OAuth errors from Squarespace
    if (error) {
      console.error('Squarespace OAuth error:', error, errorDescription);
      return redirectResponse(
        `${APP_URL}/blog-settings?error=squarespace_auth_failed&details=${error}`,
        origin
      );
    }

    // Validate required parameters
    if (!code) {
      console.error('Missing code parameter');
      return redirectResponse(
        `${APP_URL}/blog-settings?error=missing_code`,
        origin
      );
    }

    if (!state) {
      console.error('Missing state parameter');
      return redirectResponse(
        `${APP_URL}/blog-settings?error=missing_state`,
        origin
      );
    }

    console.log('Code received:', code.substring(0, 20) + '...');
    console.log('State:', state);

    // Verify state token (CSRF protection)
    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('platform', 'squarespace')
      .single();

    if (stateError || !stateData) {
      console.error('Invalid OAuth state:', stateError);
      return redirectResponse(
        `${APP_URL}/blog-settings?error=invalid_state`,
        origin
      );
    }

    // Get redirect URL from state metadata
    const redirectUrl = stateData.metadata?.redirect_url || '/blog-settings';
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

    console.log('Valid state for user:', userId);

    // Exchange code for access token
    let tokens: SquarespaceTokenResponse;
    try {
      tokens = await getAccessToken(code);
    } catch (error) {
      console.error('Token exchange failed:', error);
      return redirectResponse(
        `${APP_URL}${redirectPath}?error=token_exchange_failed`,
        origin
      );
    }

    // Get website info
    let websiteInfo: SquarespaceWebsiteInfo;
    try {
      websiteInfo = await getWebsiteInfo(tokens.access_token);
    } catch (error) {
      console.error('Failed to get website info:', error);
      return redirectResponse(
        `${APP_URL}${redirectPath}?error=website_info_failed`,
        origin
      );
    }

    // Calculate token expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 3600));

    // Encrypt tokens
    console.log('Encrypting tokens...');
    const encryptedAccessToken = await encrypt(tokens.access_token);
    const encryptedRefreshToken = await encrypt(tokens.refresh_token);

    // Prepare connection data
    const connectionData = {
      user_id: userId,
      business_id: businessId || null,
      platform: 'squarespace',
      website_url: websiteInfo.siteUrl,
      site_name: websiteInfo.title,
      wordpress_username: null,
      wordpress_app_password: null,
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      token_expires_at: expiresAt.toISOString(),
      metadata: {
        site_id: websiteInfo.id,
        description: websiteInfo.description,
      },
      is_active: true,
      last_verified_at: new Date().toISOString(),
    };

    // Check for existing connection
    const { data: existingConnection } = await supabase
      .from('website_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', 'squarespace')
      .eq('website_url', websiteInfo.siteUrl)
      .maybeSingle();

    if (existingConnection) {
      console.log('Updating existing Squarespace connection');
      await supabase
        .from('website_connections')
        .update(connectionData)
        .eq('id', existingConnection.id);
    } else {
      console.log('Creating new Squarespace connection');
      await supabase
        .from('website_connections')
        .insert(connectionData);
    }

    // Clean up state
    await supabase.from('oauth_states').delete().eq('state', state);
    console.log('Connection saved successfully!');

    // Redirect back to the app with success
    const separator = redirectPath.includes('?') ? '&' : '?';
    return redirectResponse(
      `${APP_URL}${redirectPath}${separator}success=squarespace_connected`,
      origin
    );
  } catch (error) {
    console.error('Squarespace callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return redirectResponse(
      `${APP_URL}/blog-settings?error=connection_failed&details=${encodeURIComponent(errorMessage)}`,
      origin
    );
  }
});
