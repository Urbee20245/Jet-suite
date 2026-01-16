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

  try {
    // 1. Create user in Supabase Auth
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
    const userId = newUserData.user.id;

    // 2. Explicitly create the public profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: 'Owner'
      });

    if (profileError) throw profileError;

    // 3. Explicitly create the billing account with free tier
    const { error: billingError } = await supabase
      .from('billing_accounts')
      .insert({
        user_id: userId,
        user_email: email,
        subscription_status: 'active',
        subscription_plan: 'free_tier',
        is_founder: false,
        business_count: 1,
        seat_count: 1,
      });

    if (billingError) throw billingError;

    // 4. Create a basic business profile for the new user
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
    // Attempt to clean up the auth user if other steps failed
    if (error.message.includes('profiles') || error.message.includes('billing_accounts')) {
        const { data: { user } } = await supabase.auth.admin.getUserByEmail(email);
        if (user) {
            await supabase.auth.admin.deleteUser(user.id);
        }
    }
    res.status(500).json({ error: 'Failed to create free user', message: error.message });
  }
}