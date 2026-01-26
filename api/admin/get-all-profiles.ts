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
    console.log('[Admin Get All Profiles] Starting fetch for:', userEmail);
    
    // 1. Fetch ALL profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id, 
        email, 
        first_name, 
        last_name, 
        role,
        created_at,
        trial_end_date,
        phone
      `)
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('[Admin Get All Profiles] Profiles error:', profilesError);
      throw profilesError;
    }

    // 2. Fetch all billing accounts in one go for efficiency
    const { data: billingAccounts, error: billingError } = await supabase
        .from('billing_accounts')
        .select('*');
    
    if (billingError) {
        console.error('[Admin Get All Profiles] Billing error:', billingError);
        throw billingError;
    }
    const billingMap = new Map(billingAccounts.map(b => [b.user_id, b]));


    // 3. For each profile, fetch their businesses and map
    const mappedProfiles = await Promise.all(profiles.map(async (profile) => {
      // Fetch businesses for this user
      const { data: businesses, error: businessError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (businessError) {
        console.error(`[Admin Get All Profiles] Error fetching businesses for ${profile.email}:`, businessError);
      }

      const businessesArray = businesses || [];
      const primaryBusiness: any = businessesArray.find((b: any) => b.is_primary) || businessesArray[0] || {};
      
      const billing = billingMap.get(profile.id) || {}; // Get billing data

      return {
        user: {
          id: profile.id,
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          email: profile.email,
          phone: profile.phone || '',
          role: profile.role || 'Owner',
          created_at: profile.created_at,
        },
        billing: {
            subscription_status: billing.subscription_status || null,
            trial_end_date: profile.trial_end_date || null,
            stripe_customer_id: billing.stripe_customer_id || null,
            stripe_subscription_id: billing.stripe_subscription_id || null,
            business_count: billing.business_count || 0,
            seat_count: billing.seat_count || 0,
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
    }));

    console.log(`[Admin Get All Profiles] Successfully mapped ${mappedProfiles.length} profiles`);
    console.log(`[Admin Get All Profiles] Emails found:`, mappedProfiles.map(p => p.user.email));
    
    return res.status(200).json({ profiles: mappedProfiles });
    
  } catch (error: any) {
    console.error('[Admin Get All Profiles] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch profiles', message: error.message });
  }
}