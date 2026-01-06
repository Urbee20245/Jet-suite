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
    console.error('Missing Supabase credentials');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { userId, businessId } = req.query;

    if (!userId || !businessId) {
      return res.status(400).json({ error: 'Missing userId or businessId' });
    }

    const { data: tasks, error } = await supabase
      .from('growth_plan_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading tasks:', error);
      return res.status(500).json({ error: 'Failed to load tasks' });
    }

    // Transform database format to app format
    const transformedTasks = (tasks || []).map(task => ({
      id: task.task_id,
      title: task.title,
      description: task.description,
      sourceModule: task.source_module,
      priority: task.priority,
      status: task.status,
      completionDate: task.completion_date,
      createdAt: task.created_at,
    }));

    return res.status(200).json({ tasks: transformedTasks });
  } catch (error: any) {
    console.error('Load tasks error:', error);
    return res.status(500).json({ error: error.message });
  }
}
