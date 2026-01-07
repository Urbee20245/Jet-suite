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

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('CRITICAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Supabase environment variables are missing on the server.',
    });
  }

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
      businessDescription,
      googleBusiness, // ✅ NEW: Google Business Profile data
    } = req.body;

    if (!userId || !businessName || !websiteUrl || !industry || !city || !state) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if a primary business profile already exists for this user
    const { data: existingPrimary, error: fetchError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const businessData = {
      user_id: userId,
      business_name: businessName,
      business_website: websiteUrl,
      industry: industry,
      city: city,
      state: state,
      business_description: businessDescription,
      is_primary: isPrimary,
      is_active: true,
      is_complete: isComplete,
      google_business_profile: googleBusiness || null, // ✅ NEW: Save GBP data
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existingPrimary) {
      // Update existing primary business
      result = await supabase
        .from('business_profiles')
        .update(businessData)
        .eq('id', existingPrimary.id)
        .select()
        .single();
    } else {
      // Insert new primary business
      result = await supabase
        .from('business_profiles')
        .insert(businessData)
        .select()
        .single();
    }

    if (result.error) {
      console.error('Supabase upsert/insert error:', result.error);
      return res.status(500).json({
        error: 'Database operation failed',
        message: `Failed to save business profile: ${result.error.message} (Code: ${result.error.code})`,
      });
    }

    return res.status(200).json({ businessProfile: result.data });
  } catch (error: any) {
    console.error('Update business profile error:', error);
    return res.status(500).json({
      error: 'Failed to update business profile',
      message: error.message,
    });
  }
}
