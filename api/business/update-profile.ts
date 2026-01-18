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
      businessId, // Added businessId for explicit update targeting
      businessName,
      websiteUrl,
      industry,
      city,
      state,
      isPrimary,
      isComplete,
      businessDescription,
      googleBusiness,
      // CRITICAL: Accept and preserve DNA fields
      dna,
      brandDnaProfile,
      isDnaApproved,
      dnaLastUpdatedAt,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing required field: userId'
      });
    }

    // 1. Dynamically build a partial update payload
    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    // Conditionally add fields to the update object only if they are provided
    if (businessName !== undefined) updatePayload.business_name = businessName;
    if (websiteUrl !== undefined) updatePayload.business_website = websiteUrl;
    if (industry !== undefined) updatePayload.industry = industry;
    if (city !== undefined) updatePayload.city = city;
    if (state !== undefined) updatePayload.state = state;
    if (isPrimary !== undefined) updatePayload.is_primary = isPrimary;
    if (isComplete !== undefined) updatePayload.is_complete = isComplete;
    if (businessDescription !== undefined) updatePayload.business_description = businessDescription;
    if (googleBusiness !== undefined) updatePayload.google_business_profile = googleBusiness;
    
    // CRITICAL FIX: Preserve DNA fields if they are passed in the request
    if (dna !== undefined) updatePayload.dna = dna;
    if (brandDnaProfile !== undefined) updatePayload.brand_dna_profile = brandDnaProfile;
    if (isDnaApproved !== undefined) updatePayload.is_dna_approved = isDnaApproved;
    if (dnaLastUpdatedAt !== undefined) updatePayload.dna_last_updated_at = dnaLastUpdatedAt;

    console.log('✅ [API] Performing partial update with payload keys:', Object.keys(updatePayload));

    // 2. Find the primary business profile to update (or use businessId if provided)
    let query = supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId);
      
    if (businessId) {
        query = query.eq('id', businessId);
    } else {
        query = query.eq('is_primary', true);
    }

    const { data: existingPrimary, error: fetchError } = await query.maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    let result;
    if (existingPrimary) {
      // Update the existing business profile
      result = await supabase
        .from('business_profiles')
        .update(updatePayload)
        .eq('id', existingPrimary.id)
        .select()
        .single();
    } else {
      // If no profile exists, create one (onboarding case)
      const insertPayload = {
        user_id: userId,
        ...updatePayload,
        business_name: businessName,
        business_website: websiteUrl,
        industry: industry,
        is_primary: isPrimary ?? true,
        is_complete: isComplete ?? false,
      };
      result = await supabase
        .from('business_profiles')
        .insert(insertPayload)
        .select()
        .single();
    }

    if (result.error) {
      console.error('Supabase update/insert error:', result.error);
      return res.status(500).json({
        error: 'Database operation failed',
        message: `Failed to save business profile: ${result.error.message}`,
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