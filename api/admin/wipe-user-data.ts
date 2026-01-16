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

  const { targetUserId } = req.body;
  const userEmail = req.headers['x-user-email'] as string;

  // 1. Admin Verification
  if (userEmail !== ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Unauthorized: Admin access required' });
  }

  if (!targetUserId) {
    return res.status(400).json({ error: 'Missing targetUserId' });
  }

  try {
    console.log(`[Admin Wipe] Initiating data wipe for user ID: ${targetUserId}`);

    // Tables to delete data from (using ON DELETE CASCADE where possible, but explicitly deleting for safety and clarity)
    const tables = [
      'business_profiles',
      'growth_plan_tasks',
      'audit_reports',
      'saved_keywords',
      'social_connections',
      'billing_accounts',
      'profiles',
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('user_id', targetUserId);

      if (error) {
        console.error(`[Admin Wipe] Failed to delete data from ${table}:`, error);
        // Continue to next table, but log the error
      } else {
        console.log(`[Admin Wipe] Successfully deleted data from ${table}.`);
      }
    }
    
    // CRITICAL: Delete the user from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(targetUserId);

    if (authError) {
        console.error('[Admin Wipe] Failed to delete user from Auth:', authError);
        // If the user is already deleted, this is fine, otherwise, it's a critical error.
        if (!authError.message.includes('User not found')) {
             return res.status(500).json({ 
                error: 'Failed to delete user from authentication system.', 
                message: authError.message 
            });
        }
    } else {
        console.log(`[Admin Wipe] Successfully deleted user from Auth: ${targetUserId}`);
    }

    return res.status(200).json({ success: true, message: `All data and user account wiped for ${targetUserId}` });
  } catch (error: any) {
    console.error('[Admin Wipe] General error:', error);
    return res.status(500).json({ error: 'Internal server error during data wipe', message: error.message });
  }
}