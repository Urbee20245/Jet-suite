/**
 * Schedule Blog Publish - Supabase Edge Function (Cron Job)
 *
 * This is a scheduled function that runs every 5 minutes to check for
 * blog posts that need to be published and publishes them automatically.
 *
 * HOW TO SET UP CRON:
 * In your Supabase dashboard, go to Edge Functions and add a cron trigger:
 * - Function: schedule-blog-publish
 * - Schedule: */5 * * * * (every 5 minutes)
 * - Or: 0 * * * * (every hour)
 *
 * Alternatively, you can call this function from a cron service like:
 * - GitHub Actions
 * - Vercel Cron
 * - Render Cron Jobs
 * - Or any other cron service
 *
 * HOW IT WORKS:
 * 1. Queries database for posts with status='scheduled' and scheduled_publish_at <= now
 * 2. For each post, determines the platform (WordPress, Squarespace, Wix)
 * 3. Calls the appropriate publish function for that platform
 * 4. Updates post status based on success or failure
 * 5. Implements retry logic for failed posts (max 3 retries)
 *
 * AUTHENTICATION:
 * This function should be called with a secret key to prevent unauthorized access.
 *
 * REQUEST:
 * POST /schedule-blog-publish
 * Authorization: Bearer YOUR_CRON_SECRET_KEY
 *
 * RESPONSE:
 * {
 *   "success": true,
 *   "posts_processed": 5,
 *   "posts_published": 4,
 *   "posts_failed": 1,
 *   "details": [...]
 * }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/utils.ts';

// Environment variables
const CRON_SECRET = Deno.env.get('CRON_SECRET'); // Secret key for authenticating cron requests
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

/**
 * Publish a single blog post
 * Calls the appropriate platform-specific publish function
 */
async function publishPost(
  publicationId: string,
  platform: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`Publishing post ${publicationId} to ${platform}...`);

  // Determine which publish function to call based on platform
  let functionName: string;
  switch (platform) {
    case 'wordpress':
      functionName = 'wordpress-publish';
      break;
    case 'squarespace':
      functionName = 'squarespace-publish';
      break;
    case 'wix':
      functionName = 'wix-publish';
      break;
    default:
      return { success: false, error: `Unknown platform: ${platform}` };
  }

  // Call the platform-specific publish function
  const functionUrl = `${SUPABASE_URL}/functions/v1/${functionName}`;

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ publication_id: publicationId }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`Failed to publish: ${result.error}`);
      return { success: false, error: result.error || 'Publish failed' };
    }

    console.log(`Successfully published to ${platform}`);
    return { success: true };
  } catch (error) {
    console.error('Error calling publish function:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process scheduled posts
 */
async function processScheduledPosts(): Promise<{
  processed: number;
  published: number;
  failed: number;
  details: any[];
}> {
  const supabase = createSupabaseClient();

  console.log('Checking for scheduled posts...');

  // Get all posts that are scheduled and due to be published
  const now = new Date().toISOString();

  const { data: scheduledPosts, error } = await supabase
    .from('blog_publications')
    .select(`
      id,
      title,
      status,
      scheduled_publish_at,
      retry_count,
      website_connection_id,
      website_connections!inner(platform)
    `)
    .eq('status', 'scheduled')
    .lte('scheduled_publish_at', now)
    .lt('retry_count', 3) // Only retry up to 3 times
    .order('scheduled_publish_at', { ascending: true })
    .limit(50); // Process max 50 posts per run

  if (error) {
    console.error('Error fetching scheduled posts:', error);
    throw new Error('Failed to fetch scheduled posts');
  }

  if (!scheduledPosts || scheduledPosts.length === 0) {
    console.log('No scheduled posts found');
    return { processed: 0, published: 0, failed: 0, details: [] };
  }

  console.log(`Found ${scheduledPosts.length} posts to publish`);

  const results = {
    processed: 0,
    published: 0,
    failed: 0,
    details: [] as any[],
  };

  // Process each post
  for (const post of scheduledPosts) {
    results.processed++;

    console.log(`\n--- Processing post: ${post.title} ---`);
    console.log(`Scheduled for: ${post.scheduled_publish_at}`);
    console.log(`Platform: ${post.website_connections.platform}`);

    // Get the platform from the joined website_connections table
    const platform = post.website_connections.platform;

    // Attempt to publish
    const result = await publishPost(post.id, platform);

    if (result.success) {
      results.published++;
      results.details.push({
        post_id: post.id,
        title: post.title,
        platform: platform,
        status: 'published',
      });
    } else {
      results.failed++;
      results.details.push({
        post_id: post.id,
        title: post.title,
        platform: platform,
        status: 'failed',
        error: result.error,
      });

      console.error(`Failed to publish post ${post.id}: ${result.error}`);
    }
  }

  console.log('\n=== Processing Complete ===');
  console.log(`Processed: ${results.processed}`);
  console.log(`Published: ${results.published}`);
  console.log(`Failed: ${results.failed}`);

  return results;
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
    console.log('=== Schedule Blog Publish Cron Job ===');
    console.log('Time:', new Date().toISOString());

    // Verify cron secret (if configured)
    if (CRON_SECRET) {
      const authHeader = req.headers.get('authorization');
      const providedSecret = authHeader?.replace('Bearer ', '');

      if (providedSecret !== CRON_SECRET) {
        console.error('Invalid cron secret');
        return errorResponse('Unauthorized', 401, origin);
      }

      console.log('Cron secret verified');
    } else {
      console.log('Warning: CRON_SECRET not configured. Anyone can trigger this function.');
    }

    // Process scheduled posts
    const results = await processScheduledPosts();

    // Return success response
    return jsonResponse(
      {
        success: true,
        timestamp: new Date().toISOString(),
        posts_processed: results.processed,
        posts_published: results.published,
        posts_failed: results.failed,
        details: results.details,
      },
      200,
      origin
    );
  } catch (error) {
    console.error('Schedule blog publish error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(errorMsg, 500, origin);
  }
});
