import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Webhook endpoint to receive inbound emails from Resend
 * Configure this webhook in your Resend dashboard for support@getjetsuite.com
 * Webhook URL: https://your-domain.com/api/webhooks/resend-inbound
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Initialize Supabase client with service role (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resend webhook payload structure
    const payload = req.body;
    console.log('Received inbound email webhook:', JSON.stringify(payload, null, 2));

    // Extract email data from Resend webhook payload
    // Resend sends: from, to, subject, html, text, headers, attachments, etc.
    const {
      from,
      to,
      subject,
      html,
      text,
    } = payload;

    // Parse from email (format: "Name <email@example.com>" or just "email@example.com")
    let fromEmail = from;
    let fromName = null;

    if (from && from.includes('<')) {
      const match = from.match(/^(.*?)\s*<(.+?)>$/);
      if (match) {
        fromName = match[1].trim();
        fromEmail = match[2].trim();
      }
    }

    // Extract to email (can be array or string)
    const toEmail = Array.isArray(to) ? to[0] : to;

    // Insert email into admin_inbox table
    const { data, error } = await supabase
      .from('admin_inbox')
      .insert({
        from_email: fromEmail,
        from_name: fromName,
        to_email: toEmail,
        subject: subject || '(No subject)',
        html_body: html,
        text_body: text,
        received_at: new Date().toISOString(),
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing email in admin inbox:', error);
      return res.status(500).json({ error: 'Failed to store email' });
    }

    console.log('Email stored successfully in admin inbox:', data.id);

    // Return success response to Resend
    return res.status(200).json({
      success: true,
      message: 'Email received and stored',
      id: data.id,
    });

  } catch (error) {
    console.error('Error processing inbound email webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
