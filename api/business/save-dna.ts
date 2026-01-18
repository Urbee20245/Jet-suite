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
    console.error('Missing Supabase environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { businessId, dna, brandDnaProfile } = req.body;

    if (!businessId || !dna || !brandDnaProfile) {
      return res.status(400).json({ error: 'Missing required fields: businessId, dna, brandDnaProfile' });
    }

    // Update business_profiles with DNA data
    const { data, error } = await supabase
      .from('business_profiles')
      .update({
        dna: dna, // Visual DNA (logo, colors, fonts)
        brand_dna_profile: brandDnaProfile, // Detailed brand profile
        is_dna_approved: true,
        dna_last_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)
      .select()
      .single();

    if (error) {
      console.error('Supabase DNA save error:', error);
      return res.status(500).json({ 
        error: 'Failed to save DNA', 
        message: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'DNA saved successfully',
      data 
    });

  } catch (error: any) {
    console.error('DNA save error:', error);
    return res.status(500).json({ 
      error: 'Failed to save DNA', 
      message: error.message 
    });
  }
}