import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'theivsightcompany@gmail.com';
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userEmail = req.headers['x-user-email'] as string;

  // 1. Admin Verification
  if (userEmail !== ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Unauthorized: Admin access required' });
  }

  try {
    // Fetch all profiles and join with their primary business profile (if exists)
    // The 'profiles' table is the source of truth for all users who have logged in once.
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id, 
        email, 
        first_name, 
        last_name, 
        role,
        businesses:business_profiles!user_id (
          id, 
          business_name, 
          industry, 
          city, 
          state,
          is_primary,
          is_complete,
          dna,
          brand_dna_profile,
          google_business_profile,
          dna_last_updated_at
        )
      `)
      .order('created_at', { ascending: false });

    if (profilesError) {
        console.error('[Admin Get All Profiles] Supabase Query Error:', profilesError);
        throw profilesError;
    }

    // Map and flatten the data for the frontend
    const mappedProfiles = profiles.map(profile => {
      // Find the primary business or use the first one found
      const primaryBusiness: any = profile.businesses.find((b: any) => b.is_primary) || profile.businesses[0] || {};
      
      const userProfile = {
        id: profile.id,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email,
        phone: '', 
        role: profile.role || 'Owner',
      };

      const businessProfile = {
        id: primaryBusiness.id || 'no-business',
        user_id: profile.id,
        business_name: primaryBusiness.business_name || 'No Business Profile',
        industry: primaryBusiness.industry || '',
        city: primaryBusiness.city || '',
        state: primaryBusiness.state || '',
        location: `${primaryBusiness.city || ''}, ${primaryBusiness.state || ''}`.trim(),
        isDnaApproved: !!primaryBusiness.brand_dna_profile,
        dna: primaryBusiness.dna || { logo: '', colors: [], fonts: '', style: '' },
        brandDnaProfile: primaryBusiness.brand_dna_profile || null,
        googleBusiness: primaryBusiness.google_business_profile || null,
        // Default/placeholder values for required fields not fetched here
        business_website: primaryBusiness.business_website || '',
        business_description: primaryBusiness.business_description || '',
        service_area: primaryBusiness.service_area || '',
        phone: primaryBusiness.phone || '',
        email: primaryBusiness.email || '',
        is_primary: !!primaryBusiness.id,
        is_complete: primaryBusiness.is_complete || false,
        created_at: primaryBusiness.created_at || new Date().toISOString(),
        updated_at: primaryBusiness.updated_at || new Date().toISOString(),
        google_business_profile: primaryBusiness.google_business_profile || null,
        is_dna_approved: !!primaryBusiness.brand_dna_profile,
        dna_last_updated_at: primaryBusiness.dna_last_updated_at || undefined,
      };

      return {
        user: userProfile,
        business: businessProfile,
        googleBusiness: businessProfile.google_business_profile || { profileName: '', mapsUrl: '', status: 'Not Created' },
        isProfileActive: businessProfile.is_complete,
        brandDnaProfile: businessProfile.brand_dna_profile,
      };
    });

    console.log(`[Admin Get All Profiles] Successfully fetched ${mappedProfiles.length} profiles.`);
    return res.status(200).json({ profiles: mappedProfiles });
  } catch (error: any) {
    console.error('[Admin Get All Profiles] General Error:', error);
    return res.status(500).json({ error: 'Failed to fetch all user profiles', message: error.message });
  }
}