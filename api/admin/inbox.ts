import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { AdminInboxMessage, AdminInboxListResponse, AdminInboxDeleteResponse } from '../../Types/emailTypes';

const ADMIN_EMAIL = 'theivsightcompany@gmail.com';

/**
 * Admin API endpoint for managing inbox
 * GET: List all emails
 * DELETE: Delete an email by ID
 * PATCH: Mark email as read/unread
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Check admin authorization
  const userEmail = req.headers['x-user-email'] as string;
  if (userEmail !== ADMIN_EMAIL) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // GET: List all emails
    if (req.method === 'GET') {
      const { data, error, count } = await supabase
        .from('admin_inbox')
        .select('*', { count: 'exact' })
        .order('received_at', { ascending: false });

      if (error) {
        console.error('Error fetching inbox messages:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch messages' });
      }

      const response: AdminInboxListResponse = {
        success: true,
        messages: data as AdminInboxMessage[],
        total: count || 0,
      };

      return res.status(200).json(response);
    }

    // DELETE: Delete an email by ID
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, error: 'Email ID is required' });
      }

      const { error } = await supabase
        .from('admin_inbox')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting email:', error);
        return res.status(500).json({ success: false, error: 'Failed to delete email' });
      }

      const response: AdminInboxDeleteResponse = {
        success: true,
        message: 'Email deleted successfully',
      };

      return res.status(200).json(response);
    }

    // PATCH: Mark email as read/unread
    if (req.method === 'PATCH') {
      const { id, read } = req.body;

      if (!id || typeof read !== 'boolean') {
        return res.status(400).json({ success: false, error: 'Email ID and read status are required' });
      }

      const { error } = await supabase
        .from('admin_inbox')
        .update({ read })
        .eq('id', id);

      if (error) {
        console.error('Error updating email read status:', error);
        return res.status(500).json({ success: false, error: 'Failed to update email' });
      }

      return res.status(200).json({ success: true, message: 'Email updated successfully' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('Error in inbox API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
