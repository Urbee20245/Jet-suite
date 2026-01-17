import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'theivsightcompany@gmail.com';
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userEmail = req.headers['x-user-email'] as string;
  if (userEmail !== ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Unauthorized: Admin access required' });
  }

  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ error: 'Missing targetUserId' });
  }

  try {
    // Reset DNA in all business profiles for this user
    const { error } = await supabase
      .from('business_profiles')
      .update({
        dna: { logo: '', colors: [], fonts: '', style: '' },
        brand_dna_profile: null,
        is_dna_approved: false,
        dna_last_updated_at: null
      })
      .eq('user_id', targetUserId);

    if (error) throw error;

    console.log(`[Admin] DNA reset for user ${targetUserId}`);
    return res.status(200).json({ success: true, message: 'DNA reset successfully' });

  } catch (error: any) {
    console.error('[Admin Reset DNA] Error:', error);
    return res.status(500).json({ error: 'Failed to reset DNA', message: error.message });
  }
}