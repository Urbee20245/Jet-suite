// =====================================================
// JETSUITE EMAIL & SMS TYPES
// =====================================================

export type EmailStatus = 'queued' | 'sent' | 'failed' | 'bounced';
export type SMSStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';
export type TemplateType = 
  | 'welcome'
  | 'ticket_created'
  | 'ticket_updated'
  | 'ticket_resolved'
  | 'password_reset'
  | 'trial_expiring'
  | 'subscription_updated'
  | 'broadcast'
  | 'custom';
export type BroadcastAudience = 'all' | 'founder' | 'standard' | 'trial' | 'custom';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';

// =====================================================
// EMAIL SETTINGS
// =====================================================

export interface EmailSettings {
  id: string;
  resend_api_key: string;
  from_email: string;
  from_name: string;
  reply_to_email: string;
  forward_to_email?: string;
  forward_enabled: boolean;
  auto_reply_enabled: boolean;
  auto_reply_message?: string;
  default_signature: string;
  daily_email_limit: number;
  hourly_email_limit: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateEmailSettingsRequest {
  resend_api_key?: string;
  from_email?: string;
  from_name?: string;
  reply_to_email?: string;
  forward_to_email?: string;
  forward_enabled?: boolean;
  auto_reply_enabled?: boolean;
  auto_reply_message?: string;
  default_signature?: string;
  daily_email_limit?: number;
  hourly_email_limit?: number;
}

// =====================================================
// SMS SETTINGS
// =====================================================

export interface SMSSettings {
  id: string;
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_phone_number: string;
  sms_enabled: boolean;
  urgent_tickets_sms: boolean;
  daily_sms_limit: number;
  hourly_sms_limit: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateSMSSettingsRequest {
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  twilio_phone_number?: string;
  sms_enabled?: boolean;
  urgent_tickets_sms?: boolean;
  daily_sms_limit?: number;
  hourly_sms_limit?: number;
}

// =====================================================
// EMAIL TEMPLATES
// =====================================================

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text?: string;
  template_type: TemplateType;
  variables: string[];
  description?: string;
  is_active: boolean;
  use_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEmailTemplateRequest {
  name: string;
  subject: string;
  body_html: string;
  body_text?: string;
  template_type: TemplateType;
  variables?: string[];
  description?: string;
  is_active?: boolean;
}

export interface UpdateEmailTemplateRequest {
  name?: string;
  subject?: string;
  body_html?: string;
  body_text?: string;
  template_type?: TemplateType;
  variables?: string[];
  description?: string;
  is_active?: boolean;
}

// =====================================================
// EMAIL & SMS LOGS
// =====================================================

export interface EmailLog {
  id: string;
  to_email: string;
  from_email: string;
  subject: string;
  body_html?: string;
  body_text?: string;
  template_id?: string;
  user_id?: string;
  ticket_id?: string;
  status: EmailStatus;
  provider: string;
  provider_message_id?: string;
  error_message?: string;
  opened_at?: string;
  clicked_at?: string;
  sent_at?: string;
  created_at: string;
}

export interface SMSLog {
  id: string;
  to_phone: string;
  from_phone: string;
  message: string;
  user_id?: string;
  ticket_id?: string;
  status: SMSStatus;
  provider_message_id?: string;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  created_at: string;
}

// =====================================================
// SEND EMAIL/SMS REQUESTS
// =====================================================

export interface SendEmailRequest {
  to_email: string | string[];
  subject: string;
  body_html: string;
  body_text?: string;
  template_id?: string;
  template_variables?: Record<string, string>;
  user_id?: string;
  ticket_id?: string;
  reply_to?: string;
}

export interface SendSMSRequest {
  to_phone: string | string[];
  message: string;
  user_id?: string;
  ticket_id?: string;
}

// =====================================================
// BROADCAST CAMPAIGNS
// =====================================================

export interface BroadcastCampaign {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text?: string;
  target_audience: BroadcastAudience;
  custom_filter?: any;
  scheduled_at?: string;
  sent_at?: string;
  total_recipients: number;
  emails_sent: number;
  emails_failed: number;
  emails_opened: number;
  emails_clicked: number;
  status: CampaignStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBroadcastCampaignRequest {
  name: string;
  subject: string;
  body_html: string;
  body_text?: string;
  target_audience: BroadcastAudience;
  custom_filter?: any;
  scheduled_at?: string;
}

export interface UpdateBroadcastCampaignRequest {
  name?: string;
  subject?: string;
  body_html?: string;
  body_text?: string;
  target_audience?: BroadcastAudience;
  custom_filter?: any;
  scheduled_at?: string;
  status?: CampaignStatus;
}

// =====================================================
// API RESPONSES
// =====================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface EmailStatsResponse {
  total_sent: number;
  total_failed: number;
  total_opened: number;
  total_clicked: number;
  today_sent: number;
  this_week_sent: number;
  this_month_sent: number;
  open_rate: number;
  click_rate: number;
}

export interface SMSStatsResponse {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  today_sent: number;
  this_week_sent: number;
  this_month_sent: number;
  delivery_rate: number;
}

// =====================================================
// ADMIN INBOX
// =====================================================

export interface AdminInboxMessage {
  id: string;
  from_email: string;
  from_name: string | null;
  to_email: string;
  subject: string | null;
  html_body: string | null;
  text_body: string | null;
  received_at: string;
  read: boolean;
  created_at: string;
}

export interface AdminInboxListResponse {
  success: boolean;
  messages?: AdminInboxMessage[];
  total?: number;
  error?: string;
}

export interface AdminInboxDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}