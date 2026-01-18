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
 * Get all social connections for current user
 * @param userId - MUST be the Supabase Auth UUID (not email)
 */
export async function getSocialConnections(userId: string): Promise<SocialConnection[]> {
  try {
    const response = await fetch(`/api/social/get-connections?userId=${userId}`);
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('Get connections: Server returned HTML instead of JSON');
      return [];
    }

    if (!response.ok) {
      console.error('Failed to fetch social connections');
      return [];
    }

    const data = await response.json();
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
      console.error('Failed to fetch scheduled posts');
      return [];
    }

    const data = await response.json();
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
      throw new Error(error.message || 'Failed to create post');
    }

    const data = await response.json();
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