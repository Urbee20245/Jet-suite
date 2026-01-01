import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!supabaseUrl || !supabaseServiceKey || !ENCRYPTION_KEY) {
  throw new Error('Missing required environment variables for Google Business get-reviews.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const MY_BUSINESS_API_BASE = 'https://mybusiness.googleapis.com/v4';

// Decrypt AES-256-CBC
function getKeyBuffer() {
  return crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
}

function decrypt(text: string): string {
  const [ivHex, encrypted] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', getKeyBuffer(), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Map Google starRating string to numeric value
function starRatingToNumber(starRating: string | undefined): number {
  switch (starRating) {
    case 'ONE':
      return 1;
    case 'TWO':
      return 2;
    case 'THREE':
      return 3;
    case 'FOUR':
      return 4;
    case 'FIVE':
      return 5;
    default:
      return 0;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { data: connection, error: connError } = await supabase
      .from('social_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'google_business')
      .eq('is_active', true)
      .single();

    if (connError || !connection) {
      return res.status(404).json({ error: 'no_google_business_connection' });
    }

    if (!connection.access_token || !connection.platform_page_id) {
      return res.status(400).json({ error: 'Incomplete Google Business connection' });
    }

    const accessToken = decrypt(connection.access_token);
    const locationName = connection.platform_page_id as string;

    const url = `${MY_BUSINESS_API_BASE}/${locationName}/reviews`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error('Google reviews API error:', errorBody);
      return res.status(response.status).json({ error: 'failed_to_fetch_reviews', details: errorBody });
    }

    const data = await response.json() as {
      reviews?: Array<{
        name: string;
        createTime?: string;
        comment?: string;
        starRating?: string;
        reviewer?: { displayName?: string };
      }>;
    };

    const reviews = (data.reviews || []).map((r) => {
      const ratingNumber = starRatingToNumber(r.starRating);
      return {
        id: r.name,
        author: r.reviewer?.displayName || 'Customer',
        rating: ratingNumber,
        text: r.comment || '',
        date: r.createTime ? new Date(r.createTime).toLocaleDateString() : '',
        isPositive: ratingNumber >= 4,
        googleReviewName: r.name,
        googleLocationName: locationName,
        source: 'google_business',
      };
    });

    res.status(200).json({ reviews });
  } catch (error) {
    console.error('Error in get-reviews:', error);
    res.status(500).json({ error: 'internal_error' });
  }
}