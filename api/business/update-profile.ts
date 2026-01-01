import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Defensive check for missing keys at runtime
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('CRITICAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Supabase environment variables are missing on the server.',
    });
  }

  // Initialize Supabase client inside the handler
  let supabase: SupabaseClient;
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  } catch (e) {
    console.error('Supabase client initialization failed:', e);
    return res.status(500).json({
      error: 'Server initialization error',
      message: 'Failed to create Supabase client.',
    });
  }

  try {
    const {
      userId,
      businessName,
      websiteUrl,
      industry,
      city,
      state,
      isPrimary = true,
      isComplete = true,
    } = req.body;

    if (!userId || !businessName || !websiteUrl || !industry || !city || !state) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const businessData = {
      user_id: userId,
      business_name: businessName,
      business_website: websiteUrl,
      industry: industry,
      city: city,
      state: state,
      is_primary: isPrimary,
      is_active: true,
      is_complete: isComplete,
      updated_at: new Date().toISOString(),
    };

    // --- CRITICAL DATABASE OPERATION ---
    const { data, error: dbError } = await supabase
      .from('business_profiles')
      .upsert(businessData, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Supabase upsert error:', dbError);
      // Throwing the error here ensures it is caught by the outer catch block
      throw new Error(`Database Error: ${dbError.message} (Code: ${dbError.code})`);
    }

    return res.status(200).json({ businessProfile: data });
  } catch (error: any) {
    console.error('Update business profile error:', error);
    // Return a structured error response to the client
    return res.status(500).json({
      error: 'Failed to update business profile',
      message: error.message,
    });
  }
}