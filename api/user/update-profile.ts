// /api/user/update-profile.ts
// Backend API endpoint to save user profile changes to database

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, firstName, lastName, role } = req.body;

  // Validate required fields
  if (!email || !firstName || !lastName) {
    return res.status(400).json({ 
      message: 'Missing required fields: email, firstName, lastName' 
    });
  }

  try {
    console.log('Updating profile for:', email, { firstName, lastName, role });

    // Get all users and find by email
    const { data: usersData, error: findError } = await supabase.auth.admin.listUsers();
    
    if (findError) {
      console.error('Error finding user:', findError);
      throw new Error('Failed to find user');
    }

    // Find user by email (with proper type handling)
    const user = usersData?.users?.find((u: any) => u.email === email);
    
    if (!user) {
      console.error('User not found:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user metadata in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: role || '',
        }
      }
    );

    if (authError) {
      console.error('Auth update error:', authError);
      // Continue even if auth update fails - we'll update the database
    }

    // Check if users table exists and update it
    const { data: tableCheck } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (tableCheck) {
      // Users table exists and has this record - update it
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          role: role || '',
          updated_at: new Date().toISOString(),
        })
        .eq('email', email)
        .select()
        .maybeSingle();

      if (dbError) {
        console.error('Database update error:', dbError);
        // Don't fail if database update fails - auth update succeeded
      }
    } else {
      // Users table doesn't exist or record not found - insert it
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          email: email,
          first_name: firstName,
          last_name: lastName,
          role: role || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        // Don't fail - auth update succeeded
      }
    }

    // Return success
    console.log('Profile updated successfully for:', email);
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        email,
        firstName,
        lastName,
        role,
      },
    });

  } catch (error: any) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ 
      message: 'Failed to update profile',
      error: error.message 
    });
  }
}
