import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Server-side client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    // Upsert business profile (insert or update based on user_id)
    const { data, error } = await supabase
      .from('business_profiles')
      .upsert(businessData, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase upsert error:', error);
      throw error;
    }

    return res.status(200).json({ businessProfile: data });
  } catch (error: any) {
    console.error('Update business profile error:', error);
    return res.status(500).json({
      error: 'Failed to update business profile',
      message: error.message,
    });
  }
}