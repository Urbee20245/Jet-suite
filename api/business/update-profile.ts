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
      businessId,
      businessName,
      websiteUrl,
      industry,
      city,
      state,
      isPrimary,
      isComplete,
      businessDescription,
      googleBusiness,
      // DNA fields from request
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

    // CRITICAL FIX: Get existing business data FIRST to preserve DNA
    let query = supabase
      .from('business_profiles')
      .select('*') // Select ALL fields to get existing DNA
      .eq('user_id', userId);
      
    if (businessId) {
        query = query.eq('id', businessId);
    } else {
        query = query.eq('is_primary', true);
    }

    const { data: existingProfile, error: fetchError } = await query.maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // Build update payload
    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    // Add regular fields
    if (businessName !== undefined) updatePayload.business_name = businessName;
    if (websiteUrl !== undefined) updatePayload.business_website = websiteUrl;
    if (industry !== undefined) updatePayload.industry = industry;
    if (city !== undefined) updatePayload.city = city;
    if (state !== undefined) updatePayload.state = state;
    if (isPrimary !== undefined) updatePayload.is_primary = isPrimary;
    if (isComplete !== undefined) updatePayload.is_complete = isComplete;
    if (businessDescription !== undefined) updatePayload.business_description = businessDescription;
    if (googleBusiness !== undefined) updatePayload.google_business_profile = googleBusiness;
    
    // CRITICAL FIX: Only update DNA fields if they have actual data
    // Otherwise, preserve existing DNA from database
    if (dna && Object.keys(dna).length > 0) {
      updatePayload.dna = dna;
      console.log('✅ [API] Updating DNA with new data');
    } else if (existingProfile?.dna) {
      updatePayload.dna = existingProfile.dna;
      console.log('✅ [API] Preserving existing DNA from database');
    }
    
    if (brandDnaProfile && Object.keys(brandDnaProfile).length > 0) {
      updatePayload.brand_dna_profile = brandDnaProfile;
      console.log('✅ [API] Updating brand DNA profile with new data');
    } else if (existingProfile?.brand_dna_profile) {
      updatePayload.brand_dna_profile = existingProfile.brand_dna_profile;
      console.log('✅ [API] Preserving existing brand DNA profile from database');
    }
    
    if (isDnaApproved !== undefined) {
      updatePayload.is_dna_approved = isDnaApproved;
    } else if (existingProfile?.is_dna_approved !== undefined) {
      updatePayload.is_dna_approved = existingProfile.is_dna_approved;
    }
    
    if (dnaLastUpdatedAt !== undefined) {
      updatePayload.dna_last_updated_at = dnaLastUpdatedAt;
    } else if (existingProfile?.dna_last_updated_at) {
      updatePayload.dna_last_updated_at = existingProfile.dna_last_updated_at;
    }

    console.log('✅ [API] Update payload keys:', Object.keys(updatePayload));
    console.log('✅ [API] DNA fields:', {
      hasDna: !!updatePayload.dna,
      hasBrandProfile: !!updatePayload.brand_dna_profile,
      isDnaApproved: updatePayload.is_dna_approved
    });

    let result;
    if (existingProfile) {
      // Update the existing business profile
      result = await supabase
        .from('business_profiles')
        .update(updatePayload)
        .eq('id', existingProfile.id)
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

    console.log('✅ [API] Profile updated successfully with DNA preserved');
    return res.status(200).json({ businessProfile: result.data });
  } catch (error: any) {
    console.error('Update business profile error:', error);
    return res.status(500).json({
      error: 'Failed to update business profile',
      message: error.message,
    });
  }
}