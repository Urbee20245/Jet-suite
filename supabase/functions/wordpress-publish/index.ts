/**
 * WordPress Publish - Supabase Edge Function
 *
 * This function publishes a blog post to WordPress using the REST API.
 *
 * WordPress REST API Documentation:
 * https://developer.wordpress.org/rest-api/reference/posts/
 *
 * HOW IT WORKS:
 * 1. Receives blog publication ID
 * 2. Fetches publication details and website connection from database
 * 3. Validates WordPress credentials (Application Password)
 * 4. Uploads featured image (if provided)
 * 5. Creates the blog post using WordPress REST API
 * 6. Updates publication record with post ID and URL
 *
 * REQUEST BODY:
 * {
 *   "publication_id": "uuid"
 * }
 *
 * RESPONSE:
 * {
 *   "success": true,
 *   "post_id": "123",
 *   "post_url": "https://myblog.com/my-post",
 *   "published_at": "2025-02-15T10:30:00Z"
 * }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, getWebsiteConnection, retryWithBackoff } from '../_shared/utils.ts';

/**
 * WordPress post data for creating a post
 */
interface WordPressPostData {
  title: string;
  content: string;
  excerpt?: string;
  status: 'publish' | 'draft' | 'pending' | 'future';
  slug?: string;
  categories?: number[];
  tags?: number[];
  featured_media?: number; // Featured image ID
  date?: string; // ISO 8601 date
  meta_description?: string;
}

/**
 * WordPress API response for created post
 */
interface WordPressPostResponse {
  id: number;
  link: string;
  title: { rendered: string };
  status: string;
  date: string;
}

/**
 * Upload featured image to WordPress Media Library
 * Returns the media ID to attach to the post
 */
async function uploadFeaturedImage(
  siteUrl: string,
  username: string,
  appPassword: string,
  imageUrl: string,
  title: string
): Promise<number | null> {
  console.log('Uploading featured image from:', imageUrl);

  try {
    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error('Failed to download image:', imageResponse.status);
      return null;
    }

    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();

    // Get filename from URL or use default
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1] || 'featured-image.jpg';

    console.log('Image downloaded, uploading to WordPress...');

    // Upload to WordPress Media Library
    const credentials = btoa(`${username}:${appPassword}`);
    const uploadUrl = `${siteUrl}/wp-json/wp/v2/media`;

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': imageBlob.type || 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
      body: imageBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Image upload failed:', uploadResponse.status, errorText);
      return null;
    }

    const mediaResponse = await uploadResponse.json();
    console.log('Featured image uploaded successfully, media ID:', mediaResponse.id);

    return mediaResponse.id;
  } catch (error) {
    console.error('Error uploading featured image:', error);
    return null;
  }
}

/**
 * Publish blog post to WordPress
 */
async function publishToWordPress(
  siteUrl: string,
  username: string,
  appPassword: string,
  postData: WordPressPostData
): Promise<WordPressPostResponse> {
  console.log('Publishing post to WordPress:', postData.title);

  const credentials = btoa(`${username}:${appPassword}`);
  const apiUrl = `${siteUrl}/wp-json/wp/v2/posts`;

  // Make the API request with retry logic
  const response = await retryWithBackoff(async () => {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('WordPress publish failed:', res.status, errorText);
      throw new Error(`WordPress API error: ${res.status}`);
    }

    return res;
  });

  const post = await response.json();
  console.log('Post published successfully:', post.link);

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
    console.log('=== WordPress Publish Request ===');

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

    // Get website connection
    let connection;
    try {
      connection = await getWebsiteConnection(
        publication.website_connection_id,
        'wordpress'
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

    // Upload featured image if provided
    let featuredMediaId: number | null = null;
    if (publication.featured_image_url) {
      featuredMediaId = await uploadFeaturedImage(
        connection.website_url,
        connection.wordpress_username!,
        connection.wordpress_app_password!,
        publication.featured_image_url,
        publication.title
      );
    }

    // Prepare post data for WordPress API
    const postData: WordPressPostData = {
      title: publication.title,
      content: publication.content,
      excerpt: publication.excerpt || undefined,
      status: 'publish', // Publish immediately
      slug: publication.slug || undefined,
      featured_media: featuredMediaId || undefined,
    };

    // Add categories if provided
    if (publication.categories && publication.categories.length > 0) {
      // If categories are provided as category IDs (numbers)
      const categoryIds = publication.categories
        .map((cat: any) => {
          if (typeof cat === 'number') return cat;
          if (typeof cat === 'string' && !isNaN(Number(cat))) return Number(cat);
          return null;
        })
        .filter((id: number | null) => id !== null) as number[];

      if (categoryIds.length > 0) {
        postData.categories = categoryIds;
      }
    }

    // Add tags if provided
    if (publication.tags && publication.tags.length > 0) {
      // For tags, WordPress expects tag IDs
      // If you have tag names instead, you'd need to look them up first
      const tagIds = publication.tags
        .map((tag: any) => {
          if (typeof tag === 'number') return tag;
          if (typeof tag === 'string' && !isNaN(Number(tag))) return Number(tag);
          return null;
        })
        .filter((id: number | null) => id !== null) as number[];

      if (tagIds.length > 0) {
        postData.tags = tagIds;
      }
    }

    // Publish to WordPress
    let wordpressPost: WordPressPostResponse;
    try {
      wordpressPost = await publishToWordPress(
        connection.website_url,
        connection.wordpress_username!,
        connection.wordpress_app_password!,
        postData
      );
    } catch (error) {
      console.error('WordPress publish failed:', error);
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
        platform_post_id: wordpressPost.id.toString(),
        platform_post_url: wordpressPost.link,
        published_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', publication_id);

    console.log('Publication completed successfully!');

    // Return success response
    return jsonResponse(
      {
        success: true,
        post_id: wordpressPost.id,
        post_url: wordpressPost.link,
        published_at: wordpressPost.date,
      },
      200,
      origin
    );
  } catch (error) {
    console.error('WordPress publish error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(errorMsg, 500, origin);
  }
});
