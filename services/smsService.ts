// =====================================================
// JETSUITE SMS SERVICE - TWILIO INTEGRATION
// Handles all SMS sending via Twilio API
// =====================================================

import type { 
  SendSMSRequest, 
  SMSSettings,
  ApiResponse 
} from '../Types/emailTypes';
import { getSupabaseClient } from '../integrations/supabase/client';

class SMSService {
  private smsSettings: SMSSettings | null = null;

  /**
   * Initialize the SMS service by loading settings from database
   */
  async initialize(): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sms_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading SMS settings:', error);
        return;
      }

      this.smsSettings = data as SMSSettings;
    } catch (error) {
      console.error('Error initializing SMS service:', error);
    }
  }

  /**
   * Send a single SMS using Twilio API
   */
  async sendSMS(request: SendSMSRequest): Promise<ApiResponse<any>> {
    // Initialize if not already done
    if (!this.smsSettings) {
      await this.initialize();
    }

    if (!this.smsSettings || !this.smsSettings.sms_enabled) {
      return {
        success: false,
        error: 'SMS service not configured or disabled'
      };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Database service unavailable' };
    }

    try {
      const recipients = Array.isArray(request.to_phone) ? request.to_phone : [request.to_phone];

      // Twilio API credentials (base64 encoded)
      const credentials = btoa(`${this.smsSettings.twilio_account_sid}:${this.smsSettings.twilio_auth_token}`);

      // Send SMS via Twilio API
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.smsSettings.twilio_account_sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: this.smsSettings.twilio_phone_number,
            To: recipients[0],
            Body: request.message,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // Log failed SMS
        await supabase.from('sms_logs').insert({
          to_phone: recipients[0],
          from_phone: this.smsSettings.twilio_phone_number,
          message: request.message,
          user_id: request.user_id,
          ticket_id: request.ticket_id,
          status: 'failed',
          error_message: result.message || 'Unknown error',
          created_at: new Date().toISOString(),
        });

        return {
          success: false,
          error: result.message || 'Failed to send SMS'
        };
      }

      // Log successful SMS
      await supabase.from('sms_logs').insert({
        to_phone: recipients[0],
        from_phone: this.smsSettings.twilio_phone_number,
        message: request.message,
        user_id: request.user_id,
        ticket_id: request.ticket_id,
        status: result.status === 'queued' ? 'queued' : 'sent',
        provider_message_id: result.sid,
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        });

      return {
        success: true,
        data: result,
        message: 'SMS sent successfully'
      };
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS'
      };
    }
  }

  /**
   * Send SMS notification for urgent support ticket
   */
  async sendUrgentTicketSMS(
    ticketId: string,
    userPhone: string,
    ticketSubject: string
  ): Promise<ApiResponse<any>> {
    if (!this.smsSettings?.urgent_tickets_sms) {
      return { success: false, error: 'Urgent ticket SMS notifications disabled' };
    }

    const message = `JetSuite Alert: Your urgent support ticket "${ticketSubject}" (ID: ${ticketId}) has been created. We're on it!`;

    return this.sendSMS({
      to_phone: userPhone,
      message,
      ticket_id: ticketId
    });
  }

  /**
   * Get SMS statistics
   */
  async getSMSStats(): Promise<ApiResponse<any>> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Database service unavailable' };
    }

    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Total stats
      const { data: totalData } = await supabase
        .from('sms_logs')
        .select('status', { count: 'exact' });

      const totalSent = totalData?.filter(log => log.status === 'sent' || log.status === 'delivered').length || 0;
      const totalDelivered = totalData?.filter(log => log.status === 'delivered').length || 0;
      const totalFailed = totalData?.filter(log => log.status === 'failed').length || 0;

      // Today's stats
      const { data: todayData } = await supabase
        .from('sms_logs')
        .select('status')
        .gte('created_at', today.toISOString());

      const todaySent = todayData?.filter(log => log.status === 'sent' || log.status === 'delivered').length || 0;

      // Week stats
      const { data: weekData } = await supabase
        .from('sms_logs')
        .select('status')
        .gte('created_at', weekAgo.toISOString());

      const weekSent = weekData?.filter(log => log.status === 'sent' || log.status === 'delivered').length || 0;

      // Month stats
      const { data: monthData } = await supabase
        .from('sms_logs')
        .select('status')
        .gte('created_at', monthAgo.toISOString());

      const monthSent = monthData?.filter(log => log.status === 'sent' || log.status === 'delivered').length || 0;

      return {
        success: true,
        data: {
          total_sent: totalSent,
          total_delivered: totalDelivered,
          total_failed: totalFailed,
          today_sent: todaySent,
          this_week_sent: weekSent,
          this_month_sent: monthSent,
          delivery_rate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get SMS stats'
      };
    }
  }
}

// Export singleton instance
export const smsService = new SMSService();
export default smsService;