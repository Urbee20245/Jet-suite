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
    console.error('Missing Supabase credentials');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { userId, businessId, reportType, reportData } = req.body;

    if (!userId || !businessId || !reportType || !reportData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['jetbiz', 'jetviz'].includes(reportType)) {
      return res.status(400).json({ error: 'Invalid report type' });
    }

    // Check if report exists
    const { data: existing } = await supabase
      .from('audit_reports')
      .select('id')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .eq('report_type', reportType)
      .maybeSingle();

    if (existing) {
      // Update existing report
      const { error } = await supabase
        .from('audit_reports')
        .update({
          report_data: reportData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating report:', error);
        return res.status(500).json({ error: 'Failed to update report' });
      }
    } else {
      // Insert new report
      const { error } = await supabase
        .from('audit_reports')
        .insert({
          user_id: userId,
          business_id: businessId,
          report_type: reportType,
          report_data: reportData,
        });

      if (error) {
        console.error('Error inserting report:', error);
        return res.status(500).json({ error: 'Failed to save report' });
      }
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Save report error:', error);
    return res.status(500).json({ error: error.message });
  }
}
