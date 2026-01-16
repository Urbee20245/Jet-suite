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

  const adminUserEmail = req.headers['x-user-email'] as string;
  if (adminUserEmail !== ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ error: 'Missing targetUserId' });
  }

  try {
    const { error } = await supabase
      .from('billing_accounts')
      .update({
        subscription_status: 'active',
        subscription_plan: 'admin_granted_free', // A specific plan for clarity
      })
      .eq('user_id', targetUserId);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'User has been granted free access.' });
  } catch (error: any) {
    console.error('[Admin Grant Access] Error:', error);
    res.status(500).json({ error: 'Failed to grant free access', message: error.message });
  }
}