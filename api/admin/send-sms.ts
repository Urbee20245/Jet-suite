import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

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

  // Check if Twilio credentials are configured
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return res.status(400).json({
      error: 'Twilio environment variables are not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.'
    });
  }

  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: 'Missing required fields: to, message' });
    }

    // Check if SMS is enabled
    const { data: settings } = await supabase
      .from('sms_settings')
      .select('sms_enabled')
      .single();

    if (settings && !settings.sms_enabled) {
      return res.status(400).json({ error: 'SMS is currently disabled in settings' });
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Format phone number (ensure it has country code)
    let formattedTo = to.trim();
    if (!formattedTo.startsWith('+')) {
      formattedTo = '+1' + formattedTo.replace(/\D/g, '');
    }

    // Send SMS
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: formattedTo
    });

    // Log successful SMS
    await supabase.from('sms_logs').insert({
      recipient_phone: formattedTo,
      message,
      status: 'sent'
    });

    return res.status(200).json({ success: true, messageSid: result.sid });
  } catch (error: any) {
    console.error('Send SMS error:', error);

    // Log error
    await supabase.from('sms_logs').insert({
      recipient_phone: req.body.to || 'unknown',
      message: req.body.message || '',
      status: 'failed',
      error_message: error.message
    });

    return res.status(500).json({ error: error.message });
  }
}
