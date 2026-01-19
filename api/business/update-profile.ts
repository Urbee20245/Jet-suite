import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId' });
    }

    // Prepare update payload
    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (businessName !== undefined) updatePayload.business_name = businessName;
    if (websiteUrl !== undefined) updatePayload.business_website = websiteUrl;
    if (industry !== undefined) updatePayload.industry = industry;
    if (city !== undefined) updatePayload.city = city;
    if (state !== undefined) updatePayload.state = state;
    if (isPrimary !== undefined) updatePayload.is_primary = isPrimary;
    if (isComplete !== undefined) updatePayload.is_complete = isComplete;
    if (businessDescription !== undefined) updatePayload.business_description = businessDescription;
    if (googleBusiness !== undefined) updatePayload.google_business_profile = googleBusiness;

    let result;
    if (businessId) {
      result = await supabase
        .from('business_profiles')
        .update(updatePayload)
        .eq('id', businessId)
        .select()
        .single();
    } else {
      result = await supabase
        .from('business_profiles')
        .update(updatePayload)
        .eq('user_id', userId)
        .eq('is_primary', true)
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    return res.status(200).json({ businessProfile: result.data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}