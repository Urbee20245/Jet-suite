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
    const {
      userId,
      businessId,
      title,
      description,
      category,
      price,
      price_type,
      duration,
      is_active,
      tags,
    } = req.body;

    if (!userId || !businessId || !title) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newService = {
      user_id: userId,
      business_id: businessId,
      title,
      description: description || null,
      category: category || null,
      price: price || null,
      price_type: price_type || null,
      duration: duration || null,
      is_active: is_active !== undefined ? is_active : true,
      tags: tags || [],
    };

    const { data, error } = await supabase
      .from('service_listings')
      .insert([newService])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({ service: data });
  } catch (error: any) {
    console.error('Create service error:', error);
    return res.status(500).json({
      error: 'Failed to create service',
      message: error.message,
    });
  }
}
