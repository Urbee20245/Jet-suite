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
} from './icons/MiniIcons';
import type { EmailSettings, SMSSettings, UpdateEmailSettingsRequest, UpdateSMSSettingsRequest } from '../Types/emailTypes';
import { getSupabaseClient } from '../integrations/supabase/client';
import { Loader } from '../components/Loader';

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

type TabType = 'users' | 'email' | 'sms';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [newTrialDate, setNewTrialDate] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Email settings state
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
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

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'email') {
      loadEmailSettings();
    } else if (activeTab === 'sms') {
      loadSmsSettings();
    }
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
      setIsLoadingEmailSettings(true);
      try {
        const supabase = getSupabaseClient();
        
        // Load email settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('email_settings')
          .select('*')
          .maybeSingle();

        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error('Error loading email settings:', settingsError);
        } else if (settingsData) {
          setEmailSettings(settingsData);
          // Populate emailForm state for editing
          setEmailForm({
            resend_api_key: settingsData.resend_api_key || '',
            from_email: settingsData.from_email || '',
            from_name: settingsData.from_name || '',
            reply_to_email: settingsData.reply_to_email || '',
            forward_to_email: settingsData.forward_to_email || '',
            forward_enabled: settingsData.forward_enabled || false,
            auto_reply_enabled: settingsData.auto_reply_enabled || false,
            auto_reply_message: settingsData.auto_reply_message || '',
            default_signature: settingsData.default_signature || '',
            daily_email_limit: settingsData.daily_email_limit || 100,
            hourly_email_limit: settingsData.hourly_email_limit || 20
          });
        }

        // Load templates
        const { data: templatesData, error: templatesError } = await supabase
          .from('email_templates')
          .select('*')
          .order('created_at', { ascending: false });

        if (!templatesError) {
          setEmailTemplates(templatesData || []);
        }

        // Load stats - count emails sent today
        const today = new Date().toISOString().split('T')[0];
        const { data: logsData } = await supabase
          .from('email_logs')
          .select('*')
          .gte('created_at', `${today}T00:00:00Z`)
          .lte('created_at', `${today}T23:59:59Z`);

        const sentToday = logsData?.filter(log => log.status === 'sent').length || 0;
        const failedToday = logsData?.filter(log => log.status === 'failed').length || 0;
        
        setEmailStats({
          sent_today: sentToday,
          sent_this_month: sentToday,
          failed_today: failedToday
        });

      } catch (error) {
        console.error('Error loading email settings:', error);
        showToast('Failed to load email settings', 'error');
      } finally {
        setIsLoadingEmailSettings(false);
      }
    };

    const loadSmsSettings = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Load SMS settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('sms_settings')
          .select('*')
          .maybeSingle();

        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error('Error loading SMS settings:', settingsError);
        } else if (settingsData) {
          setSmsSettings(settingsData);
          // Populate smsForm state for editing
          setSmsForm({
            twilio_account_sid: settingsData.twilio_account_sid || '',
            twilio_auth_token: settingsData.twilio_auth_token || '',
            twilio_phone_number: settingsData.twilio_phone_number || '',
            sms_enabled: settingsData.sms_enabled || false,
            urgent_tickets_sms: settingsData.urgent_tickets_sms || false,
            daily_sms_limit: settingsData.daily_sms_limit || 50,
            hourly_sms_limit: settingsData.hourly_sms_limit || 10
          });
        }

        // Load stats - count SMS sent today
        const today = new Date().toISOString().split('T')[0];
        const { data: logsData } = await supabase
          .from('sms_logs')
          .select('*')
          .gte('created_at', `${today}T00:00:00Z`)
          .lte('created_at', `${today}T23:59:59Z`);

        const sentToday = logsData?.filter(log => log.status === 'sent').length || 0;
        const failedToday = logsData?.filter(log => log.status === 'failed').length || 0;
        
        setSmsStats({
          sent_today: sentToday,
          sent_this_month: sentToday,
          failed_today: failedToday
        });

      } catch (error) {
        console.error('Error loading SMS settings:', error);
        showToast('Failed to load SMS settings', 'error');
      }
    };

  const saveEmailSettings = async () => {
      setIsSavingEmailSettings(true);
      try {
        const supabase = getSupabaseClient();
        
        // Check if settings exist
        const { data: existing } = await supabase
          .from('email_settings')
          .select('id')
          .maybeSingle();

        let result;
        if (existing) {
          // Update existing
          result = await supabase
            .from('email_settings')
            .update(emailSettings)
            .eq('id', existing.id)
            .select()
            .single();
        } else {
          // Insert new
          result = await supabase
            .from('email_settings')
            .insert([emailSettings])
            .select()
            .single();
        }

        if (result.error) {
          showToast(result.error.message || 'Failed to save settings', 'error');
        } else {
          showToast('Email settings saved successfully', 'success');
          setEmailSettings(result.data);
        }
      } catch (error) {
        console.error('Error saving email settings:', error);
        showToast('Failed to save email settings', 'error');
      } finally {
        setIsSavingEmailSettings(false);
      }
    };

    const saveSmsSettings = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Check if settings exist
        const { data: existing } = await supabase
          .from('sms_settings')
          .select('id')
          .maybeSingle();

        let result;
        if (existing) {
          // Update existing
          result = await supabase
            .from('sms_settings')
            .update(smsSettings)
            .eq('id', existing.id)
            .select()
            .single();
        } else {
          // Insert new
          result = await supabase
            .from('sms_settings')
            .insert([smsSettings])
            .select()
            .single();
        }

        if (result.error) {
          showToast(result.error.message || 'Failed to save settings', 'error');
        } else {
          showToast('SMS settings saved successfully', 'success');
          setSmsSettings(result.data);
        }
      } catch (error) {
        console.error('Error saving SMS settings:', error);
        showToast('Failed to save SMS settings', 'error');
      }
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
    if (!user.trial_end_date) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">No Trial</span>;
    }

    if (isTrialActive(user.trial_end_date)) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 flex items-center gap-1">
        <CheckCircleIcon className="h-3 w-3" />
        Active
      </span>;
    }

    if (isTrialExpired(user.trial_end_date)) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 flex items-center gap-1">
        <XCircleIcon className="h-3 w-3" />
        Expired
      </span>;
    }

    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Unknown</span>;
  };

  const getSubscriptionBadge = (status: string | null) => {
    if (!status || status === 'none') {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">No Subscription</span>;
    }

    const colorMap: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      trialing: 'bg-blue-100 text-blue-700',
      canceled: 'bg-red-100 text-red-700',
      past_due: 'bg-yellow-100 text-yellow-700',
    };

    const color = colorMap[status] || 'bg-gray-100 text-gray-700';

    return <span className={`px-2 py-1 text-xs rounded-full ${color}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="mt-2 text-gray-600">Manage users, email settings, and SMS configuration</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UserCircleIcon className="h-5 w-5" />
            User Management
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'email'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <EnvelopeIcon className="h-5 w-5" />
            Email Settings
          </button>
          <button
            onClick={() => setActiveTab('sms')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'sms'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DevicePhoneMobileIcon className="h-5 w-5" />
            SMS Settings
          </button>
        </nav>
      </div>

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trial Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trial End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <React.Fragment key={user.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserCircleIcon className="h-10 w-10 text-gray-400" />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTrialStatusBadge(user)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.trial_end_date ? formatTrialEndDate(user.trial_end_date) : 'Not set'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getSubscriptionBadge(user.subscription_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {selectedUser?.id === user.id ? 'Cancel' : 'Manage'}
                        </button>
                      </td>
                    </tr>
                    
                    {selectedUser?.id === user.id && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            {/* Extend Trial Section */}
                            <div className="border-b pb-4">
                              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5" />
                                Extend Trial
                              </h3>
                              <div className="flex items-center gap-3">
                                <input
                                  type="date"
                                  value={newTrialDate}
                                  onChange={(e) => setNewTrialDate(e.target.value)}
                                  min={new Date().toISOString().split('T')[0]}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                  onClick={() => handleExtendTrial(user.id)}
                                  disabled={updating || !newTrialDate}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {updating ? 'Updating...' : 'Extend Trial'}
                                </button>
                              </div>
                            </div>

                            {/* Subscription Management Section */}
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                Update Subscription Status
                              </h3>
                              <div className="flex items-center gap-2 flex-wrap">
                                {['active', 'trialing', 'canceled', 'past_due', 'none'].map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => handleUpdateSubscription(user.id, status)}
                                    disabled={updating}
                                    className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                                      user.subscription_status === status
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* User Details */}
                            <div className="pt-4 border-t">
                              <h3 className="text-sm font-semibold text-gray-900 mb-2">User Details</h3>
                              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <dt className="text-gray-500">User ID:</dt>
                                <dd className="text-gray-900 font-mono text-xs">{user.id}</dd>
                                
                                <dt className="text-gray-500">Created:</dt>
                                <dd className="text-gray-900">{new Date(user.created_at).toLocaleDateString()}</dd>
                                
                                <dt className="text-gray-500">Stripe Customer:</dt>
                                <dd className="text-gray-900 font-mono text-xs">{user.stripe_customer_id || 'None'}</dd>
                                
                                <dt className="text-gray-500">Stripe Subscription:</dt>
                                <dd className="text-gray-900 font-mono text-xs">{user.stripe_subscription_id || 'None'}</dd>
                              </dl>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first user account.</p>
            </div>
          )}
        </div>
      )}

      {/* Email Settings Tab */}
      {activeTab === 'email' && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <EnvelopeIcon className="h-6 w-6 text-blue-600" />
              Email Settings (Resend)
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure Resend API integration for transactional and broadcast emails
            </p>
          </div>

          <div className="space-y-6">
            {/* Email Statistics */}
            <AdminSection title="Email Statistics">
              {emailStats ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{emailStats.sent_today}</div>
                    <div className="text-sm text-gray-600">Sent Today</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{emailStats.sent_this_month}</div>
                    <div className="text-sm text-gray-600">Sent This Month</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">N/A</div>
                    <div className="text-sm text-gray-600">Open Rate</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">N/A</div>
                    <div className="text-sm text-gray-600">Click Rate</div>
                  </div>
                </div>
              ) : (
                <Loader />
              )}
            </AdminSection>

            {/* Quick Actions */}
            <AdminSection title="Quick Actions">
              <div className="flex gap-4">
                <button
                  onClick={() => setShowSendEmailModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <MailIcon className="w-5 h-5" />
                  Send Individual Email
                </button>
                <button
                  onClick={() => setShowBroadcastModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <MailIcon className="w-5 h-5" />
                  Send Broadcast Email
                </button>
              </div>
            </AdminSection>

            {/* Email Configuration */}
            <AdminSection title="Email Configuration (Resend)">
              {isLoadingEmailSettings ? (
                <Loader />
              ) : emailSettings ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resend API Key
                    </label>
                    <input
                      type="password"
                      value={emailSettings.resend_api_key || ''}
                      onChange={(e) => setEmailSettings({...emailSettings, resend_api_key: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="re_..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        From Email
                      </label>
                      <input
                        type="email"
                        value={emailSettings.from_email || ''}
                        onChange={(e) => setEmailSettings({...emailSettings, from_email: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        From Name
                      </label>
                      <input
                        type="text"
                        value={emailSettings.from_name || ''}
                        onChange={(e) => setEmailSettings({...emailSettings, from_name: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reply To Email
                    </label>
                    <input
                      type="email"
                      value={emailSettings.reply_to_email || ''}
                      onChange={(e) => setEmailSettings({...emailSettings, reply_to_email: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Forward Incoming Emails To
                    </label>
                    <input
                      type="email"
                      value={emailSettings.forward_to_email || ''}
                      onChange={(e) => setEmailSettings({...emailSettings, forward_to_email: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="your@email.com"
                    />
                    <label className="flex items-center mt-2">
                      <input
                        type="checkbox"
                        checked={emailSettings.forward_enabled || false}
                        onChange={(e) => setEmailSettings({...emailSettings, forward_enabled: e.target.checked})}
                        className="mr-2"
                      />
                      Enable email forwarding
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Signature
                    </label>
                    <textarea
                      value={emailSettings.default_signature || ''}
                      onChange={(e) => setEmailSettings({...emailSettings, default_signature: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={3}
                    />
                  </div>

                  <button
                    onClick={handleSaveEmailSettings}
                    disabled={isSavingEmailSettings}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isSavingEmailSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No email settings configured yet.</p>
              )}
            </AdminSection>

            {/* Email Templates */}
            <AdminSection title="Email Templates">
              <div className="space-y-2">
                {emailTemplates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-gray-600">{template.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Used {template.use_count} times
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </AdminSection>
          </div>
        )}

      {/* SMS Settings Tab */}
      {activeTab === 'sms' && (
        <div className="space-y-6">
          {/* SMS Statistics */}
          <AdminSection title="SMS Statistics">
            {smsStats ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{smsStats.sent_today}</div>
                  <div className="text-sm text-gray-600">Sent Today</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{smsStats.sent_this_month}</div>
                  <div className="text-sm text-gray-600">Sent This Month</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">N/A</div>
                  <div className="text-sm text-gray-600">Delivery Rate</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{smsStats.failed_today}</div>
                  <div className="text-sm text-gray-600">Failed Today</div>
                </div>
              </div>
            ) : (
              <Loader />
            )}
          </AdminSection>

          {/* SMS Configuration */}
          <AdminSection title="SMS Configuration (Twilio)">
            {smsSettings ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twilio Account SID
                  </label>
                  <input
                    type="text"
                    value={smsSettings.twilio_account_sid || ''}
                    onChange={(e) => setSmsSettings({...smsSettings, twilio_account_sid: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="AC..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twilio Auth Token
                  </label>
                  <input
                    type="password"
                    value={smsSettings.twilio_auth_token || ''}
                    onChange={(e) => setSmsSettings({...smsSettings, twilio_auth_token: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twilio Phone Number
                  </label>
                  <input
                    type="tel"
                    value={smsSettings.twilio_phone_number || ''}
                    onChange={(e) => setSmsSettings({...smsSettings, twilio_phone_number: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="+1234567890"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={smsSettings.sms_enabled || false}
                      onChange={(e) => setSmsSettings({...smsSettings, sms_enabled: e.target.checked})}
                      className="mr-2"
                    />
                    Enable SMS notifications
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={smsSettings.urgent_tickets_sms || false}
                      onChange={(e) => setSmsSettings({...smsSettings, urgent_tickets_sms: e.target.checked})}
                      className="mr-2"
                    />
                    Send SMS for urgent support tickets
                  </label>
                </div>

                <button
                  onClick={handleSaveSMSSettings}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save SMS Settings
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No SMS settings configured yet.</p>
            )}
          </AdminSection>
        </div>
      )}
    </div>
  );
}