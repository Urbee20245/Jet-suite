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

  if (userEmail !== ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Unauthorized: Admin access required' });
  }

  try {
    // 1. Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id, 
        email, 
        first_name, 
        last_name, 
        role,
        businesses:business_profiles (
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

    if (profilesError) throw profilesError;

    // 2. Map profiles to the format expected by the frontend
    const mappedProfiles = profiles.map(profile => {
      // Find primary or first business
      const businessesArray = Array.isArray(profile.businesses) ? profile.businesses : [];
      const primaryBusiness: any = businessesArray.find((b: any) => b.is_primary) || businessesArray[0] || {};
      
      return {
        user: {
          id: profile.id,
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          email: profile.email,
          phone: '', 
          role: profile.role || 'Owner',
        },
        business: {
          id: primaryBusiness.id || 'no-business',
          user_id: profile.id,
          business_name: primaryBusiness.business_name || 'No Business Profile',
          industry: primaryBusiness.industry || '',
          city: primaryBusiness.city || '',
          state: primaryBusiness.state || '',
          location: primaryBusiness.city ? `${primaryBusiness.city}, ${primaryBusiness.state}` : '',
          isDnaApproved: !!primaryBusiness.brand_dna_profile,
          dna: primaryBusiness.dna || { logo: '', colors: [], fonts: '', style: '' },
          brandDnaProfile: primaryBusiness.brand_dna_profile || null,
          googleBusiness: primaryBusiness.google_business_profile || null,
          is_primary: !!primaryBusiness.is_primary,
          is_complete: !!primaryBusiness.is_complete,
          created_at: primaryBusiness.created_at || null,
          updated_at: primaryBusiness.updated_at || null,
        },
        googleBusiness: primaryBusiness.google_business_profile || { profileName: '', mapsUrl: '', status: 'Not Created' },
        isProfileActive: !!primaryBusiness.is_complete,
        brandDnaProfile: primaryBusiness.brand_dna_profile || undefined,
      };
    });

    return res.status(200).json({ profiles: mappedProfiles });
  } catch (error: any) {
    console.error('[Admin Get All Profiles] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch profiles', message: error.message });
  }
}