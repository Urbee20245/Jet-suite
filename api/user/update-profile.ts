// /api/user/update-profile.ts
// Backend API endpoint to save user profile changes to database
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.SUPABASE_URL; // Use standard key for serverless functions
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create admin client - service role key gives admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, firstName, lastName, role, email } = req.body;

  // Validate required fields - userId is now the primary key
  if (!userId || !firstName || !lastName) {
    return res.status(400).json({ 
      message: 'Missing required fields: userId, firstName, lastName' 
    });
  }

  try {
    console.log('Updating profile for UUID:', userId);

    // 1. Update user metadata in Supabase Auth by UUID
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: role || '',
        },
        // Only update email if it was actually provided in the request
        ...(email ? { email } : {})
      }
    );

    if (authError) {
      console.error('Auth update error:', authError);
      throw new Error(`Auth update failed: ${authError.message}`);
    }

    // 2. Update the public profiles table using the UUID as the primary key
    // We use upsert to ensure a profile exists for this authenticated user
    const { data: profileData, error: dbError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        role: role || '',
        updated_at: new Date().toISOString(),
        ...(email ? { email } : {})
      }, { onConflict: 'id' })
      .select()
      .single();

    if (dbError) {
      console.error('Database update error:', dbError);
      throw new Error(`Database update failed: ${dbError.message}`);
    }

    // Return success
    console.log('Profile updated successfully for UUID:', userId);
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: profileData
    });

  } catch (error: any) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ 
      message: 'Failed to update profile',
      error: error.message 
    });
  }
}