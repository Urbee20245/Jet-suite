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
    // 1. Create user in Supabase Auth
    const { data: newUserData, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Mark as verified immediately
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (createUserError) throw createUserError;
    userId = newUserData.user.id;

    // 2. Explicitly Create Profile (don't rely on trigger)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: 'Owner'
      }, { onConflict: 'id' });

    if (profileError) throw profileError;

    // 3. Explicitly Create Billing Account with ACTIVE status
    const { error: billingError } = await supabase
      .from('billing_accounts')
      .upsert({
        user_id: userId,
        user_email: email,
        subscription_status: 'active',
        subscription_plan: 'admin_granted_free',
        business_count: 1,
        seat_count: 1,
        is_founder: false,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (billingError) throw billingError;

    // 4. Create Initial Business Profile so they skip the onboarding check
    const { error: businessError } = await supabase
      .from('business_profiles')
      .insert({
        user_id: userId,
        business_name: `${firstName}'s Business`,
        industry: 'Other',
        city: 'Sample City',
        state: 'Sample State',
        is_primary: true,
        is_complete: false, // User will be prompted to complete details on login
      });

    if (businessError) throw businessError;

    console.log(`[Admin] Successfully created free user: ${email} (ID: ${userId})`);
    res.status(201).json({ 
        success: true, 
        message: `User created successfully!`,
        userId: userId
    });

  } catch (error: any) {
    console.error('[Admin Create Free User] Error:', error);
    // Cleanup if partially successful
    if (userId) {
        await supabase.auth.admin.deleteUser(userId);
    }
    res.status(500).json({ error: 'Failed to create free user', message: error.message });
  }
}