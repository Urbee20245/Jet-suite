// api/auth/facebook/callback.ts
// Vercel Serverless Function

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!supabaseUrl || !supabaseServiceKey || !FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || !APP_URL || !ENCRYPTION_KEY) {
  throw new Error('Missing required environment variables for Facebook OAuth callback setup.');
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey
);

// Facebook API configuration
const FACEBOOK_REDIRECT_URI = `${APP_URL}/api/auth/facebook/callback`;
const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token';
const FACEBOOK_GRAPH_URL = 'https://graph.facebook.com/v18.0';

// Encryption functions
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY!), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Facebook API functions
async function getAccessToken(code: string) {
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID!,
    client_secret: FACEBOOK_APP_SECRET!,
    redirect_uri: FACEBOOK_REDIRECT_URI,
    code: code,
  });

  const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    console.error('Facebook token error:', error);
    throw new Error(`Failed to get access token: ${error.error?.message || 'Unknown error'}`);
  }
  return await response.json();
}

async function getLongLivedToken(shortToken: string) {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: FACEBOOK_APP_ID!,
    client_secret: FACEBOOK_APP_SECRET!,
    fb_exchange_token: shortToken,
  });

  const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    console.error('Facebook long-lived token error:', error);
    throw new Error('Failed to get long-lived token');
  }
  return await response.json();
}

