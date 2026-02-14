/**
 * WordPress Connect - Supabase Edge Function
 *
 * This function validates WordPress Application Password credentials
 * and saves the connection to the database.
 *
 * WordPress uses Application Passwords for authentication, which is a safer
 * way than using the main WordPress password. Users can generate Application
 * Passwords from their WordPress admin panel (Users > Profile > Application Passwords).
 *
 * HOW IT WORKS:
 * 1. Receives WordPress site URL, username, and Application Password
 * 2. Validates credentials by making a test request to WordPress REST API
 * 3. Fetches site information (name, description, categories)
 * 4. Encrypts the Application Password for secure storage
 * 5. Saves the connection to the website_connections table
 *
 * REQUEST BODY:
 * {
 *   "user_id": "uuid",
 *   "business_id": "uuid", // optional
 *   "website_url": "https://myblog.com",
 *   "username": "admin",
 *   "app_password": "xxxx xxxx xxxx xxxx xxxx xxxx"
 * }
 *
 * RESPONSE:
 * {
 *   "success": true,
 *   "connection_id": "uuid",
 *   "site_name": "My Blog",
 *   "site_url": "https://myblog.com"
 * }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { encrypt } from '../_shared/encryption.ts';
import { createSupabaseClient, validateUrl } from '../_shared/utils.ts';

/**
 * WordPress site info from REST API
 */
interface WordPressSiteInfo {
  name: string;
  description: string;
  url: string;
  home: string;
  timezone: string;
  namespaces: string[];
}

/**
 * WordPress category
 */
interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
}

/**
 * Test WordPress connection by fetching site info
 * This validates the credentials and gets basic site information
 */
async function testWordPressConnection(
  siteUrl: string,
  username: string,
  appPassword: string
): Promise<WordPressSiteInfo> {
  console.log('Testing WordPress connection to:', siteUrl);

  // WordPress REST API endpoint
  const apiUrl = `${siteUrl}/wp-json`;

  // Create Basic Auth header
  // Format: "Basic base64(username:password)"
  const credentials = btoa(`${username}:${appPassword}`);
  const authHeader = `Basic ${credentials}`;

  console.log('Making request to WordPress REST API...');

  // Test the connection by fetching site info
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('WordPress connection failed:', response.status);

    if (response.status === 401) {
      throw new Error('Invalid username or Application Password');
    } else if (response.status === 404) {
      throw new Error('WordPress REST API not found. Make sure the site is running WordPress.');
    } else {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`WordPress connection failed: ${response.status}`);
    }
  }

  const siteInfo = await response.json();
  console.log('WordPress connection successful:', siteInfo.name);

  return siteInfo;
}

/**
 * Fetch WordPress categories
 * Gets the list of available categories for blog posts
 */
async function fetchWordPressCategories(
  siteUrl: string,
  username: string,
  appPassword: string
): Promise<WordPressCategory[]> {
  console.log('Fetching WordPress categories...');

  const apiUrl = `${siteUrl}/wp-json/wp/v2/categories?per_page=100`;
  const credentials = btoa(`${username}:${appPassword}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch categories:', response.status);
      return [];
    }

    const categories = await response.json();
    console.log(`Found ${categories.length} categories`);

    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
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
    console.log('=== WordPress Connect Request ===');

    // Parse request body
    const body = await req.json();
    const { user_id, business_id, website_url, username, app_password } = body;

    // Validate required fields
    if (!user_id) {
      return errorResponse('Missing user_id', 400, origin);
    }
    if (!website_url) {
      return errorResponse('Missing website_url', 400, origin);
    }
    if (!username) {
      return errorResponse('Missing username', 400, origin);
    }
    if (!app_password) {
      return errorResponse('Missing app_password', 400, origin);
    }

    console.log('User ID:', user_id);
    console.log('Website URL:', website_url);
    console.log('Username:', username);

    // Validate and normalize URL
    let validatedUrl: string;
    try {
      validatedUrl = validateUrl(website_url);
      console.log('Validated URL:', validatedUrl);
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : 'Invalid URL', 400, origin);
    }

    // Remove spaces from Application Password (WordPress generates them with spaces)
    const cleanedPassword = app_password.replace(/\s+/g, '');

    // Test the WordPress connection
    let siteInfo: WordPressSiteInfo;
    try {
      siteInfo = await testWordPressConnection(validatedUrl, username, cleanedPassword);
    } catch (error) {
      console.error('WordPress connection test failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to connect to WordPress';
      return errorResponse(errorMsg, 401, origin);
    }

    // Fetch categories
    const categories = await fetchWordPressCategories(validatedUrl, username, cleanedPassword);

    // Encrypt the Application Password for secure storage
    console.log('Encrypting Application Password...');
    const encryptedPassword = await encrypt(cleanedPassword);

    // Initialize Supabase client
    const supabase = createSupabaseClient();

    // Check for existing connection
    console.log('Checking for existing WordPress connection...');
    const { data: existingConnection } = await supabase
      .from('website_connections')
      .select('id')
      .eq('user_id', user_id)
      .eq('platform', 'wordpress')
      .eq('website_url', validatedUrl)
      .maybeSingle();

    // Prepare connection data
    const connectionData = {
      user_id: user_id,
      business_id: business_id || null,
      platform: 'wordpress',
      website_url: validatedUrl,
      site_name: siteInfo.name,
      wordpress_username: username,
      wordpress_app_password: encryptedPassword,
      access_token: null, // WordPress doesn't use OAuth
      refresh_token: null,
      token_expires_at: null,
      metadata: {
        site_description: siteInfo.description,
        site_home: siteInfo.home,
        timezone: siteInfo.timezone,
        namespaces: siteInfo.namespaces,
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
        })),
      },
      is_active: true,
      last_verified_at: new Date().toISOString(),
    };

    let connectionId: string;

    if (existingConnection) {
      // Update existing connection
      console.log('Updating existing WordPress connection:', existingConnection.id);
      const { error: updateError } = await supabase
        .from('website_connections')
        .update(connectionData)
        .eq('id', existingConnection.id);

      if (updateError) {
        console.error('Failed to update connection:', updateError);
        return errorResponse('Failed to update WordPress connection', 500, origin);
      }

      connectionId = existingConnection.id;
      console.log('WordPress connection updated successfully');
    } else {
      // Create new connection
      console.log('Creating new WordPress connection...');
      const { data: newConnection, error: insertError } = await supabase
        .from('website_connections')
        .insert(connectionData)
        .select('id')
        .single();

      if (insertError || !newConnection) {
        console.error('Failed to create connection:', insertError);
        return errorResponse('Failed to save WordPress connection', 500, origin);
      }

      connectionId = newConnection.id;
      console.log('WordPress connection created successfully');
    }

    // Return success response
    return jsonResponse(
      {
        success: true,
        connection_id: connectionId,
        site_name: siteInfo.name,
        site_url: validatedUrl,
        categories: categories.length,
      },
      200,
      origin
    );
  } catch (error) {
    console.error('WordPress connect error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(errorMsg, 500, origin);
  }
});
