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

interface AdminProfileData {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    created_at: string;
  };
  billing: {
    subscription_status: string | null;
    trial_end_date: string | null;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    business_count: number;
    seat_count: number;
  };
  business: any; // Primary business profile
  isProfileActive: boolean;
}

type TabType = 'overview' | 'businesses' | 'users' | 'support' | 'revenue' | 'announcements' | 'email' | 'sms';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<AdminProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminProfileData | null>(null);
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

  // Announcements state
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    type: 'info',
    target_audience: 'all',
    priority: 1,
    end_date: ''
  });

  // Create free user state
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({ email: '', firstName: '', lastName: '' });

  // Business details modal state
  const [selectedBusiness, setSelectedBusiness] = useState<AdminProfileData | null>(null);

  useEffect(() => {
    const loadTabData = () => {
      switch (activeTab) {
        case 'overview':
          loadUsers();
          break;
        case 'users':
        case 'businesses':
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
        case 'announcements':
          loadAnnouncements();
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
    try {
        const response = await fetch('/api/admin/get-all-profiles', {
            headers: { 'x-user-email': 'theivsightcompany@gmail.com' }
        });
        if (response.ok) {
            const data = await response.json();
            setUsers(data.profiles || []);
        } else {
            const errorData = await response.json();
            showMessage('error', errorData.error || 'Failed to load users');
        }
    } catch (error) {
        showMessage('error', 'Failed to load users due to network error');
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
        sent_this_month: sentToday,
        failed_today: failedToday,
        total_sent: sentToday,
        today_sent: sentToday,
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

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/announcements', {
        headers: { 'x-user-email': 'theivsightcompany@gmail.com' }
      });
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data || []);
      } else {
        showMessage('error', 'Failed to load announcements');
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
      showMessage('error', 'Failed to load announcements');
    }
    setLoading(false);
  };

  const createAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.message) {
      showMessage('error', 'Title and message are required');
      return;
    }
    setUpdating(true);
    try {
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'theivsightcompany@gmail.com'
        },
        body: JSON.stringify(announcementForm)
      });
      if (response.ok) {
        showMessage('success', 'Announcement created successfully');
        setShowAnnouncementForm(false);
        setAnnouncementForm({ title: '', message: '', type: 'info', target_audience: 'all', priority: 1, end_date: '' });
        await loadAnnouncements();
      } else {
        const data = await response.json();
        showMessage('error', data.error || 'Failed to create announcement');
      }
    } catch (error) {
      showMessage('error', 'Failed to create announcement');
    }
    setUpdating(false);
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    setUpdating(true);
    try {
      const response = await fetch('/api/admin/announcements', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'theivsightcompany@gmail.com'
        },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        showMessage('success', 'Announcement deleted');
        await loadAnnouncements();
      } else {
        showMessage('error', 'Failed to delete announcement');
      }
    } catch (error) {
      showMessage('error', 'Failed to delete announcement');
    }
    setUpdating(false);
  };

  const createFreeUser = async () => {
    if (!createUserForm.email) {
      showMessage('error', 'Email is required');
      return;
    }
    setUpdating(true);
    try {
      const response = await fetch('/api/admin/create-free-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'theivsightcompany@gmail.com'
        },
        body: JSON.stringify(createUserForm)
      });
      if (response.ok) {
        showMessage('success', 'Free user created successfully');
        setShowCreateUserForm(false);
        setCreateUserForm({ email: '', firstName: '', lastName: '' });
        await loadUsers();
      } else {
        const data = await response.json();
        showMessage('error', data.error || 'Failed to create user');
      }
    } catch (error) {
      showMessage('error', 'Failed to create user');
    }
    setUpdating(false);
  };

  const bulkWipeFreeUsers = async () => {
    if (!confirm('WARNING: This will permanently delete ALL free user data. This cannot be undone. Are you sure?')) return;
    if (!confirm('FINAL WARNING: All free users will lose their data permanently. Type "DELETE" to confirm.')) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/admin/bulk-wipe-free-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'theivsightcompany@gmail.com'
        }
      });
      if (response.ok) {
        const data = await response.json();
        showMessage('success', `Successfully wiped ${data.count || 0} free users`);
        await loadUsers();
      } else {
        const data = await response.json();
        showMessage('error', data.error || 'Failed to wipe free users');
      }
    } catch (error) {
      showMessage('error', 'Failed to wipe free users');
    }
    setUpdating(false);
  };

  const grantFreeAccess = async (userId: string) => {
    setUpdating(true);
    try {
      const response = await fetch('/api/admin/grant-free-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'theivsightcompany@gmail.com'
        },
        body: JSON.stringify({ userId })
      });
      if (response.ok) {
        showMessage('success', 'Free access granted');
        setSelectedUser(null);
        await loadUsers();
      } else {
        const data = await response.json();
        showMessage('error', data.error || 'Failed to grant free access');
      }
    } catch (error) {
      showMessage('error', 'Failed to grant free access');
    }
    setUpdating(false);
  };

  const wipeUserData = async (userId: string) => {
    if (!confirm('WARNING: This will permanently delete all data for this user. Continue?')) return;
    setUpdating(true);
    try {
      const response = await fetch('/api/admin/wipe-user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'theivsightcompany@gmail.com'
        },
        body: JSON.stringify({ userId })
      });
      if (response.ok) {
        showMessage('success', 'User data wiped successfully');
        setSelectedUser(null);
        await loadUsers();
      } else {
        const data = await response.json();
        showMessage('error', data.error || 'Failed to wipe user data');
      }
    } catch (error) {
      showMessage('error', 'Failed to wipe user data');
    }
    setUpdating(false);
  };

  const resetUserDna = async (userId: string) => {
    if (!confirm('This will reset the DNA approval status for this user. Continue?')) return;
    setUpdating(true);
    try {
      const response = await fetch('/api/admin/reset-dna', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'theivsightcompany@gmail.com'
        },
        body: JSON.stringify({ userId })
      });
      if (response.ok) {
        showMessage('success', 'DNA reset successfully');
        setSelectedBusiness(null);
        await loadUsers();
      } else {
        const data = await response.json();
        showMessage('error', data.error || 'Failed to reset DNA');
      }
    } catch (error) {
      showMessage('error', 'Failed to reset DNA');
    }
    setUpdating(false);
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

      // Use upsert with a fixed id to ensure only one row exists
      const settingsWithId = { ...emailForm, id: 1 };
      const { error } = await supabase
        .from('email_settings')
        .upsert(settingsWithId, { onConflict: 'id' });

      if (error) {
        showMessage('error', error.message || 'Failed to save email settings');
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

      // Use upsert with a fixed id to ensure only one row exists
      const settingsWithId = { ...smsForm, id: 1 };
      const { error } = await supabase
        .from('sms_settings')
        .upsert(settingsWithId, { onConflict: 'id' });

      if (error) {
        showMessage('error', error.message || 'Failed to save SMS settings');
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

  const getTrialStatusBadge = (user: AdminProfileData) => {
    const trialEndDate = user.billing.trial_end_date;
    if (!trialEndDate) return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">No Trial</span>;
    if (isTrialActive(trialEndDate)) return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 flex items-center gap-1"><CheckCircleIcon className="h-3 w-3" /> Active</span>;
    if (isTrialExpired(trialEndDate)) return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 flex items-center gap-1"><XCircleIcon className="h-3 w-3" /> Expired</span>;
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Unknown</span>;
  };

  const getSubscriptionBadge = (status: string | null) => {
    if (!status || status === 'none') return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">No Subscription</span>;
    const colorMap: Record<string, string> = { active: 'bg-green-100 text-green-700', trialing: 'bg-blue-100 text-blue-700', canceled: 'bg-red-100 text-red-700', past_due: 'bg-yellow-100 text-yellow-700', admin_granted_free: 'bg-purple-100 text-purple-700' };
    return <span className={`px-2 py-1 text-xs rounded-full ${colorMap[status] || 'bg-gray-100 text-gray-700'}`}>{status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}</span>;
  };

  const renderTabContent = () => {
    if (loading) {
      return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }
    switch (activeTab) {
      case 'overview':
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Admin Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
                        <p className="text-4xl font-bold text-blue-600 mt-2">{users.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700">Active Subscriptions</h3>
                        <p className="text-4xl font-bold text-green-600 mt-2">{users.filter(u => u.billing.subscription_status === 'active').length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700">Businesses Created</h3>
                        <p className="text-4xl font-bold text-purple-600 mt-2">{users.reduce((acc, u) => acc + (u.billing?.business_count || 0), 0)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700">Quick Actions</h3>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button onClick={() => setShowCreateUserForm(true)} className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600">Create Free User</button>
                        <button onClick={bulkWipeFreeUsers} disabled={updating} className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 disabled:opacity-50">Bulk Wipe Free Users</button>
                        <button onClick={() => setActiveTab('announcements')} className="bg-yellow-500 text-white p-3 rounded-lg hover:bg-yellow-600">Send Announcement</button>
                        <button onClick={() => setActiveTab('revenue')} className="bg-green-500 text-white p-3 rounded-lg hover:bg-green-600">View Revenue</button>
                    </div>
                </div>

                {/* Create Free User Modal */}
                {showCreateUserForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Free User</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                                    <input
                                        type="email"
                                        value={createUserForm.email}
                                        onChange={e => setCreateUserForm({...createUserForm, email: e.target.value})}
                                        className="w-full mt-1 p-2 border rounded-lg"
                                        placeholder="user@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                                    <input
                                        type="text"
                                        value={createUserForm.firstName}
                                        onChange={e => setCreateUserForm({...createUserForm, firstName: e.target.value})}
                                        className="w-full mt-1 p-2 border rounded-lg"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                    <input
                                        type="text"
                                        value={createUserForm.lastName}
                                        onChange={e => setCreateUserForm({...createUserForm, lastName: e.target.value})}
                                        className="w-full mt-1 p-2 border rounded-lg"
                                        placeholder="Doe"
                                    />
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button
                                        onClick={createFreeUser}
                                        disabled={updating}
                                        className="flex-1 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {updating ? 'Creating...' : 'Create User'}
                                    </button>
                                    <button
                                        onClick={() => setShowCreateUserForm(false)}
                                        className="flex-1 bg-gray-300 text-gray-700 p-2 rounded-lg hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
      case 'businesses':
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Business Profiles ({users.length})</h2>
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DNA Approved</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map(user => (
                                <tr key={user.user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{user.business?.business_name || 'No Business'}</div>
                                        <div className="text-xs text-gray-500">{user.business?.location || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.business?.is_complete ? <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Complete</span> : <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Incomplete</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.business?.isDnaApproved ? <CheckIcon className="w-5 h-5 text-green-500" /> : <XMarkIcon className="w-5 h-5 text-red-500" />}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => setSelectedBusiness(user)} className="text-blue-600 hover:text-blue-900">View Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Business Details Modal */}
                {selectedBusiness && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Business Details</h3>
                                <button onClick={() => setSelectedBusiness(null)} className="text-gray-400 hover:text-gray-600">
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Business Name</label>
                                        <p className="text-gray-900">{selectedBusiness.business?.business_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Owner</label>
                                        <p className="text-gray-900">{selectedBusiness.user.firstName} {selectedBusiness.user.lastName}</p>
                                        <p className="text-sm text-gray-500">{selectedBusiness.user.email}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Location</label>
                                        <p className="text-gray-900">{selectedBusiness.business?.location || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Industry</label>
                                        <p className="text-gray-900">{selectedBusiness.business?.industry || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Website</label>
                                        <p className="text-gray-900">{selectedBusiness.business?.website || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Phone</label>
                                        <p className="text-gray-900">{selectedBusiness.business?.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">DNA Approved</label>
                                        <p className={selectedBusiness.business?.isDnaApproved ? 'text-green-600' : 'text-red-600'}>
                                            {selectedBusiness.business?.isDnaApproved ? 'Yes' : 'No'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Profile Complete</label>
                                        <p className={selectedBusiness.business?.is_complete ? 'text-green-600' : 'text-yellow-600'}>
                                            {selectedBusiness.business?.is_complete ? 'Yes' : 'No'}
                                        </p>
                                    </div>
                                </div>
                                {selectedBusiness.business?.description && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Description</label>
                                        <p className="text-gray-900 text-sm">{selectedBusiness.business.description}</p>
                                    </div>
                                )}
                                <div className="flex gap-2 pt-4 border-t">
                                    <button
                                        onClick={() => resetUserDna(selectedBusiness.user.id)}
                                        disabled={updating}
                                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                                    >
                                        Reset DNA
                                    </button>
                                    <button
                                        onClick={() => setSelectedBusiness(null)}
                                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
      case 'users':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">User Management ({users.length})</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trial Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserCircleIcon className="h-8 w-8 text-gray-400" />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.user.firstName} {user.user.lastName}</div>
                            <div className="text-sm text-gray-500">{user.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTrialStatusBadge(user)}
                        {user.billing.trial_end_date && <div className="text-xs text-gray-500 mt-1">Ends: {formatTrialEndDate(user.billing.trial_end_date)}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getSubscriptionBadge(user.billing.subscription_status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.user.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => setSelectedUser(user)} className="text-blue-600 hover:text-blue-900">Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* User Management Modal */}
            {selectedUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Manage User</h3>
                    <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* User Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <UserCircleIcon className="h-12 w-12 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{selectedUser.user.firstName} {selectedUser.user.lastName}</p>
                          <p className="text-sm text-gray-500">{selectedUser.user.email}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {getTrialStatusBadge(selectedUser)}
                        {getSubscriptionBadge(selectedUser.billing.subscription_status)}
                      </div>
                    </div>

                    {/* Extend Trial */}
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Extend Trial</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={newTrialDate}
                          onChange={e => setNewTrialDate(e.target.value)}
                          className="flex-1 p-2 border rounded-lg"
                        />
                        <button
                          onClick={() => handleExtendTrial(selectedUser.user.id)}
                          disabled={updating || !newTrialDate}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          Extend
                        </button>
                      </div>
                    </div>

                    {/* Change Subscription Status */}
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Change Subscription Status</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleUpdateSubscription(selectedUser.user.id, 'active')}
                          disabled={updating}
                          className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
                        >
                          Set Active
                        </button>
                        <button
                          onClick={() => handleUpdateSubscription(selectedUser.user.id, 'canceled')}
                          disabled={updating}
                          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm"
                        >
                          Set Canceled
                        </button>
                        <button
                          onClick={() => handleUpdateSubscription(selectedUser.user.id, 'trialing')}
                          disabled={updating}
                          className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
                        >
                          Set Trialing
                        </button>
                        <button
                          onClick={() => grantFreeAccess(selectedUser.user.id)}
                          disabled={updating}
                          className="bg-purple-500 text-white p-2 rounded-lg hover:bg-purple-600 disabled:opacity-50 text-sm"
                        >
                          Grant Free Access
                        </button>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium text-red-600 mb-2">Danger Zone</label>
                      <button
                        onClick={() => wipeUserData(selectedUser.user.id)}
                        disabled={updating}
                        className="w-full bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        Wipe All User Data
                      </button>
                    </div>

                    {/* Close Button */}
                    <div className="border-t pt-4">
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="w-full bg-gray-300 text-gray-700 p-2 rounded-lg hover:bg-gray-400"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'support':
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Support Tickets ({tickets.length})</h2>
                {isLoadingTickets ? (
                    <div className="text-center py-12 text-gray-500">Loading tickets...</div>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-lg shadow">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tickets.map(ticket => (
                                    <tr key={ticket.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.subject}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.user_email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-xs px-2 py-1 rounded-full ${ticket.status === 'open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.priority}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
      case 'revenue':
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Revenue Metrics (Mock Data)</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700">Monthly Recurring Revenue (MRR)</h3>
                        <p className="text-4xl font-bold text-green-600 mt-2">$1,249</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700">Annual Run Rate (ARR)</h3>
                        <p className="text-4xl font-bold text-green-600 mt-2">$14,988</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700">Churn Rate (Last 30 Days)</h3>
                        <p className="text-4xl font-bold text-red-600 mt-2">2.5%</p>
                    </div>
                </div>
            </div>
        );
      case 'announcements':
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">System Announcements ({announcements.length})</h2>
                    <button
                        onClick={() => setShowAnnouncementForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Create New Announcement
                    </button>
                </div>

                {showAnnouncementForm && (
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">New Announcement</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    value={announcementForm.title}
                                    onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})}
                                    className="w-full mt-1 p-2 border rounded-lg"
                                    placeholder="Announcement title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Message</label>
                                <textarea
                                    value={announcementForm.message}
                                    onChange={e => setAnnouncementForm({...announcementForm, message: e.target.value})}
                                    className="w-full mt-1 p-2 border rounded-lg"
                                    rows={4}
                                    placeholder="Announcement message"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type</label>
                                    <select
                                        value={announcementForm.type}
                                        onChange={e => setAnnouncementForm({...announcementForm, type: e.target.value})}
                                        className="w-full mt-1 p-2 border rounded-lg"
                                    >
                                        <option value="info">Info</option>
                                        <option value="warning">Warning</option>
                                        <option value="success">Success</option>
                                        <option value="error">Error</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Target Audience</label>
                                    <select
                                        value={announcementForm.target_audience}
                                        onChange={e => setAnnouncementForm({...announcementForm, target_audience: e.target.value})}
                                        className="w-full mt-1 p-2 border rounded-lg"
                                    >
                                        <option value="all">All Users</option>
                                        <option value="free">Free Users</option>
                                        <option value="paid">Paid Users</option>
                                        <option value="trial">Trial Users</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Priority (1-5)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={announcementForm.priority}
                                        onChange={e => setAnnouncementForm({...announcementForm, priority: parseInt(e.target.value) || 1})}
                                        className="w-full mt-1 p-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">End Date (optional)</label>
                                    <input
                                        type="date"
                                        value={announcementForm.end_date}
                                        onChange={e => setAnnouncementForm({...announcementForm, end_date: e.target.value})}
                                        className="w-full mt-1 p-2 border rounded-lg"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={createAnnouncement}
                                    disabled={updating}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {updating ? 'Creating...' : 'Create Announcement'}
                                </button>
                                <button
                                    onClick={() => setShowAnnouncementForm(false)}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    {announcements.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">No announcements yet. Create one to get started.</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audience</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {announcements.map((ann: any) => (
                                    <tr key={ann.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{ann.title}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-xs">{ann.message}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                ann.type === 'info' ? 'bg-blue-100 text-blue-800' :
                                                ann.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                ann.type === 'success' ? 'bg-green-100 text-green-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {ann.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ann.target_audience}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${ann.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {ann.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(ann.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => deleteAnnouncement(ann.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
      case 'email':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Email Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700">Today's Stats</h3>
                    <p className="text-4xl font-bold text-blue-600 mt-2">{emailStats.today_sent || 0}</p>
                    <p className="text-sm text-gray-500">Emails Sent Today</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700">Open Rate</h3>
                    <p className="text-4xl font-bold text-green-600 mt-2">{emailStats.open_rate?.toFixed(1) || 0}%</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700">Failed Today</h3>
                    <p className="text-4xl font-bold text-red-600 mt-2">{emailStats.failed_today || 0}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Resend Configuration</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Resend API Key</label>
                        <input type="text" value={emailForm.resend_api_key} onChange={e => setEmailForm({...emailForm, resend_api_key: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" placeholder="sk_resend_..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">From Email</label>
                            <input type="email" value={emailForm.from_email} onChange={e => setEmailForm({...emailForm, from_email: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" placeholder="support@getjetsuite.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">From Name</label>
                            <input type="text" value={emailForm.from_name} onChange={e => setEmailForm({...emailForm, from_name: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" placeholder="JetSuite Support" />
                        </div>
                    </div>
                    <button onClick={saveEmailSettings} disabled={updating} className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {updating ? 'Saving...' : 'Save Email Settings'}
                    </button>
                </div>
            </div>
          </div>
        );
      case 'sms':
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">SMS Settings</h2>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Twilio Configuration</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Twilio Account SID</label>
                            <input type="text" value={smsForm.twilio_account_sid} onChange={e => setSmsForm({...smsForm, twilio_account_sid: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" placeholder="ACxxxxxxxx" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Twilio Auth Token</label>
                            <input type="text" value={smsForm.twilio_auth_token} onChange={e => setSmsForm({...smsForm, twilio_auth_token: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" placeholder="xxxxxxxx" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Twilio Phone Number</label>
                            <input type="text" value={smsForm.twilio_phone_number} onChange={e => setSmsForm({...smsForm, twilio_phone_number: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" placeholder="+15551234567" />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center">
                                <input type="checkbox" checked={smsForm.sms_enabled} onChange={e => setSmsForm({...smsForm, sms_enabled: e.target.checked})} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                                <span className="ml-2 text-sm text-gray-700">SMS Enabled</span>
                            </label>
                            <label className="flex items-center">
                                <input type="checkbox" checked={smsForm.urgent_tickets_sms} onChange={e => setSmsForm({...smsForm, urgent_tickets_sms: e.target.checked})} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                                <span className="ml-2 text-sm text-gray-700">Urgent Ticket SMS Alerts</span>
                            </label>
                        </div>
                        <button onClick={saveSmsSettings} disabled={updating} className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {updating ? 'Saving...' : 'Save SMS Settings'}
                        </button>
                    </div>
                </div>
            </div>
        );
      default:
        return <div>Select a tab to get started.</div>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {message && (
        <div className={`p-4 mb-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
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