async function getUserProfile(accessToken: string) {
  const params = new URLSearchParams({
    fields: 'id,name,email',
    access_token: accessToken,
  });

  const response = await fetch(`${FACEBOOK_GRAPH_URL}/me?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to get user profile');
  }
  return await response.json();
}

async function getUserPages(accessToken: string) {
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: 'id,name,access_token,instagram_business_account',
  });

  const response = await fetch(`${FACEBOOK_GRAPH_URL}/me/accounts?${params.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    console.error('Failed to get pages:', error);
    return [];
  }
  const data = await response.json();
  return data.data || [];
}

async function getInstagramAccount(pageAccessToken: string, instagramBusinessAccountId: string) {
  try {
    const params = new URLSearchParams({
      fields: 'id,username,profile_picture_url',
      access_token: pageAccessToken,
    });

    const response = await fetch(`${FACEBOOK_GRAPH_URL}/${instagramBusinessAccountId}?${params.toString()}`);
    if (!response.ok) {
      console.error('Failed to get Instagram account');
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Instagram account:', error);
    return null;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    console.log('Callback received, query params:', req.query);
    
    const { code, state, error: fbError, error_description } = req.query;

    // Handle Facebook OAuth errors
    if (fbError) {
      console.error('Facebook OAuth error:', fbError, error_description);
      return res.redirect(
        `${APP_URL}/business-details?error=facebook_auth_failed&details=${fbError}`
      );
    }

    // Validate code parameter
    if (!code) {
      console.error('Missing code parameter');
      return res.redirect(
        `${APP_URL}/business-details?error=missing_code`
      );
    }

    // Validate state parameter
    if (!state) {
      console.error('Missing state parameter');
      return res.redirect(
        `${APP_URL}/business-details?error=missing_state`
      );
    }

    // Convert to strings
    const codeStr = Array.isArray(code) ? code[0] : code;
    const stateStr = Array.isArray(state) ? state[0] : state;

    console.log('Code:', codeStr?.substring(0, 20) + '...');
    console.log('State:', stateStr);

    // Verify state token (CSRF protection)
    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', stateStr)
      .eq('platform', 'facebook')
      .single();

    if (stateError || !stateData) {
      console.error('Invalid OAuth state:', stateError);
      return res.redirect(
        `${APP_URL}/business-details?error=invalid_state`
      );
    }

    // Check if state has expired
    if (new Date(stateData.expires_at) < new Date()) {
      await supabase.from('oauth_states').delete().eq('state', stateStr);
      console.error('State expired');
      return res.redirect(
        `${APP_URL}/business-details?error=state_expired`
      );
    }

    const userId = stateData.user_id;
    console.log('Valid state for user:', userId);

    // Exchange code for access token
    console.log('Exchanging code for access token...');
    const tokens = await getAccessToken(codeStr);
    console.log('Got access token');

    // Get long-lived token (60 days)
    console.log('Getting long-lived token...');
    const longLivedTokens = await getLongLivedToken(tokens.access_token);
    console.log('Got long-lived token');

    // Get user profile
    console.log('Getting user profile...');
    const userProfile = await getUserProfile(longLivedTokens.access_token);
    console.log('Got user profile:', userProfile.name);

    // Get user's Facebook pages with Instagram info
    console.log('Getting user pages...');
    const pages = await getUserPages(longLivedTokens.access_token);
    console.log('Got pages:', pages.length);

    // Check if any page has Instagram Business Account
    let instagramAccount = null;
    let pageWithInstagram = null;
    
    for (const page of pages) {
      if (page.instagram_business_account) {
        console.log('Found Instagram account on page:', page.name);
        instagramAccount = await getInstagramAccount(
          page.access_token,
          page.instagram_business_account.id
        );
        if (instagramAccount) {
          pageWithInstagram = page;
          console.log('Instagram username:', instagramAccount.username);
          break;
        }
      }
    }

    // Calculate token expiration (60 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);

    // Save Facebook connection
    const { data: existingFBConnection } = await supabase
      .from('social_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', 'facebook')
      .single();

    if (existingFBConnection) {
      console.log('Updating existing Facebook connection');
      await supabase
        .from('social_connections')
        .update({
          access_token: encrypt(longLivedTokens.access_token),
          token_expires_at: expiresAt.toISOString(),
          platform_user_id: userProfile.id,
          platform_username: userProfile.name,
          platform_page_id: pages.length > 0 ? pages[0].id : null,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingFBConnection.id);
    } else {
      console.log('Creating new Facebook connection');
      await supabase
        .from('social_connections')
        .insert({
          user_id: userId,
          platform: 'facebook',
          access_token: encrypt(longLivedTokens.access_token),
          token_expires_at: expiresAt.toISOString(),
          platform_user_id: userProfile.id,
          platform_username: userProfile.name,
          platform_page_id: pages.length > 0 ? pages[0].id : null,
          is_active: true,
        });
    }

    // Save Instagram connection if found
    if (instagramAccount && pageWithInstagram) {
      console.log('Saving Instagram connection:', instagramAccount.username);
      
      const { data: existingIGConnection } = await supabase
        .from('social_connections')
        .select('id')
        .eq('user_id', userId)
        .eq('platform', 'instagram')
        .single();

      if (existingIGConnection) {
        console.log('Updating existing Instagram connection');
        await supabase
          .from('social_connections')
          .update({
            access_token: encrypt(pageWithInstagram.access_token),
            token_expires_at: expiresAt.toISOString(),
            platform_user_id: instagramAccount.id,
            platform_username: instagramAccount.username,
            platform_page_id: pageWithInstagram.id,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingIGConnection.id);
      } else {
        console.log('Creating new Instagram connection');
        await supabase
          .from('social_connections')
          .insert({
            user_id: userId,
            platform: 'instagram',
            access_token: encrypt(pageWithInstagram.access_token),
            token_expires_at: expiresAt.toISOString(),
            platform_user_id: instagramAccount.id,
            platform_username: instagramAccount.username,
            platform_page_id: pageWithInstagram.id,
            is_active: true,
          });
      }
    } else {
      console.log('No Instagram Business account found');
    }

    // Clean up state
    await supabase.from('oauth_states').delete().eq('state', stateStr);
    console.log('Connection(s) saved successfully!');

    // Redirect back to app with success
    res.redirect(
      `${APP_URL}/business-details?success=facebook_connected`
    );
  } catch (error) {
    console.error('Facebook callback error:', error);
    res.redirect(
      `${APP_URL}/business-details?error=connection_failed&details=${encodeURIComponent(String(error))}`
    );
  }
}