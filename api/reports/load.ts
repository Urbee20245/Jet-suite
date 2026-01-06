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
    const { userId, businessId, reportType } = req.query;

    if (!userId || !businessId || !reportType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (!['jetbiz', 'jetviz'].includes(reportType as string)) {
      return res.status(400).json({ error: 'Invalid report type' });
    }

    const { data: report, error } = await supabase
      .from('audit_reports')
      .select('report_data, updated_at')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .eq('report_type', reportType)
      .maybeSingle();

    if (error) {
      console.error('Error loading report:', error);
      return res.status(500).json({ error: 'Failed to load report' });
    }

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    return res.status(200).json({ 
      report: report.report_data,
      updatedAt: report.updated_at 
    });
  } catch (error: any) {
    console.error('Load report error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

---

## Upload Instructions

Create these folders and files in your repo:
```
api/
├── tasks/
│   ├── save.ts
│   └── load.ts
└── reports/
    ├── save.ts
    └── load.ts
