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
    const { userId, businessId, tasks } = req.body;

    if (!userId || !businessId || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Delete existing tasks for this business
    const { error: deleteError } = await supabase
      .from('growth_plan_tasks')
      .delete()
      .eq('business_id', businessId);

    if (deleteError) {
      console.error('Error deleting old tasks:', deleteError);
      return res.status(500).json({ error: 'Failed to delete old tasks' });
    }

    // Insert new tasks
    if (tasks.length > 0) {
      const tasksToInsert = tasks.map(task => ({
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

      const { error: insertError } = await supabase
        .from('growth_plan_tasks')
        .insert(tasksToInsert);

      if (insertError) {
        console.error('Error inserting tasks:', insertError);
        return res.status(500).json({ error: 'Failed to save tasks' });
      }
    }

    return res.status(200).json({ success: true, count: tasks.length });
  } catch (error: any) {
    console.error('Save tasks error:', error);
    return res.status(500).json({ error: error.message });
  }
}
