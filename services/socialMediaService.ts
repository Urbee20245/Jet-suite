/**
 * Social Media Service
 * Handles API calls for social connections and scheduled posts
 * Follows JetSuite pattern: localStorage for client state, API routes for database operations
 */

import type {
  SocialConnection,
  ScheduledPost,
  SocialPlatform,
  PlatformTarget,
  PostStatus,
} from '../types';

// Platform metadata for UI
export const PLATFORM_INFO: Record<SocialPlatform, {
  id: SocialPlatform;
  name: string;
  icon: string;
  color: string;
}> = {
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    color: '#1877F2',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    color: '#E4405F',
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: '🐦',
    color: '#1DA1F2',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: '#000000',
  },
  google_business: {
    id: 'google_business',
    name: 'Google Business Profile',
    icon: '🗺️',
    color: '#4285F4',
  },
};

// ============================================================================
// SOCIAL CONNECTIONS API
// ============================================================================

/**
 * Get all social connections for current user and business
 * @param userId - MUST be the Supabase Auth UUID (not email)
 * @param businessId - MUST be the business UUID
 */
export async function getSocialConnections(userId: string, businessId: string): Promise<SocialConnection[]> {
  try {
    console.log('[getSocialConnections] Fetching for userId:', userId, 'businessId:', businessId);
    const response = await fetch(`/api/social/get-connections?userId=${userId}&businessId=${businessId}`);

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('Get connections: Server returned HTML instead of JSON');
      return [];
    }

    if (!response.ok) {
      console.error('Failed to fetch social connections, status:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('[getSocialConnections] Received data:', data);
    return data.connections || [];
  } catch (error: any) {
    console.error('Get connections error:', error);
    return [];
  }
}

/**
 * Add a new social connection (mock OAuth for now)
 * @param userId - MUST be the Supabase Auth UUID (not email)
 */
export async function addSocialConnection(
  userId: string,
  platform: SocialPlatform,
  platformUsername: string,
  platformPageId?: string
): Promise<SocialConnection> {
  try {
    const response = await fetch('/api/social/add-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        platform,
        platformUsername,
        platformPageId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add connection');
    }

    const data = await response.json();
    return data.connection;
  } catch (error: any) {
    console.error('Add connection error:', error);
    throw error;
  }
}

/**
 * Remove a social connection
 */
export async function removeSocialConnection(connectionId: string): Promise<void> {
  try {
    const response = await fetch('/api/social/remove-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove connection');
    }
  } catch (error: any) {
    console.error('Remove connection error:', error);
    throw error;
  }
}

/**
 * Refresh an expired or expiring token for a social connection
 */
export async function refreshConnectionToken(connectionId: string): Promise<{ success: boolean; needs_reconnect?: boolean }> {
  try {
    const response = await fetch('/api/social/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        needs_reconnect: data.needs_reconnect || false,
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return { success: false, needs_reconnect: true };
  }
}

/**
 * Get a valid Google Business Profile token, automatically refreshing if needed.
 *
 * This function:
 * 1. Checks if the token expires within 5 minutes
 * 2. Automatically refreshes the token if it's about to expire
 * 3. Returns the connection with a valid token
 *
 * @param userId - The user's Supabase Auth UUID
 * @param businessId - The business UUID
 * @returns The Google Business connection with a valid token, or null if unavailable
 * @throws Error if token refresh fails and user needs to reconnect
 */
export async function getValidGoogleToken(
  userId: string,
  businessId: string
): Promise<SocialConnection | null> {
  try {
    // Get all connections
    const connections = await getSocialConnections(userId, businessId);

    // Find Google Business connection
    const googleConnection = connections.find(
      conn => conn.platform === 'google_business' && conn.is_active
    );

    if (!googleConnection) {
      console.warn('No Google Business connection found');
      return null;
    }

    // Check if token exists
    if (!googleConnection.token_expires_at) {
      console.warn('Google Business connection has no expiration date');
      return googleConnection;
    }

    // Calculate time until expiration
    const expiresAt = new Date(googleConnection.token_expires_at);
    const now = new Date();
    const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60);

    // If token expires within 5 minutes, refresh it
    if (minutesUntilExpiry < 5) {
      console.log('Google token expires in', minutesUntilExpiry.toFixed(1), 'minutes. Refreshing...');

      if (!googleConnection.has_refresh_token) {
        throw new Error('No refresh token available. Please reconnect your Google Business Profile.');
      }

      const result = await refreshConnectionToken(googleConnection.id);

      if (!result.success) {
        if (result.needs_reconnect) {
          throw new Error('Token refresh failed. Please reconnect your Google Business Profile.');
        }
        throw new Error('Failed to refresh Google token');
      }

      // Re-fetch the connection to get the updated token
      const updatedConnections = await getSocialConnections(userId, businessId);
      const updatedConnection = updatedConnections.find(
        conn => conn.id === googleConnection.id
      );

      if (!updatedConnection) {
        throw new Error('Failed to retrieve updated Google connection');
      }

      console.log('Google token refreshed successfully');
      return updatedConnection;
    }

    // Token is still valid
    console.log('Google token is valid for', minutesUntilExpiry.toFixed(1), 'more minutes');
    return googleConnection;
  } catch (error) {
    console.error('getValidGoogleToken error:', error);
    throw error;
  }
}

