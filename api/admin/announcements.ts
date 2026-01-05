import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'theivsightcompany@gmail.com';
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify admin user
  const userEmail = req.headers['x-user-email'] as string;
  if (userEmail !== ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      // Fetch all announcements
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      // Create new announcement
      const { title, message, type, target_audience, priority, end_date } = req.body;

      if (!title || !message) {
        return res.status(400).json({ error: 'Title and message are required' });
      }

      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title,
          message,
          type: type || 'info',
          target_audience: target_audience || 'all',
          priority: priority || 1,
          end_date: end_date || null,
          created_by: userEmail,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      // Update announcement
      const { id, title, message, type, target_audience, priority, end_date, is_active } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Announcement ID is required' });
      }

      const { data, error } = await supabase
        .from('announcements')
        .update({
          title,
          message,
          type,
          target_audience,
          priority,
          end_date,
          is_active
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      // Delete announcement
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Announcement ID is required' });
      }

      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Announcements API error:', error);
    return res.status(500).json({ error: error.message });
  }
}