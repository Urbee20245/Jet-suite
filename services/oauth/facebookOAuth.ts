// services/oauth/facebookOAuth.ts

const FACEBOOK_API_VERSION = 'v18.0';
const FACEBOOK_OAUTH_URL = `https://www.facebook.com/${FACEBOOK_API_VERSION}/dialog/oauth`;
const FACEBOOK_TOKEN_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/oauth/access_token`;
const FACEBOOK_GRAPH_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;

export interface FacebookOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

export interface FacebookTokens {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface FacebookUser {
  id: string;
  name: string;
  email?: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

export class FacebookOAuthService {
  private config: FacebookOAuthConfig;

  constructor(config: FacebookOAuthConfig) {
    this.config = config;
  }

  /**
   * Generate authorization URL to redirect user to Facebook login
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      redirect_uri: this.config.redirectUri,
      state: state,
      scope: 'pages_manage_posts,pages_read_engagement,public_profile',
      response_type: 'code',
    });

    return `${FACEBOOK_OAUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<FacebookTokens> {
    const params = new URLSearchParams({
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      redirect_uri: this.config.redirectUri,
      code: code,
    });

    const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get access token: ${error.error?.message || 'Unknown error'}`);
    }

    return await response.json();
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken: string): Promise<FacebookUser> {
    const params = new URLSearchParams({
      fields: 'id,name,email',
      access_token: accessToken,
    });

    const response = await fetch(`${FACEBOOK_GRAPH_URL}/me?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get user profile: ${error.error?.message || 'Unknown error'}`);
    }

    return await response.json();
  }

  /**
   * Get user's Facebook pages (for posting)
   */
  async getUserPages(accessToken: string): Promise<FacebookPage[]> {
    const params = new URLSearchParams({
      access_token: accessToken,
    });

    const response = await fetch(`${FACEBOOK_GRAPH_URL}/me/accounts?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get user pages: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Exchange short-lived token for long-lived token (60 days)
   */
  async getLongLivedToken(shortLivedToken: string): Promise<FacebookTokens> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.config.appId,
      client_secret: this.config.appSecret,
      fb_exchange_token: shortLivedToken,
    });

    const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get long-lived token: ${error.error?.message || 'Unknown error'}`);
    }

    return await response.json();
  }

  /**
   * Post to a Facebook page
   */
  async postToPage(pageAccessToken: string, pageId: string, message: string): Promise<{ id: string }> {
    const response = await fetch(`${FACEBOOK_GRAPH_URL}/${pageId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        access_token: pageAccessToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to post to page: ${error.error?.message || 'Unknown error'}`);
    }

    return await response.json();
  }

  /**
   * Verify access token is valid
   */
  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        input_token: accessToken,
        access_token: `${this.config.appId}|${this.config.appSecret}`,
      });

      const response = await fetch(`${FACEBOOK_GRAPH_URL}/debug_token?${params.toString()}`);
      const data = await response.json();

      return data.data?.is_valid || false;
    } catch (error) {
      return false;
    }
  }
}

// Helper function to create service instance
export function createFacebookOAuthService(): FacebookOAuthService {
  return new FacebookOAuthService({
    appId: process.env.FACEBOOK_APP_ID!,
    appSecret: process.env.FACEBOOK_APP_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`,
  });
}
