import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { serviceId, image_url, is_ai_generated, ai_prompt, position } = req.body;

    if (!serviceId || !image_url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newImage = {
      service_id: serviceId,
      image_url,
      is_ai_generated: is_ai_generated || false,
      ai_prompt: ai_prompt || null,
      position: position || 0,
    };

    const { data, error } = await supabase
      .from('service_images')
      .insert([newImage])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({ image: data });
  } catch (error: any) {
    console.error('Save image error:', error);
    return res.status(500).json({
      error: 'Failed to save image',
      message: error.message,
    });
  }
}
