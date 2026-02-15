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
 * Optimization result from optimize-blog-keywords function
 */
interface OptimizationResult {
  keywords: string[];
  tags: string[];
  meta_description: string;
  slug: string;
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
 * Call optimize-blog-keywords function to get SEO optimization
 */
async function optimizeBlogContent(
  title: string,
  content: string,
  excerpt?: string
): Promise<OptimizationResult | null> {
  console.log('Calling optimize-blog-keywords function...');

  try {
    const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/optimize-blog-keywords`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ title, content, excerpt }),
    });

    if (!response.ok) {
      console.error('Optimization failed:', response.status);
      return null;
    }

    const result = await response.json();
    console.log('Optimization successful:', result);
    return result;
  } catch (error) {
    console.error('Error calling optimize-blog-keywords:', error);
    return null;
  }
}

/**
 * Get or create WordPress category by name
 * Returns the category ID
 */
async function getOrCreateCategory(
  siteUrl: string,
  username: string,
  appPassword: string,
  categoryName: string
): Promise<number | null> {
  console.log(`Getting or creating category: ${categoryName}`);

  const credentials = btoa(`${username}:${appPassword}`);
  const apiUrl = `${siteUrl}/wp-json/wp/v2/categories`;

  try {
    // First, search for existing category
    const searchUrl = `${apiUrl}?search=${encodeURIComponent(categoryName)}`;
    const searchResponse = await fetch(searchUrl, {
      headers: { 'Authorization': `Basic ${credentials}` },
    });

    if (searchResponse.ok) {
      const categories = await searchResponse.json();
      const exactMatch = categories.find(
        (cat: any) => cat.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (exactMatch) {
        console.log(`Category found: ${exactMatch.name} (ID: ${exactMatch.id})`);
        return exactMatch.id;
      }
    }

    // Category doesn't exist, create it
    console.log(`Creating new category: ${categoryName}`);
    const createResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: categoryName }),
    });

    if (!createResponse.ok) {
      console.error('Failed to create category:', await createResponse.text());
      return null;
    }

    const newCategory = await createResponse.json();
    console.log(`Category created: ${newCategory.name} (ID: ${newCategory.id})`);
    return newCategory.id;
  } catch (error) {
    console.error('Error with category:', error);
    return null;
  }
}

/**
 * Get or create WordPress tag by name
 * Returns the tag ID
 */
async function getOrCreateTag(
  siteUrl: string,
  username: string,
  appPassword: string,
  tagName: string
): Promise<number | null> {
  console.log(`Getting or creating tag: ${tagName}`);

  const credentials = btoa(`${username}:${appPassword}`);
  const apiUrl = `${siteUrl}/wp-json/wp/v2/tags`;

  try {
    // First, search for existing tag
    const searchUrl = `${apiUrl}?search=${encodeURIComponent(tagName)}`;
    const searchResponse = await fetch(searchUrl, {
      headers: { 'Authorization': `Basic ${credentials}` },
    });

    if (searchResponse.ok) {
      const tags = await searchResponse.json();
      const exactMatch = tags.find(
        (tag: any) => tag.name.toLowerCase() === tagName.toLowerCase()
      );

      if (exactMatch) {
        console.log(`Tag found: ${exactMatch.name} (ID: ${exactMatch.id})`);
        return exactMatch.id;
      }
    }

    // Tag doesn't exist, create it
    console.log(`Creating new tag: ${tagName}`);
    const createResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: tagName }),
    });

    if (!createResponse.ok) {
      console.error('Failed to create tag:', await createResponse.text());
      return null;
    }

    const newTag = await createResponse.json();
    console.log(`Tag created: ${newTag.name} (ID: ${newTag.id})`);
    return newTag.id;
  } catch (error) {
    console.error('Error with tag:', error);
    return null;
  }
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

    // Optimize blog content if not already optimized
    let optimization: OptimizationResult | null = null;
    if (!publication.auto_optimized) {
      console.log('Optimizing blog content with AI...');
      optimization = await optimizeBlogContent(
        publication.title,
        publication.content,
        publication.excerpt
      );

      // Save optimization results to database
      if (optimization) {
        await supabase
          .from('blog_publications')
          .update({
            optimized_keywords: optimization.keywords,
            optimized_tags: optimization.tags,
            auto_optimized: true,
            meta_description: optimization.meta_description,
            slug: optimization.slug,
          })
          .eq('id', publication_id);

        console.log('Optimization saved to database');
      }
    } else {
      console.log('Post already optimized, using existing data');
      if (publication.optimized_keywords && publication.optimized_tags) {
        optimization = {
          keywords: publication.optimized_keywords,
          tags: publication.optimized_tags,
          meta_description: publication.meta_description || '',
          slug: publication.slug || '',
        };
      }
    }

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

    // Process categories and tags from optimization
    const categoryIds: number[] = [];
    const tagIds: number[] = [];

    if (optimization) {
      // Create/get categories from keywords
      console.log('Processing categories from keywords...');
      for (const keyword of optimization.keywords.slice(0, 3)) {
        // Use first 3 keywords as categories
        const categoryId = await getOrCreateCategory(
          connection.website_url,
          connection.wordpress_username!,
          connection.wordpress_app_password!,
          keyword
        );
        if (categoryId) {
          categoryIds.push(categoryId);
        }
      }

      // Create/get tags from optimization
      console.log('Processing tags...');
      for (const tag of optimization.tags) {
        const tagId = await getOrCreateTag(
          connection.website_url,
          connection.wordpress_username!,
          connection.wordpress_app_password!,
          tag
        );
        if (tagId) {
          tagIds.push(tagId);
        }
      }
    }

    // Prepare post data for WordPress API
    const postData: WordPressPostData = {
      title: publication.title,
      content: publication.content,
      excerpt: publication.excerpt || (optimization?.meta_description) || undefined,
      status: 'publish', // Publish immediately
      slug: optimization?.slug || publication.slug || undefined,
      featured_media: featuredMediaId || undefined,
      meta_description: optimization?.meta_description || publication.meta_description || undefined,
    };

    // Add categories (from optimization or existing publication data)
    if (categoryIds.length > 0) {
      postData.categories = categoryIds;
    } else if (publication.categories && publication.categories.length > 0) {
      // Fallback to existing categories if provided as IDs
      const existingCategoryIds = publication.categories
        .map((cat: any) => {
          if (typeof cat === 'number') return cat;
          if (typeof cat === 'string' && !isNaN(Number(cat))) return Number(cat);
          return null;
        })
        .filter((id: number | null) => id !== null) as number[];

      if (existingCategoryIds.length > 0) {
        postData.categories = existingCategoryIds;
      }
    }

    // Add tags (from optimization or existing publication data)
    if (tagIds.length > 0) {
      postData.tags = tagIds;
    } else if (publication.tags && publication.tags.length > 0) {
      // Fallback to existing tags if provided as IDs
      const existingTagIds = publication.tags
        .map((tag: any) => {
          if (typeof tag === 'number') return tag;
          if (typeof tag === 'string' && !isNaN(Number(tag))) return Number(tag);
          return null;
        })
        .filter((id: number | null) => id !== null) as number[];

      if (existingTagIds.length > 0) {
        postData.tags = existingTagIds;
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
