import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const settings = req.body;

    // Check if settings exist
    const { data: existing } = await supabase
      .from('sms_settings')
      .select('id')
      .maybeSingle();

    let result;
    if (existing) {
      // Update existing settings
      result = await supabase
        .from('sms_settings')
        .update(settings)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Insert new settings
      result = await supabase
        .from('sms_settings')
        .insert([settings])
        .select()
        .single();
    }

    if (result.error) {
      return res.status(500).json({ error: result.error.message });
    }

    return res.status(200).json({ success: true, data: result.data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}