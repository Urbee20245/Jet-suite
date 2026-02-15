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
import { getSupabaseClient } from '../integrations/supabase/client';

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
    available: true,
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

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('Supabase client not available');
      return [];
    }

    const { data, error } = await supabase
      .from('website_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching website connections:', error);
      return [];
    }

    console.log('[getWebsiteConnections] Received data:', data);
    return data || [];
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

    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { error } = await supabase
      .from('website_connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      console.error('Error disconnecting website:', error);
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
