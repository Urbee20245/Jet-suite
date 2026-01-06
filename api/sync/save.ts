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
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { userId, businessId, dataType, data } = req.body;

    if (!userId || !dataType || data === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let result;

    switch (dataType) {
      case 'tasks':
        // Delete and reinsert tasks
        await supabase.from('growth_plan_tasks').delete().eq('business_id', businessId);
        if (Array.isArray(data) && data.length > 0) {
          const tasksToInsert = data.map(task => ({
            user_id: userId,
            business_id: businessId,
            task_id: task.id,
            title: task.title,
            description: task.description || null,
            source_module: task.sourceModule,
            priority: task.priority || null,
            status: task.status || 'to_do',
            completion_date: task.completionDate || null,
          }));
          result = await supabase.from('growth_plan_tasks').insert(tasksToInsert);
        }
        break;

      case 'jetbiz':
      case 'jetviz':
        // Upsert report
        const { data: existing } = await supabase
          .from('audit_reports')
          .select('id')
          .eq('user_id', userId)
          .eq('business_id', businessId)
          .eq('report_type', dataType)
          .maybeSingle();

        if (existing) {
          result = await supabase
            .from('audit_reports')
            .update({ report_data: data, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          result = await supabase
            .from('audit_reports')
            .insert({ user_id: userId, business_id: businessId, report_type: dataType, report_data: data });
        }
        break;

      case 'keywords':
        // Delete and reinsert keywords
        await supabase.from('saved_keywords').delete().eq('business_id', businessId);
        if (Array.isArray(data) && data.length > 0) {
          const keywordsToInsert = data.map(kw => ({
            user_id: userId,
            business_id: businessId,
            keyword: kw.keyword || kw,
            search_volume: kw.searchVolume || null,
            competition: kw.competition || null,
          }));
          result = await supabase.from('saved_keywords').insert(keywordsToInsert);
        }
        break;

      case 'social_posts':
        // Save social posts
        result = await supabase
          .from('social_posts')
          .insert({ user_id: userId, business_id: businessId, post_data: data });
        break;

      case 'content_draft':
        // Save content draft
        result = await supabase
          .from('content_drafts')
          .insert({ user_id: userId, business_id: businessId, content_type: data.type || 'general', content_data: data });
        break;

      case 'preferences':
        // Upsert user preferences
        const { data: existingPref } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existingPref) {
          result = await supabase
            .from('user_preferences')
            .update({ preferences: data, updated_at: new Date().toISOString() })
            .eq('user_id', userId);
        } else {
          result = await supabase
            .from('user_preferences')
            .insert({ user_id: userId, preferences: data });
        }
        break;

      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    if (result?.error) {
      console.error(`Error saving ${dataType}:`, result.error);
      return res.status(500).json({ error: `Failed to save ${dataType}` });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Save error:', error);
    return res.status(500).json({ error: error.message });
  }
}
