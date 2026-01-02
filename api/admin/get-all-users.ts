import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for admin user fetching.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // In a real application, this endpoint would be protected to ensure only admins can access it.
  // For now, it's open but relies on the service role key for Supabase access.

  try {
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    const userIds = users.map(u => u.id);

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);
    if (profilesError) throw profilesError;

    const combinedUsers = users.map(user => {
      const profile = profiles.find(p => p.id === user.id);
      return {
        id: user.id,
        email: user.email,
        role: profile?.role || user.user_metadata?.role || 'Owner',
        created_at: user.created_at,
        first_name: profile?.first_name || user.user_metadata?.first_name || '',
        last_name: profile?.last_name || user.user_metadata?.last_name || '',
      };
    });

    res.status(200).json({ users: combinedUsers });
  } catch (error: any) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ error: 'Failed to fetch users', message: error.message });
  }
}