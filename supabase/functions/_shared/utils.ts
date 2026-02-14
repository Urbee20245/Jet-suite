/**
 * Shared utilities for Supabase Edge Functions
 * Blog Publishing System - WordPress, Squarespace, Wix
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decrypt, encrypt } from './encryption.ts';

/**
 * Initialize Supabase client with service role
 * This gives full access to the database, bypassing RLS
 */
export function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Validate and normalize URL
 * Ensures URL has proper format and protocol
 */
export function validateUrl(url: string): string {
  try {
    // Remove trailing slash
    let cleanUrl = url.trim().replace(/\/$/, '');

    // Add https:// if no protocol
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    // Validate URL format
    const urlObj = new URL(cleanUrl);
    return urlObj.toString().replace(/\/$/, '');
  } catch (error) {
    throw new Error(`Invalid URL format: ${url}`);
  }
}

/**
 * Retry a function with exponential backoff
 * Useful for API calls that may temporarily fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff: 1s, 2s, 4s, 8s...
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Refresh OAuth access token using refresh token
 * Used for Squarespace and Wix token refresh
 */
export async function refreshOAuthToken(
  tokenUrl: string,
  clientId: string,
  clientSecret: string,
  encryptedRefreshToken: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  console.log('Refreshing OAuth token...');

  // Decrypt the refresh token
  const refreshToken = await decrypt(encryptedRefreshToken);

  // Request new access token
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Token refresh failed:', error);
    throw new Error(`Failed to refresh token: ${response.status}`);
  }

  const tokens = await response.json();
  console.log('Token refreshed successfully');

  return tokens;
}

/**
 * Check if OAuth token is expired or about to expire
 * Returns true if token needs refresh (expires in < 5 minutes)
 */
export function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) {
    return true;
  }

  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Return true if expired or expiring soon
  return expiryTime - now < fiveMinutes;
}

/**
 * Get and refresh website connection if needed
 * This function:
 * 1. Fetches the website connection from database
 * 2. Checks if OAuth token is expired
 * 3. Refreshes token if needed
 * 4. Updates database with new token
 * 5. Returns decrypted credentials
 */
export async function getWebsiteConnection(
  connectionId: string,
  platform: 'wordpress' | 'squarespace' | 'wix'
): Promise<{
  id: string;
  platform: string;
  website_url: string;
  access_token: string | null;
  wordpress_username: string | null;
  wordpress_app_password: string | null;
  metadata: any;
}> {
  const supabase = createSupabaseClient();

  console.log(`Fetching ${platform} connection: ${connectionId}`);

  // Fetch connection from database
  const { data: connection, error } = await supabase
    .from('website_connections')
    .select('*')
    .eq('id', connectionId)
    .eq('platform', platform)
    .single();

  if (error || !connection) {
    throw new Error(`Website connection not found: ${connectionId}`);
  }

  if (!connection.is_active) {
    throw new Error('Website connection is not active');
  }

  console.log(`Connection found: ${connection.website_url}`);

  // Handle WordPress (no token refresh needed)
  if (platform === 'wordpress') {
    const username = connection.wordpress_username;
    const encryptedPassword = connection.wordpress_app_password;

    if (!username || !encryptedPassword) {
      throw new Error('WordPress credentials not found');
    }

    // Decrypt password
    const password = await decrypt(encryptedPassword);

    return {
      id: connection.id,
      platform: connection.platform,
      website_url: connection.website_url,
      access_token: null,
      wordpress_username: username,
      wordpress_app_password: password,
      metadata: connection.metadata,
    };
  }

  // Handle OAuth platforms (Squarespace, Wix)
  if (!connection.access_token) {
    throw new Error('Access token not found for OAuth connection');
  }

  // Check if token needs refresh
  let accessToken = connection.access_token;
  const needsRefresh = isTokenExpired(connection.token_expires_at);

  if (needsRefresh && connection.refresh_token) {
    console.log('Token expired, refreshing...');

    try {
      // Get platform-specific OAuth credentials
      let tokenUrl: string;
      let clientId: string;
      let clientSecret: string;

      if (platform === 'squarespace') {
        tokenUrl = 'https://login.squarespace.com/api/1/login/oauth/provider/tokens';
        clientId = Deno.env.get('SQUARESPACE_CLIENT_ID')!;
        clientSecret = Deno.env.get('SQUARESPACE_CLIENT_SECRET')!;
      } else if (platform === 'wix') {
        tokenUrl = 'https://www.wix.com/oauth/access';
        clientId = Deno.env.get('WIX_CLIENT_ID')!;
        clientSecret = Deno.env.get('WIX_CLIENT_SECRET')!;
      } else {
        throw new Error(`Unknown OAuth platform: ${platform}`);
      }

      // Refresh the token
      const tokens = await refreshOAuthToken(
        tokenUrl,
        clientId,
        clientSecret,
        connection.refresh_token
      );

      // Encrypt new tokens
      const encryptedAccessToken = await encrypt(tokens.access_token);
      const encryptedRefreshToken = tokens.refresh_token
        ? await encrypt(tokens.refresh_token)
        : connection.refresh_token; // Keep old refresh token if not provided

      // Calculate new expiry
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 3600));

      // Update database with new tokens
      const { error: updateError } = await supabase
        .from('website_connections')
        .update({
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: expiresAt.toISOString(),
          last_verified_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      if (updateError) {
        console.error('Failed to update tokens:', updateError);
        throw new Error('Failed to update tokens in database');
      }

      accessToken = encryptedAccessToken;
      console.log('Token refreshed and saved');
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh OAuth token. Please reconnect your account.');
    }
  }

  // Decrypt access token
  const decryptedToken = await decrypt(accessToken);

  return {
    id: connection.id,
    platform: connection.platform,
    website_url: connection.website_url,
    access_token: decryptedToken,
    wordpress_username: null,
    wordpress_app_password: null,
    metadata: connection.metadata,
  };
}

/**
 * Parse HTML content and extract plain text
 * Useful for generating excerpts
 */
export function stripHtml(html: string): string {
  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, ' ');

  // Decode HTML entities
  const decoded = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Remove extra whitespace
  return decoded.replace(/\s+/g, ' ').trim();
}

/**
 * Generate excerpt from content
 * Truncates to specified length and adds ellipsis
 */
export function generateExcerpt(content: string, maxLength: number = 160): string {
  const plainText = stripHtml(content);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Truncate at word boundary
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Convert content to specified format
 * Handles markdown to HTML conversion if needed
 */
export function convertContent(content: string, format: 'html' | 'markdown'): string {
  // For now, return as-is
  // In a full implementation, you might use a markdown parser
  // like marked.js or similar
  return content;
}

/**
 * Sanitize slug for URL
 * Converts title to URL-safe slug
 */
export function sanitizeSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Format date for WordPress (ISO 8601)
 * Example: "2025-02-15T10:30:00"
 */
export function formatDateForWordPress(date: Date): string {
  return date.toISOString();
}

/**
 * Convert timezone-aware date to UTC
 */
export function convertToUTC(dateString: string, timezone: string): Date {
  // For simplicity, we'll use the Date constructor
  // In production, consider using a library like date-fns-tz
  return new Date(dateString);
}
