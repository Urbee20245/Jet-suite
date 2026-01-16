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

  const adminEmail = req.headers['x-user-email'] as string;

  // 1. Admin Verification
  if (adminEmail !== ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 2. Find all users with free plans
    // We target 'admin_granted_free' and 'free_tier'
    const { data: freeAccounts, error: fetchError } = await supabase
      .from('billing_accounts')
      .select('user_id, user_email')
      .in('subscription_plan', ['admin_granted_free', 'free_tier']);

    if (fetchError) throw fetchError;

    if (!freeAccounts || freeAccounts.length === 0) {
      return res.status(200).json({ success: true, message: 'No free users found to wipe.' });
    }

    const results = {
      attempted: freeAccounts.length,
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    };

    // 3. Loop and wipe (Sequential to avoid rate limits on Auth API)
    for (const account of freeAccounts) {
        try {
            console.log(`[Bulk Wipe] Wiping user: ${account.user_email} (${account.user_id})`);
            
            // Delete from data tables
            const tables = ['business_profiles', 'growth_plan_tasks', 'audit_reports', 'saved_keywords', 'social_connections', 'billing_accounts'];
            for (const table of tables) {
                await supabase.from(table).delete().eq('user_id', account.user_id);
            }
            
            // Delete profile
            await supabase.from('profiles').delete().eq('id', account.user_id);
            
            // Delete Auth user
            const { error: authError } = await supabase.auth.admin.deleteUser(account.user_id);
            if (authError && !authError.message.includes('User not found')) throw authError;

            results.succeeded++;
        } catch (err: any) {
            results.failed++;
            results.errors.push(`${account.user_email}: ${err.message}`);
        }
    }

    return res.status(200).json({ 
        success: true, 
        message: `Bulk wipe complete. Succeeded: ${results.succeeded}, Failed: ${results.failed}`,
        results 
    });

  } catch (error: any) {
    console.error('[Bulk Wipe] Fatal error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}