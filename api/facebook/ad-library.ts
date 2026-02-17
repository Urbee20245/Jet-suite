// api/facebook/ad-library.ts
// Vercel Serverless Function — Facebook Ad Library proxy
// Uses app access token (APP_ID|APP_SECRET) so credentials never reach the client.

import type { VercelRequest, VercelResponse } from '@vercel/node';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
  throw new Error('Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET environment variables.');
}

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
  'impressions',
  'spend',
  'page_name',
  'publisher_platforms',
].join(',');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    // App access token — safe to use on the server
    const appAccessToken = `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;

    const params = new URLSearchParams({
      access_token: appAccessToken,
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
      console.error('Facebook Ad Library API error:', data.error);
      return res.status(response.status || 500).json({
        error: data.error?.message ?? 'Failed to fetch ads from the Facebook Ad Library.',
        code: data.error?.code,
      });
    }

    // Return only the data array, capped for safety
    return res.status(200).json({ ads: data.data ?? [] });
  } catch (error) {
    console.error('Ad Library endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error while fetching Ad Library data.' });
  }
}
