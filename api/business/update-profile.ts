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

    // CRITICAL: Fetch existing profile FIRST with ALL fields
    let query = supabase
      .from('business_profiles')
      .select('*')
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

    // Add regular fields only if provided
    if (businessName !== undefined) updatePayload.business_name = businessName;
    if (websiteUrl !== undefined) updatePayload.business_website = websiteUrl;
    if (industry !== undefined) updatePayload.industry = industry;
    if (city !== undefined) updatePayload.city = city;
    if (state !== undefined) updatePayload.state = state;
    if (isPrimary !== undefined) updatePayload.is_primary = isPrimary;
    if (isComplete !== undefined) updatePayload.is_complete = isComplete;
    if (businessDescription !== undefined) updatePayload.business_description = businessDescription;
    if (googleBusiness !== undefined) updatePayload.google_business_profile = googleBusiness;
    
    // CRITICAL DNA PRESERVATION LOGIC
    // Only update DNA if new data provided AND has actual content
    // Otherwise ALWAYS preserve existing DNA from database
    
    if (dna && Object.keys(dna).length > 0 && (dna.logo || dna.colors?.length > 0 || dna.fonts)) {
      updatePayload.dna = dna;
      console.log('✅ [API] Updating with NEW DNA data');
    } else if (existingProfile?.dna) {
      updatePayload.dna = existingProfile.dna;
      console.log('✅ [API] PRESERVING existing DNA from database');
    }
    
    if (brandDnaProfile && Object.keys(brandDnaProfile).length > 0) {
      updatePayload.brand_dna_profile = brandDnaProfile;
      console.log('✅ [API] Updating with NEW brand profile');
    } else if (existingProfile?.brand_dna_profile) {
      updatePayload.brand_dna_profile = existingProfile.brand_dna_profile;
      console.log('✅ [API] PRESERVING existing brand profile from database');
    }
    
    // CRITICAL: ALWAYS preserve isDnaApproved unless explicitly set to false
    if (isDnaApproved !== undefined) {
      updatePayload.is_dna_approved = isDnaApproved;
      console.log('✅ [API] Setting is_dna_approved to:', isDnaApproved);
    } else if (existingProfile?.is_dna_approved !== undefined) {
      updatePayload.is_dna_approved = existingProfile.is_dna_approved;
      console.log('✅ [API] PRESERVING is_dna_approved:', existingProfile.is_dna_approved);
    }
    
    if (dnaLastUpdatedAt !== undefined) {
      updatePayload.dna_last_updated_at = dnaLastUpdatedAt;
    } else if (existingProfile?.dna_last_updated_at) {
      updatePayload.dna_last_updated_at = existingProfile.dna_last_updated_at;
    }

    console.log('✅ [API] Final update payload:', {
      hasDna: !!updatePayload.dna,
      hasBrandProfile: !!updatePayload.brand_dna_profile,
      isDnaApproved: updatePayload.is_dna_approved,
      businessName: updatePayload.business_name
    });

    let result;
    if (existingProfile) {
      result = await supabase
        .from('business_profiles')
        .update(updatePayload)
        .eq('id', existingProfile.id)
        .select()
        .single();
    } else {
      const insertPayload = {
        user_id: userId,
        ...updatePayload,
        business_name: businessName || 'New Business',
        business_website: websiteUrl || '',
        industry: industry || 'General',
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

    console.log('✅ [API] Profile saved successfully. Final database state:', {
      isDnaApproved: result.data.is_dna_approved,
      hasDna: !!result.data.dna,
      hasBrandProfile: !!result.data.brand_dna_profile
    });

    return res.status(200).json({ businessProfile: result.data });
  } catch (error: any) {
    console.error('Update business profile error:', error);
    return res.status(500).json({
      error: 'Failed to update business profile',
      message: error.message,
    });
  }
}