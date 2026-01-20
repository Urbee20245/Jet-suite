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

    console.log(`[Sync Load] Loading ${dataType} for user ${userId}, business ${businessId}`);

    let result;

    switch (dataType) {
      case 'tasks':
        const { data: tasks, error: taskError } = await supabase
          .from('growth_plan_tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('business_id', businessId)
          .order('created_at', { ascending: true });

        if (taskError) throw taskError;

        // Map database columns (snake_case) back to frontend type (camelCase)
        result = (tasks || []).map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          whyItMatters: task.why_it_matters,
          sourceModule: task.source_module,
          effort: task.effort,
          priority: task.priority,
          status: task.status,
          createdAt: task.created_at,
          completionDate: task.completed_at,
        }));
        console.log(`[Sync Load] Successfully loaded ${result.length} tasks.`);
        break;

      case 'jetbiz':
      case 'jetviz':
        const { data: reports, error: reportError } = await supabase
          .from('audit_reports')
          .select('id, report_data, analysis_name, created_at, updated_at')
          .eq('user_id', userId)
          .eq('business_id', businessId)
          .eq('report_type', dataType)
          .order('created_at', { ascending: false });

        if (reportError) throw reportError;

        result = (reports || []).map(report => ({
            id: report.id,
            created_at: report.created_at,
            updated_at: report.updated_at,
            analysis_name: report.analysis_name,
            results: report.report_data,
        }));
        break;

      case 'keywords':
        const { data: keywords, error: kwError } = await supabase
          .from('saved_keywords')
          .select('*')
          .eq('business_id', businessId);

        if (kwError) throw kwError;

        result = (keywords || []).map(kw => ({
          keyword: kw.keyword,
          searchVolume: kw.search_volume,
          competition: kw.competition,
        }));
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
    console.error('[Sync Load] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}