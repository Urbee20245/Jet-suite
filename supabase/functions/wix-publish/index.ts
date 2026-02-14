/**
 * Wix Publish - Supabase Edge Function
 *
 * This function publishes a blog post to Wix using the Blog API.
 *
 * Wix Blog API Documentation:
 * https://dev.wix.com/api/rest/wix-blog/blog/posts
 *
 * HOW IT WORKS:
 * 1. Receives blog publication ID
 * 2. Fetches publication details and website connection from database
 * 3. Validates OAuth token (refreshes if expired)
 * 4. Creates the blog post using Wix Blog API
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
 *   "post_url": "https://mysite.wixsite.com/blog/post-title",
 *   "published_at": "2025-02-15T10:30:00Z"
 * }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, getWebsiteConnection, retryWithBackoff } from '../_shared/utils.ts';

/**
 * Wix blog post data
 */
interface WixPostData {
  title: string;
  contentText?: string; // Plain text content
  richContent?: any; // Rich content object (Wix's format)
  excerpt?: string;
  slug?: string;
  featured?: boolean;
  coverImage?: {
    url: string;
  };
  categoryIds?: string[];
  tagIds?: string[];
  status?: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED';
  firstPublishedDate?: string; // ISO 8601
}

/**
 * Wix API response for created post
 */
interface WixPostResponse {
  post: {
    id: string;
    title: string;
    slug: string;
    url: string;
    firstPublishedDate: string;
  };
}

/**
 * Convert HTML to Wix Rich Content format
 * Wix uses a proprietary rich content format
 * For simplicity, we'll use plain text
 */
function convertHtmlToWixContent(html: string): { contentText: string } {
  // Strip HTML tags for plain text
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    contentText: text,
  };
}

/**
 * Publish blog post to Wix
 */
async function publishToWix(
  accessToken: string,
  postData: WixPostData
): Promise<WixPostResponse> {
  console.log('Publishing post to Wix:', postData.title);

  const apiUrl = 'https://www.wixapis.com/v3/posts';

  // Make the API request with retry logic
  const response = await retryWithBackoff(async () => {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': accessToken, // Wix uses token directly
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ post: postData }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Wix publish failed:', res.status, errorText);

      if (res.status === 401) {
        throw new Error('Authentication failed. Token may be expired.');
      } else if (res.status === 403) {
        throw new Error('Permission denied. Check OAuth scopes.');
      } else {
        throw new Error(`Wix API error: ${res.status}`);
      }
    }

    return res;
  });

  const result = await response.json();
  console.log('Post published successfully:', result.post.url);

  return result;
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
    console.log('=== Wix Publish Request ===');

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
        'wix'
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

    // Convert HTML content to Wix format
    const contentData = convertHtmlToWixContent(publication.content);

    // Prepare post data for Wix API
    const postData: WixPostData = {
      title: publication.title,
      contentText: contentData.contentText,
      excerpt: publication.excerpt || undefined,
      slug: publication.slug || undefined,
      status: 'PUBLISHED', // Publish immediately
      featured: false,
    };

    // Add cover image if provided
    if (publication.featured_image_url) {
      postData.coverImage = {
        url: publication.featured_image_url,
      };
    }

    // Add first published date if scheduled
    if (publication.scheduled_publish_at) {
      postData.firstPublishedDate = new Date(publication.scheduled_publish_at).toISOString();
      postData.status = 'SCHEDULED';
    }

    // Publish to Wix
    let wixPost: WixPostResponse;
    try {
      wixPost = await publishToWix(
        connection.access_token!,
        postData
      );
    } catch (error) {
      console.error('Wix publish failed:', error);
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
        platform_post_id: wixPost.post.id,
        platform_post_url: wixPost.post.url,
        published_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', publication_id);

    console.log('Publication completed successfully!');

    // Return success response
    return jsonResponse(
      {
        success: true,
        post_id: wixPost.post.id,
        post_url: wixPost.post.url,
        published_at: wixPost.post.firstPublishedDate,
      },
      200,
      origin
    );
  } catch (error) {
    console.error('Wix publish error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(errorMsg, 500, origin);
  }
});
