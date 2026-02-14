/**
 * Website Service
 * Handles API calls for website connections (WordPress, Squarespace, Wix)
 * Similar pattern to socialMediaService.ts
 */

import type {
  WebsiteConnection,
  WebsitePlatform,
  WordPressConnectionRequest,
  WordPressConnectionResponse,
} from '../types';

// Platform metadata for UI
export const WEBSITE_PLATFORM_INFO: Record<WebsitePlatform, {
  id: WebsitePlatform;
  name: string;
  color: string;
  available: boolean;
}> = {
  wordpress: {
    id: 'wordpress',
    name: 'WordPress',
    color: '#21759b',
    available: true,
  },
  squarespace: {
    id: 'squarespace',
    name: 'Squarespace',
    color: '#000000',
    available: false, // Coming soon
  },
  wix: {
    id: 'wix',
    name: 'Wix',
    color: '#0c6efc',
    available: false, // Coming soon
  },
};

// ============================================================================
// WEBSITE CONNECTIONS API
// ============================================================================

/**
 * Get all website connections for current user and business
 */
export async function getWebsiteConnections(
  userId: string,
  businessId: string
): Promise<WebsiteConnection[]> {
  try {
    console.log('[getWebsiteConnections] Fetching for userId:', userId, 'businessId:', businessId);
    const response = await fetch(`/api/websites/get-connections?userId=${userId}&businessId=${businessId}`);

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('Get website connections: Server returned HTML instead of JSON');
      return [];
    }

    if (!response.ok) {
      console.error('Failed to fetch website connections, status:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('[getWebsiteConnections] Received data:', data);
    return data.connections || [];
  } catch (error: any) {
    console.error('Get website connections error:', error);
    return [];
  }
}

/**
 * Connect a WordPress site
 */
export async function connectWordPress(
  request: WordPressConnectionRequest
): Promise<WordPressConnectionResponse> {
  try {
    console.log('[connectWordPress] Connecting WordPress site:', request.website_url);

    // Get Supabase URL from environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/wordpress-connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to connect WordPress site');
    }

    const data = await response.json();
    console.log('[connectWordPress] Connected successfully:', data);
    return data;
  } catch (error: any) {
    console.error('Connect WordPress error:', error);
    throw error;
  }
}

/**
 * Disconnect a website
 */
export async function disconnectWebsite(connectionId: string): Promise<void> {
  try {
    console.log('[disconnectWebsite] Disconnecting website:', connectionId);
    const response = await fetch('/api/websites/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to disconnect website');
    }

    console.log('[disconnectWebsite] Disconnected successfully');
  } catch (error: any) {
    console.error('Disconnect website error:', error);
    throw error;
  }
}

/**
 * Verify a website connection
 */
export async function verifyWebsiteConnection(connectionId: string): Promise<boolean> {
  try {
    console.log('[verifyWebsiteConnection] Verifying connection:', connectionId);
    const response = await fetch('/api/websites/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.verified || false;
  } catch (error: any) {
    console.error('Verify website connection error:', error);
    return false;
  }
}
