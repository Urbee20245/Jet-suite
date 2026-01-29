// /api/user/update-profile.ts
// Backend API endpoint to save user profile changes to database
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.SUPABASE_URL;
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
}) as any;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, firstName, lastName, phone, role, email } = req.body;

  // Validate required fields
  if (!userId || !firstName || !lastName || !email) {
    return res.status(400).json({ 
      message: 'Missing required fields: userId, firstName, lastName, or email' 
    });
  }

  // Validate phone number format if provided (optional field)
  if (phone && phone.length > 0) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        message: 'Invalid phone number format. Use digits, spaces, dashes, parentheses, and + only.'
      });
    }
    
    // Check reasonable length (between 7 and 20 characters after removing spaces/dashes)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (cleanPhone.length < 7 || cleanPhone.length > 20) {
      return res.status(400).json({
        message: 'Phone number must be between 7 and 20 digits.'
      });
    }
  }

  try {
    console.log('Updating profile for UUID:', userId);

    // 1. Update user metadata in Supabase Auth
    const { error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          phone: phone || '',
          role: role || '',
        },
      }
    );

    if (authError) {
      console.warn('Auth metadata update warning:', authError.message);
    }

    // 2. Update the public profiles table
    const { data: profileData, error: dbError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null, // Store as null if empty
        role: role || '',
        email: email,
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
