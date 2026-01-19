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
    const { userId, businessId, dataType, data, analysisName } = req.body;

    if (!userId || !dataType || data === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let result;

    switch (dataType) {
      case 'tasks':
        // Delete and reinsert tasks for this specific business
        await supabase.from('growth_plan_tasks').delete().eq('business_id', businessId);
        
        if (Array.isArray(data) && data.length > 0) {
          const tasksToInsert = data.map(task => ({
            user_id: userId,
            business_id: businessId,
            title: task.title,
            description: task.description || null,
            why_it_matters: task.whyItMatters || null,
            source_module: task.sourceModule || null,
            priority: task.priority || 'Medium',
            effort: task.effort || 'Low',
            status: task.status || 'to_do',
            completed_at: task.completionDate || null,
            created_at: task.createdAt || new Date().toISOString()
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

        const upsertData: any = { 
            report_data: data, 
            updated_at: new Date().toISOString(),
            analysis_name: analysisName || null
        };

        if (existing) {
          result = await supabase
            .from('audit_reports')
            .update(upsertData)
            .eq('id', existing.id);
        } else {
          result = await supabase
            .from('audit_reports')
            .insert({ 
                user_id: userId, 
                business_id: businessId, 
                report_type: dataType, 
                report_data: data,
                analysis_name: analysisName || null
            });
        }
        break;

      case 'keywords':
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
        result = await supabase
          .from('social_posts')
          .insert({ user_id: userId, business_id: businessId, post_data: data });
        break;

      case 'preferences':
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
      return res.status(500).json({ error: `Failed to save ${dataType}`, details: result.error.message });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Save error:', error);
    return res.status(500).json({ error: error.message });
  }
}