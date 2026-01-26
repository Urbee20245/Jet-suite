import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { isTrialActive, isTrialExpired, formatTrialEndDate } from '../utils/trialHelpers';
import { 
  UserCircleIcon, 
  CalendarIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  CheckIcon,
  XMarkIcon
} from '../components/icons/MiniIcons';
import type { EmailSettings, SMSSettings, UpdateEmailSettingsRequest, UpdateSMSSettingsRequest } from '../Types/emailTypes';
import { getSupabaseClient } from '../integrations/supabase/client';
import supportService from '../services/supportService'; // For support tab

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  trial_end_date: string | null;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

type TabType = 'overview' | 'businesses' | 'users' | 'support' | 'revenue' | 'announcements' | 'email' | 'sms';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [newTrialDate, setNewTrialDate] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Email settings state
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [emailStats, setEmailStats] = useState<any>({});
  const [emailForm, setEmailForm] = useState<UpdateEmailSettingsRequest>({
    resend_api_key: '',
    from_email: '',
    from_name: '',
    reply_to_email: '',
    forward_to_email: '',
    forward_enabled: false,
    auto_reply_enabled: false,
    auto_reply_message: '',
    default_signature: '',
    daily_email_limit: 100,
    hourly_email_limit: 20
  });

  // SMS settings state
  const [smsSettings, setSmsSettings] = useState<SMSSettings | null>(null);
  const [smsForm, setSmsForm] = useState<UpdateSMSSettingsRequest>({
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_phone_number: '',
    sms_enabled: false,
    urgent_tickets_sms: false,
    daily_sms_limit: 50,
    hourly_sms_limit: 10
  });
  
  // Support state
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  useEffect(() => {
    const loadTabData = () => {
      switch (activeTab) {
        case 'users':
          loadUsers();
          break;
        case 'email':
          loadEmailSettings();
          break;
        case 'sms':
          loadSmsSettings();
          break;
        case 'support':
          loadTickets();
          break;
        default:
          setLoading(false);
          break;
      }
    };
    loadTabData();
  }, [activeTab]);

  const loadUsers = async () => {
    setLoading(true);
    const result = await adminService.getAllUsers();
    if (result.success && result.users) {
      setUsers(result.users);
    } else {
      showMessage('error', result.error || 'Failed to load users');
    }
    setLoading(false);
  };

  const loadEmailSettings = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error('Supabase client not available');
        setLoading(false);
        return;
      }
  
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .single();
  
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading email settings:', error);
        setLoading(false);
        return;
      }
  
      if (data) {
        setEmailSettings(data);
        setEmailForm({
          resend_api_key: data.resend_api_key || '',
          from_email: data.from_email || '',
          from_name: data.from_name || '',
          reply_to_email: data.reply_to_email || '',
          forward_to_email: data.forward_to_email || '',
          forward_enabled: data.forward_enabled || false,
          auto_reply_enabled: data.auto_reply_enabled || false,
          auto_reply_message: data.auto_reply_message || '',
          default_signature: data.default_signature || '',
          daily_email_limit: data.daily_email_limit || 100,
          hourly_email_limit: data.hourly_email_limit || 20
        });
      }
      
      // Load stats
      const today = new Date();
      today.setHours(0,0,0,0);
      const { count: sentToday } = await supabase.from('email_logs').select('*', { count: 'exact', head: true }).eq('status', 'sent').gte('created_at', today.toISOString());
      const { count: failedToday } = await supabase.from('email_logs').select('*', { count: 'exact', head: true }).eq('status', 'failed').gte('created_at', today.toISOString());
      
      setEmailStats({
        sent_today: sentToday,
        sent_this_month: sentToday, // Placeholder
        failed_today: failedToday,
        total_sent: sentToday, // Placeholder
        today_sent: sentToday, // Placeholder
        open_rate: 0,
        click_rate: 0
      });

    } catch (error: any) {
      console.error('Error loading email settings:', error);
    }
    setLoading(false);
  };

  const loadSmsSettings = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error('Supabase client not available');
        setLoading(false);
        return;
      }
  
      const { data, error } = await supabase
        .from('sms_settings')
        .select('*')
        .single();
  
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading SMS settings:', error);
        setLoading(false);
        return;
      }
  
      if (data) {
        setSmsSettings(data);
        setSmsForm({
          twilio_account_sid: data.twilio_account_sid || '',
          twilio_auth_token: data.twilio_auth_token || '',
          twilio_phone_number: data.twilio_phone_number || '',
          sms_enabled: data.sms_enabled || false,
          urgent_tickets_sms: data.urgent_tickets_sms || false,
          daily_sms_limit: data.daily_sms_limit || 50,
          hourly_sms_limit: data.hourly_sms_limit || 10
        });
      }
    } catch (error: any) {
      console.error('Error loading SMS settings:', error);
    }
    setLoading(false);
  };

  const loadTickets = async () => {
    setIsLoadingTickets(true);
    try {
        const result = await supportService.getAllTickets();
        if (result.success) {
            setTickets(result.data || []);
        } else {
            console.error('Error fetching all tickets:', result.error);
        }
    } catch (error) {
        console.error('Error fetching all tickets:', error);
    } finally {
        setIsLoadingTickets(false);
    }
  };

  const saveEmailSettings = async () => {
    setUpdating(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        showMessage('error', 'Database connection not available');
        setUpdating(false);
        return;
      }
  
      const { data: existing } = await supabase.from('email_settings').select('id').maybeSingle();
  
      const result = existing
        ? await supabase.from('email_settings').update(emailForm).eq('id', existing.id).select().single()
        : await supabase.from('email_settings').insert([emailForm]).select().single();
  
      if (result.error) {
        showMessage('error', result.error.message || 'Failed to save email settings');
      } else {
        showMessage('success', 'Email settings saved successfully');
        await loadEmailSettings();
      }
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to save email settings');
    }
    setUpdating(false);
  };

  const saveSmsSettings = async () => {
    setUpdating(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        showMessage('error', 'Database connection not available');
        setUpdating(false);
        return;
      }
  
      const { data: existing } = await supabase.from('sms_settings').select('id').maybeSingle();
  
      const result = existing
        ? await supabase.from('sms_settings').update(smsForm).eq('id', existing.id).select().single()
        : await supabase.from('sms_settings').insert([smsForm]).select().single();
  
      if (result.error) {
        showMessage('error', result.error.message || 'Failed to save SMS settings');
      } else {
        showMessage('success', 'SMS settings saved successfully');
        await loadSmsSettings();
      }
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to save SMS settings');
    }
    setUpdating(false);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleExtendTrial = async (userId: string) => {
    if (!newTrialDate) {
      showMessage('error', 'Please select a trial end date');
      return;
    }
    setUpdating(true);
    const result = await adminService.extendTrial(userId, newTrialDate);
    if (result.success) {
      showMessage('success', 'Trial extended successfully');
      setNewTrialDate('');
      setSelectedUser(null);
      await loadUsers();
    } else {
      showMessage('error', result.error || 'Failed to extend trial');
    }
    setUpdating(false);
  };

  const handleUpdateSubscription = async (userId: string, status: string) => {
    setUpdating(true);
    const result = await adminService.updateSubscriptionStatus(userId, status);
    if (result.success) {
      showMessage('success', `Subscription status updated to ${status}`);
      await loadUsers();
    } else {
      showMessage('error', result.error || 'Failed to update subscription');
    }
    setUpdating(false);
  };

  const getTrialStatusBadge = (user: Profile) => {
    if (!user.trial_end_date) return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">No Trial</span>;
    if (isTrialActive(user.trial_end_date)) return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 flex items-center gap-1"><CheckCircleIcon className="h-3 w-3" /> Active</span>;
    if (isTrialExpired(user.trial_end_date)) return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 flex items-center gap-1"><XCircleIcon className="h-3 w-3" /> Expired</span>;
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Unknown</span>;
  };

  const getSubscriptionBadge = (status: string | null) => {
    if (!status || status === 'none') return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">No Subscription</span>;
    const colorMap: Record<string, string> = { active: 'bg-green-100 text-green-700', trialing: 'bg-blue-100 text-blue-700', canceled: 'bg-red-100 text-red-700', past_due: 'bg-yellow-100 text-yellow-700' };
    return <span className={`px-2 py-1 text-xs rounded-full ${colorMap[status] || 'bg-gray-100 text-gray-700'}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  const renderTabContent = () => {
    if (loading) {
      return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }
    switch (activeTab) {
      case 'users': return <div>User Management Content</div>; // Placeholder
      case 'email': return <div>Email Settings Content</div>; // Placeholder
      case 'sms': return <div>SMS Settings Content</div>; // Placeholder
      // Add other cases here
      default: return <div>Select a tab</div>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ... existing header and message divs ... */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {(['overview', 'businesses', 'users', 'support', 'revenue', 'announcements', 'email', 'sms'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>
      {renderTabContent()}
    </div>
  );
};