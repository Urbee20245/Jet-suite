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

  const { email, password, firstName, lastName } = req.body;
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let userId: string | undefined;

  try {
    // 1. Create user in Supabase Auth. This will trigger the `handle_new_user` function in the database.
    const { data: newUserData, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (createUserError) throw createUserError;
    userId = newUserData.user.id;

    // 2. The trigger has already created a `profiles` row. Now, we UPDATE it with the full name.
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        role: 'Owner'
      })
      .eq('id', userId);

    if (profileError) throw profileError;

    // 3. The trigger has also created a `billing_accounts` row with a null status.
    // We now UPDATE that record to grant free, active access.
    const { error: billingError } = await supabase
      .from('billing_accounts')
      .update({
        subscription_status: 'active',
        subscription_plan: 'admin_granted_free',
      })
      .eq('user_id', userId);

    if (billingError) throw billingError;

    // 4. Create a basic business profile for the new user so they can start onboarding.
    const { error: businessError } = await supabase
      .from('business_profiles')
      .insert({
        user_id: userId,
        business_name: `${firstName}'s Business`,
        industry: 'General',
        city: 'City',
        state: 'State',
        is_primary: true,
        is_complete: false,
      });

    if (businessError) throw businessError;

    res.status(201).json({ success: true, message: `Free user ${email} created successfully.` });
  } catch (error: any) {
    console.error('[Admin Create Free User] Error:', error);
    // Attempt to clean up the auth user if other steps failed to prevent orphaned accounts.
    if (userId) {
        await supabase.auth.admin.deleteUser(userId);
        console.log(`[Admin Cleanup] Deleted orphaned auth user: ${email}`);
    }
    res.status(500).json({ error: 'Failed to create free user', message: error.message });
  }
}