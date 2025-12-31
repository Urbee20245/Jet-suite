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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, firstName, lastName, role, email } = req.body;

  // Validate required fields - userId and email are critical for the profiles table upsert
  if (!userId || !firstName || !lastName || !email) {
    return res.status(400).json({ 
      message: 'Missing required fields: userId, firstName, lastName, or email' 
    });
  }

  try {
    console.log('Updating profile for UUID:', userId);

    // 1. Update user metadata in Supabase Auth by UUID (Optional, but good practice)
    const { error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: role || '',
        },
        // Do NOT update email here unless explicitly requested and verified, 
        // as it requires special handling in Supabase Auth.
      }
    );

    if (authError) {
      console.warn('Auth metadata update warning:', authError.message);
      // Continue even if metadata update fails, as the primary goal is the public profile table
    }

    // 2. Update the public profiles table using the UUID as the primary key
    // CRITICAL: Include email in the upsert data to satisfy the non-nullable constraint.
    const { data: profileData, error: dbError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        role: role || '',
        email: email, // Ensure email is included
        updated_at: new Date().toISOString(),
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
      message: error.message || 'Failed to update profile due to server error.',
      error: error.message 
    });
  }
}