// api/facebook/ad-library.ts
// Vercel Serverless Function — Facebook Ad Library proxy
//
// IMPORTANT: The Meta ads_archive endpoint requires a USER access token with
// the `ads_read` permission — an app access token (APP_ID|SECRET) is NOT
// sufficient and will return "An unknown error has occurred" (error code 10).
//
// Setup steps:
// 1. Complete identity verification at facebook.com/ID
// 2. Enable 2FA on your Facebook account
// 3. Generate a long-lived user token at developers.facebook.com/tools/explorer
//    with the `ads_read` permission scope
// 4. Add it to Vercel environment variables as: FACEBOOK_USER_ACCESS_TOKEN
// 5. Refresh every ~55 days at developers.facebook.com/tools/debug/accesstoken

import type { VercelRequest, VercelResponse } from '@vercel/node';

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

// Fields we request from the Ad Library
const AD_LIBRARY_FIELDS = [
  'id',
  'ad_creation_time',
  'ad_creative_bodies',
  'ad_creative_link_captions',
  'ad_creative_link_descriptions',
  'ad_creative_link_titles',
  'ad_delivery_start_time',
  'ad_snapshot_url',
  'page_name',
  'publisher_platforms',
].join(',');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Prefer long-lived user access token; fall back to app token with a warning
  const userAccessToken = process.env.FACEBOOK_USER_ACCESS_TOKEN;
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  if (!userAccessToken && (!appId || !appSecret)) {
    return res.status(503).json({
      error: 'Facebook Ad Library is not configured. Ask your administrator to add FACEBOOK_USER_ACCESS_TOKEN to the environment variables.',
      setup_required: true,
    });
  }

  const accessToken = userAccessToken ?? `${appId}|${appSecret}`;
  const usingAppToken = !userAccessToken;

  const {
    search_terms,
    ad_reached_countries = 'US',
    ad_type = 'ALL',
    search_page_ids,
    limit = '20',
  } = req.query;

  // Require at least one search parameter
  if (!search_terms && !search_page_ids) {
    return res.status(400).json({ error: 'Provide search_terms or search_page_ids to search the Ad Library.' });
  }

  try {
    const params = new URLSearchParams({
      access_token: accessToken,
      ad_type: Array.isArray(ad_type) ? ad_type[0] : ad_type,
      ad_reached_countries: `["${Array.isArray(ad_reached_countries) ? ad_reached_countries[0] : ad_reached_countries}"]`,
      fields: AD_LIBRARY_FIELDS,
      limit: String(Math.min(parseInt(Array.isArray(limit) ? limit[0] : limit, 10) || 20, 25)),
    });

    if (search_terms) {
      params.set('search_terms', Array.isArray(search_terms) ? search_terms[0] : search_terms);
    }

    if (search_page_ids) {
      const ids = Array.isArray(search_page_ids) ? search_page_ids[0] : search_page_ids;
      params.set('search_page_ids', ids);
    }

    const url = `${GRAPH_API_BASE}/ads_archive?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
      const fbCode = data.error?.code;
      const fbMessage = data.error?.message ?? 'Unknown error from Meta API';

      console.error('Facebook Ad Library API error:', data.error);

      // Error 10 / 200: permission denied — most often means the token type is wrong
      // or identity verification hasn't been completed
      if (fbCode === 10 || fbCode === 200) {
        return res.status(403).json({
          error: usingAppToken
            ? 'The Facebook Ad Library requires a user access token with the ads_read permission. Please add FACEBOOK_USER_ACCESS_TOKEN to your environment variables. See setup instructions in api/facebook/ad-library.ts.'
            : 'Your Facebook access token does not have permission to access the Ad Library. Make sure you completed identity verification at facebook.com/ID, enabled 2FA, and your token has the ads_read permission.',
          code: fbCode,
          setup_required: usingAppToken,
        });
      }

      // Error 190: invalid or expired token
      if (fbCode === 190) {
        return res.status(401).json({
          error: 'Your Facebook access token has expired. Please generate a new long-lived token at developers.facebook.com/tools/explorer and update FACEBOOK_USER_ACCESS_TOKEN in your environment variables.',
          code: fbCode,
          token_expired: true,
        });
      }

      return res.status(response.status || 500).json({
        error: fbMessage,
        code: fbCode,
      });
    }

    return res.status(200).json({ ads: data.data ?? [] });
  } catch (error) {
    console.error('Ad Library endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error while fetching Ad Library data.' });
  }
}
