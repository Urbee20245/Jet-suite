/**
 * Refresh Google Token - Supabase Edge Function
 * Automatically refreshes expired Google OAuth tokens
 *
 * This function:
 * 1. Accepts a connection ID
 * 2. Validates the connection exists and has a refresh token
 * 3. Calls Google OAuth to refresh the access token
 * 4. Encrypts and updates the new token in the database
 * 5. Returns the new expiration time
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encrypt, decrypt } from '../_shared/encryption.ts';
import {
  getCorsHeaders,
  handleCorsPreflightRequest,
  jsonResponse,
  errorResponse,
} from '../_shared/cors.ts';

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Google OAuth token endpoint
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

/**
 * Refresh Google OAuth token using refresh token
 */
async function refreshGoogleToken(refreshToken: string): Promise<RefreshTokenResponse> {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Google refresh token error:', error);
    throw new Error(
      `Google refresh failed: ${error.error_description || error.error || 'Unknown error'}`
    );
  }

  return await response.json();
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, origin);
  }

  try {
    const body = await req.json();
    const { connectionId } = body;

    if (!connectionId) {
      return errorResponse('Missing connectionId parameter', 400, origin);
    }

    console.log('Refreshing token for connection:', connectionId);

    // Get the connection from database
    const { data: connection, error: fetchError } = await supabase
      .from('social_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('is_active', true)
      .single();

    if (fetchError || !connection) {
      console.error('Connection not found:', fetchError);
      return errorResponse('Connection not found', 404, origin);
    }

    // Verify it's a Google Business connection
    if (connection.platform !== 'google_business') {
      return jsonResponse(
        {
          error: `Token refresh not supported for ${connection.platform}`,
          needs_reconnect: connection.platform === 'facebook' || connection.platform === 'instagram',
        },
        400,
        origin
      );
    }

    // Check if refresh token exists
    if (!connection.refresh_token) {
      console.error('No refresh token available for connection:', connectionId);
      return jsonResponse(
        {
          error: 'No refresh token available. User needs to reconnect.',
          needs_reconnect: true,
        },
        400,
        origin
      );
    }

    // Decrypt the refresh token
    const decryptedRefreshToken = await decrypt(connection.refresh_token);

    // Call Google OAuth to refresh the token
    console.log('Calling Google OAuth to refresh token...');
    const tokens = await refreshGoogleToken(decryptedRefreshToken);
    console.log('Token refreshed successfully');

    // Calculate new expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 3600));

    // Encrypt the new access token
    const encryptedAccessToken = await encrypt(tokens.access_token);

    // Update the connection in database
    const updateData = {
      access_token: encryptedAccessToken,
      token_expires_at: expiresAt.toISOString(),
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('social_connections')
      .update(updateData)
      .eq('id', connectionId);

    if (updateError) {
      console.error('Failed to update connection:', updateError);
      throw updateError;
    }

    console.log('Connection updated with new token');

    // Return success with new expiration time
    return jsonResponse(
      {
        success: true,
        token_expires_at: expiresAt.toISOString(),
        message: 'Token refreshed successfully',
      },
      200,
      origin
    );
  } catch (error) {
    console.error('Token refresh error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if it's a refresh token expiration error
    const needsReconnect =
      errorMessage.includes('invalid_grant') ||
      errorMessage.includes('Token has been expired or revoked');

    return jsonResponse(
      {
        error: 'Failed to refresh token',
        message: errorMessage,
        needs_reconnect: needsReconnect,
      },
      500,
      origin
    );
  }
});
