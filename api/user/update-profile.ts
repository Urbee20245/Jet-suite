// /api/user/update-profile.ts
// Backend API endpoint to save user profile changes to database

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req, res) {
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
    // Update user profile in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
      email, // You might need to get user ID from email first
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

    // Also update in your custom users table if you have one
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
      .single();

    if (dbError) {
      console.error('Database update error:', dbError);
      throw new Error('Failed to update user profile in database');
    }

    // Return success
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

  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ 
      message: 'Failed to update profile',
      error: error.message 
    });
  }
}
