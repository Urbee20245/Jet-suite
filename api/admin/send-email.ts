import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const ADMIN_EMAIL = 'theivsightcompany@gmail.com';
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin user
  const userEmail = req.headers['x-user-email'] as string;
  if (userEmail !== ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if Resend API key is configured
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return res.status(400).json({ error: 'RESEND_API_KEY environment variable is not configured' });
  }

  try {
    const { to, subject, body, fromName, fromEmail } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }

    // Get email settings for defaults
    const { data: settings } = await supabase
      .from('email_settings')
      .select('from_email, from_name, default_signature')
      .single();

    const senderEmail = fromEmail || settings?.from_email || 'noreply@getjetsuite.com';
    const senderName = fromName || settings?.from_name || 'JetSuite';
    const signature = settings?.default_signature || '';

    // Initialize Resend
    const resend = new Resend(resendApiKey);

    // Send email
    const { data, error } = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: `${body}${signature ? `<br><br>${signature}` : ''}`
    });

    if (error) {
      // Log failed email
      await supabase.from('email_logs').insert({
        recipient_email: Array.isArray(to) ? to.join(', ') : to,
        subject,
        body,
        status: 'failed',
        error_message: error.message
      });

      return res.status(500).json({ error: error.message });
    }

    // Log successful email
    await supabase.from('email_logs').insert({
      recipient_email: Array.isArray(to) ? to.join(', ') : to,
      subject,
      body,
      status: 'sent'
    });

    return res.status(200).json({ success: true, messageId: data?.id });
  } catch (error: any) {
    console.error('Send email error:', error);

    // Log error
    await supabase.from('email_logs').insert({
      recipient_email: req.body.to || 'unknown',
      subject: req.body.subject || 'unknown',
      body: req.body.body || '',
      status: 'failed',
      error_message: error.message
    });

    return res.status(500).json({ error: error.message });
  }
}
