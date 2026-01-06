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
    const { businessId, dna, brandDnaProfile } = req.body;

    if (!businessId || !dna) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update business profile with DNA data
    const { error } = await supabase
      .from('business_profiles')
      .update({
        dna: dna,
        brand_dna_profile: brandDnaProfile || null,
        is_dna_approved: true,
        dna_last_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId);

    if (error) {
      console.error('Error saving DNA:', error);
      return res.status(500).json({ error: 'Failed to save DNA data' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Save DNA error:', error);
    return res.status(500).json({ error: error.message });
  }
}
