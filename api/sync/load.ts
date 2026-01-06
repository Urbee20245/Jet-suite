import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { userId, businessId, dataType } = req.query;

    if (!userId || !dataType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    let result;

    switch (dataType) {
      case 'tasks':
        const { data: tasks } = await supabase
          .from('growth_plan_tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('business_id', businessId)
          .order('created_at', { ascending: true });

        result = (tasks || []).map(task => ({
          id: task.task_id,
          title: task.title,
          description: task.description,
          sourceModule: task.source_module,
          priority: task.priority,
          status: task.status,
          completionDate: task.completion_date,
          createdAt: task.created_at,
        }));
        break;

      case 'jetbiz':
      case 'jetviz':
        const { data: report } = await supabase
          .from('audit_reports')
          .select('report_data')
          .eq('user_id', userId)
          .eq('business_id', businessId)
          .eq('report_type', dataType)
          .maybeSingle();

        result = report?.report_data || null;
        break;

      case 'keywords':
        const { data: keywords } = await supabase
          .from('saved_keywords')
          .select('*')
          .eq('business_id', businessId);

        result = (keywords || []).map(kw => ({
          keyword: kw.keyword,
          searchVolume: kw.search_volume,
          competition: kw.competition,
        }));
        break;

      case 'social_posts':
        const { data: posts } = await supabase
          .from('social_posts')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });

        result = posts || [];
        break;

      case 'content_drafts':
        const { data: drafts } = await supabase
          .from('content_drafts')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });

        result = drafts || [];
        break;

      case 'preferences':
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('preferences')
          .eq('user_id', userId)
          .maybeSingle();

        result = prefs?.preferences || {};
        break;

      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    return res.status(200).json({ data: result });
  } catch (error: any) {
    console.error('Load error:', error);
    return res.status(500).json({ error: error.message });
  }
}
