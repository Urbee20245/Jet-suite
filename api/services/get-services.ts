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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, businessId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid userId' });
    }

    if (!businessId || typeof businessId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid businessId' });
    }

    const { data: services, error } = await supabase
      .from('service_listings')
      .select('*')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Fetch related images for each service
    const serviceIds = (services || []).map((s: any) => s.id);

    let images: any[] = [];
    if (serviceIds.length > 0) {
      const { data: imageData, error: imageError } = await supabase
        .from('service_images')
        .select('*')
        .in('service_id', serviceIds);

      if (imageError) {
        throw imageError;
      }

      images = imageData || [];
    }

    // Attach images to their respective services
    const servicesWithImages = (services || []).map((service: any) => ({
      ...service,
      images: images.filter((img: any) => img.service_id === service.id),
    }));

    return res.status(200).json({ services: servicesWithImages });
  } catch (error: any) {
    console.error('Get services error:', error);
    return res.status(500).json({
      error: 'Failed to get services',
      message: error.message,
    });
  }
}
