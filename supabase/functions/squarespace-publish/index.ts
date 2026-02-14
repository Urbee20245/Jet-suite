/**
 * Squarespace Publish - Supabase Edge Function
 *
 * This function publishes a blog post to Squarespace using the Blog API.
 *
 * Squarespace Blog API Documentation:
 * https://developers.squarespace.com/squarespace-apis/blog-api
 *
 * HOW IT WORKS:
 * 1. Receives blog publication ID
 * 2. Fetches publication details and website connection from database
 * 3. Validates OAuth token (refreshes if expired)
 * 4. Creates the blog post using Squarespace Blog API
 * 5. Updates publication record with post ID and URL
 *
 * REQUEST BODY:
 * {
 *   "publication_id": "uuid"
 * }
 *
 * RESPONSE:
 * {
 *   "success": true,
 *   "post_id": "abc123",
 *   "post_url": "https://mysite.squarespace.com/blog/my-post",
 *   "published_at": "2025-02-15T10:30:00Z"
 * }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, getWebsiteConnection, retryWithBackoff } from '../_shared/utils.ts';

/**
 * Squarespace blog post data
 */
interface SquarespacePostData {
  title: string;
  body: string; // HTML content
  excerpt?: string;
  tags?: string[];
  categories?: string[];
  author?: string;
  publishOn?: string; // ISO 8601 date
  customUrl?: string; // Custom slug
  assetUrl?: string; // Featured image URL
}

/**
 * Squarespace API response for created post
 */
interface SquarespacePostResponse {
  id: string;
  title: string;
  fullUrl: string;
  publishOn: string;
  excerpt: string;
}

/**
 * Publish blog post to Squarespace
 */
async function publishToSquarespace(
  siteId: string,
  accessToken: string,
  postData: SquarespacePostData
): Promise<SquarespacePostResponse> {
  console.log('Publishing post to Squarespace:', postData.title);

  const apiUrl = `https://api.squarespace.com/1.0/sites/${siteId}/blog/posts`;

  // Make the API request with retry logic
  const response = await retryWithBackoff(async () => {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Squarespace publish failed:', res.status, errorText);

      if (res.status === 401) {
        throw new Error('Authentication failed. Token may be expired.');
      } else if (res.status === 403) {
        throw new Error('Permission denied. Check OAuth scopes.');
      } else {
        throw new Error(`Squarespace API error: ${res.status}`);
      }
    }

    return res;
  });

  const post = await response.json();
  console.log('Post published successfully:', post.fullUrl);

  return post;
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, origin);
  }

  try {
    console.log('=== Squarespace Publish Request ===');

    // Parse request body
    const body = await req.json();
    const { publication_id } = body;

    if (!publication_id) {
      return errorResponse('Missing publication_id', 400, origin);
    }

    console.log('Publication ID:', publication_id);

    // Initialize Supabase client
    const supabase = createSupabaseClient();

    // Fetch publication details
    console.log('Fetching publication details...');
    const { data: publication, error: pubError } = await supabase
      .from('blog_publications')
      .select('*')
      .eq('id', publication_id)
      .single();

    if (pubError || !publication) {
      console.error('Publication not found:', pubError);
      return errorResponse('Publication not found', 404, origin);
    }

    console.log('Publication found:', publication.title);

    // Check if already published
    if (publication.status === 'published') {
      console.log('Post already published:', publication.platform_post_url);
      return jsonResponse(
        {
          success: true,
          already_published: true,
          post_id: publication.platform_post_id,
          post_url: publication.platform_post_url,
          published_at: publication.published_at,
        },
        200,
        origin
      );
    }

    // Update status to 'publishing'
    console.log('Updating status to publishing...');
    await supabase
      .from('blog_publications')
      .update({ status: 'publishing' })
      .eq('id', publication_id);

    // Get website connection (includes auto token refresh)
    let connection;
    try {
      connection = await getWebsiteConnection(
        publication.website_connection_id,
        'squarespace'
      );
    } catch (error) {
      console.error('Failed to get website connection:', error);
      await supabase
        .from('blog_publications')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Connection not found',
        })
        .eq('id', publication_id);

      return errorResponse(
        error instanceof Error ? error.message : 'Connection not found',
        400,
        origin
      );
    }

    console.log('Connection found:', connection.website_url);

    // Get site ID from metadata
    const siteId = connection.metadata?.site_id;
    if (!siteId) {
      const errorMsg = 'Site ID not found in connection metadata';
      console.error(errorMsg);

      await supabase
        .from('blog_publications')
        .update({
          status: 'failed',
          error_message: errorMsg,
        })
        .eq('id', publication_id);

      return errorResponse(errorMsg, 400, origin);
    }

    // Prepare post data for Squarespace API
    const postData: SquarespacePostData = {
      title: publication.title,
      body: publication.content, // Squarespace expects HTML
      excerpt: publication.excerpt || undefined,
      tags: publication.tags || undefined,
      categories: publication.categories || undefined,
      customUrl: publication.slug || undefined,
      assetUrl: publication.featured_image_url || undefined,
    };

    // Add publish date if scheduled
    if (publication.scheduled_publish_at) {
      postData.publishOn = new Date(publication.scheduled_publish_at).toISOString();
    }

    // Publish to Squarespace
    let squarespacePost: SquarespacePostResponse;
    try {
      squarespacePost = await publishToSquarespace(
        siteId,
        connection.access_token!,
        postData
      );
    } catch (error) {
      console.error('Squarespace publish failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to publish';

      // Update publication with error
      await supabase
        .from('blog_publications')
        .update({
          status: 'failed',
          error_message: errorMsg,
          retry_count: publication.retry_count + 1,
          last_retry_at: new Date().toISOString(),
        })
        .eq('id', publication_id);

      return errorResponse(errorMsg, 500, origin);
    }

    // Update publication with success
    console.log('Updating publication record with success...');
    await supabase
      .from('blog_publications')
      .update({
        status: 'published',
        platform_post_id: squarespacePost.id,
        platform_post_url: squarespacePost.fullUrl,
        published_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', publication_id);

    console.log('Publication completed successfully!');

    // Return success response
    return jsonResponse(
      {
        success: true,
        post_id: squarespacePost.id,
        post_url: squarespacePost.fullUrl,
        published_at: squarespacePost.publishOn,
      },
      200,
      origin
    );
  } catch (error) {
    console.error('Squarespace publish error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(errorMsg, 500, origin);
  }
});
