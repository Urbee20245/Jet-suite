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

  const saveEmailSettings = async () => {
    setUpdating(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        showMessage('error', 'Database connection not available');
        setUpdating(false);
        return;
      }
  
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
          .update(emailForm)
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        // Insert new
        result = await supabase
          .from('email_settings')
          .insert([emailForm])
          .select()
          .single();
      }
  
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
          .update(smsForm)
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        // Insert new
        result = await supabase
          .from('sms_settings')
          .insert([smsForm])
          .select()
          .single();
      }
  
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
            {/* Resend API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resend API Key *
              </label>
              <input
                type="password"
                value={emailForm.resend_api_key}
                onChange={(e) => setEmailForm({ ...emailForm, resend_api_key: e.target.value })}
                placeholder="re_xxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Get your API key from: <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">resend.com/api-keys</a>
              </p>
            </div>

            {/* From Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Email *
                </label>
                <input
                  type="email"
                  value={emailForm.from_email}
                  onChange={(e) => setEmailForm({ ...emailForm, from_email: e.target.value })}
                  placeholder="no-reply@yourdomain.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Name *
                </label>
                <input
                  type="text"
                  value={emailForm.from_name}
                  onChange={(e) => setEmailForm({ ...emailForm, from_name: e.target.value })}
                  placeholder="JetSuite"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Reply To & Forward */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reply-To Email *
                </label>
                <input
                  type="email"
                  value={emailForm.reply_to_email}
                  onChange={(e) => setEmailForm({ ...emailForm, reply_to_email: e.target.value })}
                  placeholder="support@yourdomain.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forward To Email (Optional)
                </label>
                <input
                  type="email"
                  value={emailForm.forward_to_email}
                  onChange={(e) => setEmailForm({ ...emailForm, forward_to_email: e.target.value })}
                  placeholder="admin@yourdomain.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="forward_enabled"
                  checked={emailForm.forward_enabled}
                  onChange={(e) => setEmailForm({ ...emailForm, forward_enabled: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="forward_enabled" className="text-sm font-medium text-gray-700">
                  Enable Email Forwarding
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="auto_reply_enabled"
                  checked={emailForm.auto_reply_enabled}
                  onChange={(e) => setEmailForm({ ...emailForm, auto_reply_enabled: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="auto_reply_enabled" className="text-sm font-medium text-gray-700">
                  Enable Auto-Reply
                </label>
              </div>
            </div>

            {/* Auto Reply Message */}
            {emailForm.auto_reply_enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Reply Message
                </label>
                <textarea
                  value={emailForm.auto_reply_message}
                  onChange={(e) => setEmailForm({ ...emailForm, auto_reply_message: e.target.value })}
                  rows={3}
                  placeholder="Thank you for contacting us. We'll get back to you soon!"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* Default Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Email Signature
              </label>
              <textarea
                value={emailForm.default_signature}
                onChange={(e) => setEmailForm({ ...emailForm, default_signature: e.target.value })}
                rows={4}
                placeholder="Best regards,&#10;The JetSuite Team&#10;https://getjetsuite.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Rate Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Email Limit
                </label>
                <input
                  type="number"
                  value={emailForm.daily_email_limit}
                  onChange={(e) => setEmailForm({ ...emailForm, daily_email_limit: parseInt(e.target.value) })}
                  min={1}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Email Limit
                </label>
                <input
                  type="number"
                  value={emailForm.hourly_email_limit}
                  onChange={(e) => setEmailForm({ ...emailForm, hourly_email_limit: parseInt(e.target.value) })}
                  min={1}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t">
              <button
                onClick={saveEmailSettings}
                disabled={updating}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckIcon className="h-5 w-5" />
                {updating ? 'Saving...' : 'Save Email Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMS Settings Tab */}
      {activeTab === 'sms' && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DevicePhoneMobileIcon className="h-6 w-6 text-blue-600" />
              SMS Settings (Twilio)
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure Twilio API integration for SMS notifications
            </p>
          </div>

          <div className="space-y-6">
            {/* Twilio Account SID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Twilio Account SID *
              </label>
              <input
                type="text"
                value={smsForm.twilio_account_sid}
                onChange={(e) => setSmsForm({ ...smsForm, twilio_account_sid: e.target.value })}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Twilio Auth Token */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Twilio Auth Token *
              </label>
              <input
                type="password"
                value={smsForm.twilio_auth_token}
                onChange={(e) => setSmsForm({ ...smsForm, twilio_auth_token: e.target.value })}
                placeholder="Your Twilio Auth Token"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Twilio Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Twilio Phone Number *
              </label>
              <input
                type="tel"
                value={smsForm.twilio_phone_number}
                onChange={(e) => setSmsForm({ ...smsForm, twilio_phone_number: e.target.value })}
                placeholder="+1234567890"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Get your credentials from: <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">console.twilio.com</a>
              </p>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sms_enabled"
                  checked={smsForm.sms_enabled}
                  onChange={(e) => setSmsForm({ ...smsForm, sms_enabled: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="sms_enabled" className="text-sm font-medium text-gray-700">
                  Enable SMS Notifications
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="urgent_tickets_sms"
                  checked={smsForm.urgent_tickets_sms}
                  onChange={(e) => setSmsForm({ ...smsForm, urgent_tickets_sms: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="urgent_tickets_sms" className="text-sm font-medium text-gray-700">
                  SMS for Urgent Tickets
                </label>
              </div>
            </div>

            {/* Rate Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily SMS Limit
                </label>
                <input
                  type="number"
                  value={smsForm.daily_sms_limit}
                  onChange={(e) => setSmsForm({ ...smsForm, daily_sms_limit: parseInt(e.target.value) })}
                  min={1}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly SMS Limit
                </label>
                <input
                  type="number"
                  value={smsForm.hourly_sms_limit}
                  onChange={(e) => setSmsForm({ ...smsForm, hourly_sms_limit: parseInt(e.target.value) })}
                  min={1}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t">
              <button
                onClick={saveSmsSettings}
                disabled={updating}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckIcon className="h-5 w-5" />
                {updating ? 'Saving...' : 'Save SMS Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}