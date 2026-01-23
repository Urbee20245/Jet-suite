// =====================================================
// JETSUITE EMAIL SERVICE - RESEND INTEGRATION
// Handles all email sending via Resend API
// =====================================================

import type { 
  SendEmailRequest, 
  EmailSettings,
  EmailTemplate,
  ApiResponse 
} from '../Types/emailTypes';
import { getSupabaseClient } from '../integrations/supabase/client';

class EmailService {
  private resendApiKey: string | null = null;
  private emailSettings: EmailSettings | null = null;

  /**
   * Initialize the email service by loading settings from database
   */
  async initialize(): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading email settings:', error);
        return;
      }

      this.emailSettings = data as EmailSettings;
      this.resendApiKey = data?.resend_api_key || null;
    } catch (error) {
      console.error('Error initializing email service:', error);
    }
  }

  /**
   * Send a single email using Resend API
   */
  async sendEmail(request: SendEmailRequest): Promise<ApiResponse<any>> {
    // Initialize if not already done
    if (!this.emailSettings) {
      await this.initialize();
    }

    if (!this.resendApiKey) {
      return {
        success: false,
        error: 'Email service not configured. Please set up Resend API key in settings.'
      };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Database service unavailable' };
    }

    try {
      // If template_id is provided, load template and apply variables
      let subject = request.subject;
      let bodyHtml = request.body_html;
      let bodyText = request.body_text;
      let templateId = request.template_id;

      if (templateId && request.template_variables) {
        const { data: template, error: templateError } = await supabase
          .from('email_templates')
          .select('*')
          .eq('id', templateId)
          .single();

        if (!templateError && template) {
          subject = this.replaceVariables(template.subject, request.template_variables);
          bodyHtml = this.replaceVariables(template.body_html, request.template_variables);
          bodyText = template.body_text ? this.replaceVariables(template.body_text, request.template_variables) : undefined;
        }
      }

      // Add signature if not present
      if (this.emailSettings!.default_signature && !bodyHtml.includes(this.emailSettings!.default_signature)) {
        bodyHtml += `<br><br>${this.emailSettings!.default_signature}`;
      }

      const recipients = Array.isArray(request.to_email) ? request.to_email : [request.to_email];

      // Send email via Resend API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${this.emailSettings!.from_name} <${this.emailSettings!.from_email}>`,
          to: recipients,
          reply_to: request.reply_to || this.emailSettings!.reply_to_email,
          subject: subject,
          html: bodyHtml,
          text: bodyText,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Log failed email
        await supabase.from('email_logs').insert({
          to_email: recipients[0],
          from_email: this.emailSettings!.from_email,
          subject: subject,
          body_html: bodyHtml,
          body_text: bodyText,
          template_id: templateId,
          user_id: request.user_id,
          ticket_id: request.ticket_id,
          status: 'failed',
          provider: 'resend',
          provider_message_id: result.id,
          error_message: result.message || 'Unknown error',
          created_at: new Date().toISOString(),
        });

        return {
          success: false,
          error: result.message || 'Failed to send email'
        };
      }

      // Log successful email
      await supabase.from('email_logs').insert({
        to_email: recipients[0],
        from_email: this.emailSettings!.from_email,
        subject: subject,
        body_html: bodyHtml,
        body_text: bodyText,
        template_id: templateId,
        user_id: request.user_id,
        ticket_id: request.ticket_id,
        status: 'sent',
        provider: 'resend',
        provider_message_id: result.id,
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      // Update template use count if template was used
      if (templateId) {
        await supabase.rpc('increment_template_use_count', {
          template_id_param: templateId
        });
      }

      return {
        success: true,
        data: result,
        message: 'Email sent successfully'
      };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email'
      };
    }
  }

  /**
   * Send broadcast email to multiple recipients
   */
  async sendBroadcastEmail(
    subject: string,
    bodyHtml: string,
    bodyText: string | undefined,
    recipients: string[]
  ): Promise<ApiResponse<any>> {
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const recipient of recipients) {
      const result = await this.sendEmail({
        to_email: recipient,
        subject,
        body_html: bodyHtml,
        body_text: bodyText
      });

      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push(`${recipient}: ${result.error}`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: results.failed === 0,
      data: results,
      message: `Sent ${results.sent} emails, ${results.failed} failed`
    };
  }

  /**
   * Send email notification for new support ticket
   */
  async sendTicketCreatedEmail(
    ticketId: string,
    userEmail: string,
    userName: string,
    ticketSubject: string,
    status: string
  ): Promise<ApiResponse<any>> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Database service unavailable' };
    }

    // Get ticket_created template
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', 'ticket_created')
      .eq('is_active', true)
      .single();

    if (!template) {
      return { success: false, error: 'Ticket created template not found' };
    }

    return this.sendEmail({
      to_email: userEmail,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text,
      template_id: template.id,
      template_variables: {
        userName,
        ticketSubject,
        ticketId,
        status
      },
      ticket_id: ticketId
    });
  }

  /**
   * Send email notification for ticket update
   */
  async sendTicketUpdatedEmail(
    ticketId: string,
    userEmail: string,
    userName: string,
    ticketSubject: string,
    status: string,
    latestMessage: string
  ): Promise<ApiResponse<any>> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Database service unavailable' };
    }

    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', 'ticket_updated')
      .eq('is_active', true)
      .single();

    if (!template) {
      return { success: false, error: 'Ticket updated template not found' };
    }

    return this.sendEmail({
      to_email: userEmail,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text,
      template_id: template.id,
      template_variables: {
        userName,
        ticketSubject,
        ticketId,
        status,
        latestMessage
      },
      ticket_id: ticketId
    });
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(
    email: string,
    firstName: string,
    businessName: string,
    tempPassword: string
  ): Promise<ApiResponse<any>> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Database service unavailable' };
    }

    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', 'welcome_email')
      .eq('is_active', true)
      .single();

    if (!template) {
      return { success: false, error: 'Welcome email template not found' };
    }

    const loginUrl = 'https://getjetsuite.com/login';

    return this.sendEmail({
      to_email: email,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text,
      template_id: template.id,
      template_variables: {
        firstName,
        businessName,
        tempPassword,
        loginUrl
      }
    });
  }

  /**
   * Replace template variables with actual values
   */
  private replaceVariables(text: string, variables: Record<string, string>): string {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  /**
   * Get email statistics
   */
  async getEmailStats(): Promise<ApiResponse<any>> {
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
      const { data: totalData, count: totalCount } = await supabase
        .from('email_logs')
        .select('status, opened_at, clicked_at', { count: 'exact' });

      const totalSent = totalData?.filter(log => log.status === 'sent').length || 0;
      const totalFailed = totalData?.filter(log => log.status === 'failed').length || 0;
      const totalOpened = totalData?.filter(log => log.opened_at !== null).length || 0;
      const totalClicked = totalData?.filter(log => log.clicked_at !== null).length || 0;

      // Today's stats
      const { data: todayData } = await supabase
        .from('email_logs')
        .select('status')
        .gte('created_at', today.toISOString());

      const todaySent = todayData?.filter(log => log.status === 'sent').length || 0;

      // Week stats
      const { data: weekData } = await supabase
        .from('email_logs')
        .select('status')
        .gte('created_at', weekAgo.toISOString());

      const weekSent = weekData?.filter(log => log.status === 'sent').length || 0;

      // Month stats
      const { data: monthData } = await supabase
        .from('email_logs')
        .select('status')
        .gte('created_at', monthAgo.toISOString());

      const monthSent = monthData?.filter(log => log.status === 'sent').length || 0;

      return {
        success: true,
        data: {
          total_sent: totalSent,
          total_failed: totalFailed,
          today_sent: todaySent,
          this_week_sent: weekSent,
          this_month_sent: monthSent,
          total_opened: totalOpened,
          total_clicked: totalClicked,
          open_rate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
          click_rate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get email stats'
      };
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;