/**
 * Verify and refresh all connections for a user on login.
 * Attempts to auto-refresh any expired tokens that have refresh tokens.
 */
export async function verifyConnectionsOnLogin(userId: string, businessId: string): Promise<SocialConnection[]> {
  const connections = await getSocialConnections(userId, businessId);

  const refreshPromises = connections
    .filter(conn => conn.connection_status === 'expired' && conn.has_refresh_token)
    .map(async (conn) => {
      try {
        await refreshConnectionToken(conn.id);
      } catch (err) {
        console.error(`Failed to refresh ${conn.platform} token:`, err);
      }
    });

  if (refreshPromises.length > 0) {
    await Promise.allSettled(refreshPromises);
    // Re-fetch connections after refresh attempts
    return await getSocialConnections(userId, businessId);
  }

  return connections;
}

// ============================================================================
// SCHEDULED POSTS API
// ============================================================================

/**
 * Get scheduled posts for date range
 * @param userId - MUST be the Supabase Auth UUID (not email)
 */
export async function getScheduledPosts(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<ScheduledPost[]> {
  try {
    console.log('[getScheduledPosts] Fetching posts for userId:', userId, 'date range:', startDate, '-', endDate);
    const params = new URLSearchParams({ userId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`/api/social/get-posts?${params}`);

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('Get posts: Server returned HTML instead of JSON');
      return [];
    }

    if (!response.ok) {
      console.error('Failed to fetch scheduled posts, status:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('[getScheduledPosts] Received', data.posts?.length || 0, 'posts:', data.posts);
    return data.posts || [];
  } catch (error: any) {
    console.error('Get posts error:', error);
    return [];
  }
}

/**
 * Create a new scheduled post
 * @param userId - MUST be the Supabase Auth UUID (not email)
 */
export async function createScheduledPost(
  userId: string,
  postData: Omit<ScheduledPost, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'posted_at'>
): Promise<ScheduledPost> {
  try {
    console.log('[createScheduledPost] Creating post for userId:', userId, 'data:', postData);
    const response = await fetch('/api/social/create-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        ...postData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[createScheduledPost] Failed:', error);
      throw new Error(error.message || 'Failed to create post');
    }

    const data = await response.json();
    console.log('[createScheduledPost] Created post successfully:', data.post);
    return data.post;
  } catch (error: any) {
    console.error('Create post error:', error);
    throw error;
  }
}

/**
 * Update a scheduled post
 */
export async function updateScheduledPost(
  postId: string,
  updates: Partial<Omit<ScheduledPost, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<ScheduledPost> {
  try {
    const response = await fetch('/api/social/update-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, updates }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update post');
    }

    const data = await response.json();
    return data.post;
  } catch (error: any) {
    console.error('Update post error:', error);
    throw error;
  }
}

/**
 * Delete a scheduled post
 */
export async function deleteScheduledPost(postId: string): Promise<void> {
  try {
    const response = await fetch('/api/social/delete-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete post');
    }
  } catch (error: any) {
    console.error('Delete post error:', error);
    throw error;
  }
}

/**
 * Get posting statistics
 * @param userId - MUST be the Supabase Auth UUID (not email)
 */
export async function getPostingStats(userId: string): Promise<{
  scheduled: number;
  posted: number;
  failed: number;
  draft: number;
}> {
  try {
    const response = await fetch(`/api/social/get-stats?userId=${userId}`);
    
    if (!response.ok) {
      return { scheduled: 0, posted: 0, failed: 0, draft: 0 };
    }

    const data = await response.json();
    return data.stats;
  } catch (error: any) {
    console.error('Get stats error:', error);
    return { scheduled: 0, posted: 0, failed: 0, draft: 0 };
  }
}