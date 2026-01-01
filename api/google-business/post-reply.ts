import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!supabaseUrl || !supabaseServiceKey || !ENCRYPTION_KEY) {
  throw new Error('Missing required environment variables for Google Business post-reply.');
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, reviewName, replyText } = req.body as {
      userId?: string;
      reviewName?: string;
      replyText?: string;
    };

    if (!userId || !reviewName || !replyText) {
      return res.status(400).json({ error: 'userId, reviewName, and replyText are required' });
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

    if (!connection.access_token) {
      return res.status(400).json({ error: 'No access token for Google Business connection' });
    }

    const accessToken = decrypt(connection.access_token);

    const url = `${MY_BUSINESS_API_BASE}/${reviewName}/reply`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment: replyText }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error('Google post-reply API error:', errorBody);
      return res.status(response.status).json({ error: 'failed_to_post_reply', details: errorBody });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in post-reply:', error);
    res.status(500).json({ error: 'internal_error' });
  }
}