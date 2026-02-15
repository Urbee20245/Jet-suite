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
import type { EmailSettings, SMSSettings, UpdateEmailSettingsRequest, UpdateSMSSettingsRequest, AdminInboxMessage } from '../Types/emailTypes';
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

type TabType = 'overview' | 'businesses' | 'users' | 'support' | 'revenue' | 'announcements' | 'email' | 'sms' | 'inbox' | 'settings';

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

  // Send email form state
  const [sendEmailForm, setSendEmailForm] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailRecipientType, setEmailRecipientType] = useState<'custom' | 'user' | 'all'>('custom');
  const [selectedEmailUserId, setSelectedEmailUserId] = useState('');

  // Send SMS form state
  const [sendSmsForm, setSendSmsForm] = useState({
    to: '',
    message: ''
  });
  const [sendingSms, setSendingSms] = useState(false);
  const [smsRecipientType, setSmsRecipientType] = useState<'custom' | 'user' | 'all'>('custom');
  const [selectedSmsUserId, setSelectedSmsUserId] = useState('');

  // Cal.com settings state
  const [calcomForm, setCalcomForm] = useState({ calcom_api_key: '', calcom_event_id: '' });
  const [calcomLoaded, setCalcomLoaded] = useState(false);

  // Inbox state
  const [inboxMessages, setInboxMessages] = useState<AdminInboxMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<AdminInboxMessage | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

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
          loadUsers(); // Load users for recipient selection
          break;
        case 'sms':
          loadSmsSettings();
          loadUsers(); // Load users for recipient selection
          break;
        case 'support':
          loadTickets();
          break;
        case 'announcements':
          loadAnnouncements();
          break;
        case 'inbox':
          loadInboxMessages();
          break;
        case 'settings':
          loadCalcomSettings();
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
      const response = await fetch('/api/admin/email-settings', {
        headers: { 'x-user-email': 'theivsightcompany@gmail.com' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error loading email settings:', errorData.error);
        setLoading(false);
        return;
      }

      const { settings, stats } = await response.json();

      if (settings) {
        setEmailSettings(settings);
        setEmailForm({
          resend_api_key: settings.resend_api_key || '',
          from_email: settings.from_email || '',
          from_name: settings.from_name || '',
          reply_to_email: settings.reply_to_email || '',
          forward_to_email: settings.forward_to_email || '',
          forward_enabled: settings.forward_enabled || false,
          auto_reply_enabled: settings.auto_reply_enabled || false,
          auto_reply_message: settings.auto_reply_message || '',
          default_signature: settings.default_signature || '',
          daily_email_limit: settings.daily_email_limit || 100,
          hourly_email_limit: settings.hourly_email_limit || 20
        });
      }

      // Set stats from API response
      setEmailStats({
        sent_today: stats?.sent_today || 0,
        sent_this_month: stats?.sent_today || 0,
        failed_today: stats?.failed_today || 0,
        total_sent: stats?.sent_today || 0,
        today_sent: stats?.sent_today || 0,
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
      const response = await fetch('/api/admin/sms-settings', {
        headers: { 'x-user-email': 'theivsightcompany@gmail.com' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error loading SMS settings:', errorData.error);
        setLoading(false);
        return;
      }

      const { settings } = await response.json();

      if (settings) {
        setSmsSettings(settings);
        setSmsForm({
          twilio_account_sid: settings.twilio_account_sid || '',
          twilio_auth_token: settings.twilio_auth_token || '',
          twilio_phone_number: settings.twilio_phone_number || '',
          sms_enabled: settings.sms_enabled || false,
          urgent_tickets_sms: settings.urgent_tickets_sms || false,
          daily_sms_limit: settings.daily_sms_limit || 50,
          hourly_sms_limit: settings.hourly_sms_limit || 10
        });
      }
    } catch (error: any) {
      console.error('Error loading SMS settings:', error);
    }
    setLoading(false);
  };

  const loadCalcomSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/calcom-settings', {
        headers: { 'x-user-email': 'theivsightcompany@gmail.com' }
      });
      if (response.ok) {
        const { settings } = await response.json();
        if (settings) {
          setCalcomForm({
            calcom_api_key: settings.calcom_api_key || '',
            calcom_event_id: settings.calcom_event_id || ''
          });
        }
        setCalcomLoaded(true);
      }
    } catch (error: any) {
      console.error('Error loading Cal.com settings:', error);
    }
    setLoading(false);
  };

  const loadInboxMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/inbox', {
        headers: { 'x-user-email': 'theivsightcompany@gmail.com' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error loading inbox messages:', errorData.error);
        showMessage('error', 'Failed to load inbox messages');
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success && data.messages) {
        setInboxMessages(data.messages);
      }
    } catch (error: any) {
      console.error('Error loading inbox messages:', error);
      showMessage('error', 'Failed to load inbox messages due to network error');
    }
    setLoading(false);
  };

  const deleteInboxMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this email?')) {
      return;
    }

    setDeletingMessageId(messageId);
    try {
      const response = await fetch(`/api/admin/inbox?id=${messageId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': 'theivsightcompany@gmail.com' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        showMessage('error', errorData.error || 'Failed to delete email');
        setDeletingMessageId(null);
        return;
      }

      const data = await response.json();
      if (data.success) {
        showMessage('success', 'Email deleted successfully');
        // Remove from local state
        setInboxMessages(prev => prev.filter(msg => msg.id !== messageId));
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
        }
      }
    } catch (error: any) {
      console.error('Error deleting email:', error);
      showMessage('error', 'Failed to delete email due to network error');
    }
    setDeletingMessageId(null);
  };

  const saveCalcomSettings = async () => {
    setUpdating(true);
    try {
      const response = await fetch('/api/admin/calcom-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'theivsightcompany@gmail.com'
        },
        body: JSON.stringify(calcomForm)
      });
      if (response.ok) {
        showMessage('success', 'Cal.com settings saved successfully!');
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.error || 'Failed to save Cal.com settings');
      }
    } catch (error: any) {
      showMessage('error', 'Failed to save Cal.com settings');
    }
    setUpdating(false);
  };

  const loadTickets = async () => {
    setIsLoadingTickets(true);
    try {
        const result = await supportService.getAllTickets();
        if (result.success) {
            setTickets(result.data || []);
        } else {
            console.error('Error fetching all tickets:', (result as any).error);
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
      const response = await fetch('/api/admin/email-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'theivsightcompany@gmail.com'
        },
        body: JSON.stringify(emailForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        showMessage('error', errorData.error || 'Failed to save email settings');
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
      const response = await fetch('/api/admin/sms-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'theivsightcompany@gmail.com'
        },
        body: JSON.stringify(smsForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        showMessage('error', errorData.error || 'Failed to save SMS settings');
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

  const sendEmail = async () => {
    if (!sendEmailForm.subject || !sendEmailForm.body) {
      showMessage('error', 'Please fill in subject and message');
      return;
    }

    // Determine recipients based on recipient type
    let recipients: string[] = [];
    if (emailRecipientType === 'custom') {
      if (!sendEmailForm.to) {
        showMessage('error', 'Please enter an email address');
        return;
      }
      recipients = [sendEmailForm.to];
    } else if (emailRecipientType === 'user') {
      if (!selectedEmailUserId) {
        showMessage('error', 'Please select a user');
        return;
      }
      const user = users.find(u => u.user.id === selectedEmailUserId);
      if (!user) {
        showMessage('error', 'User not found');
        return;
      }
      recipients = [user.user.email];
    } else if (emailRecipientType === 'all') {
      recipients = users.map(u => u.user.email).filter(Boolean);
      if (recipients.length === 0) {
        showMessage('error', 'No users with email addresses found');
        return;
      }
    }

    setSendingEmail(true);
    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'theivsightcompany@gmail.com'
        },
        body: JSON.stringify({
          to: recipients,
          subject: sendEmailForm.subject,
          body: sendEmailForm.body
        })
      });

      if (response.ok) {
        const recipientCount = recipients.length;
        showMessage('success', `Email sent successfully to ${recipientCount} recipient${recipientCount > 1 ? 's' : ''}!`);
        setSendEmailForm({ to: '', subject: '', body: '' });
        setEmailRecipientType('custom');
        setSelectedEmailUserId('');
      } else {
        const data = await response.json();
        showMessage('error', data.error || 'Failed to send email');
      }
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to send email');
    }
    setSendingEmail(false);
  };

  const sendSms = async () => {
    if (!sendSmsForm.message) {
      showMessage('error', 'Please enter a message');
      return;
    }

    // Determine recipients based on recipient type
    let recipients: string[] = [];
    if (smsRecipientType === 'custom') {
      if (!sendSmsForm.to) {
        showMessage('error', 'Please enter a phone number');
        return;
      }
      recipients = [sendSmsForm.to];
    } else if (smsRecipientType === 'user') {
      if (!selectedSmsUserId) {
        showMessage('error', 'Please select a user');
        return;
      }
      const user = users.find(u => u.user.id === selectedSmsUserId);
      if (!user || !user.business?.phone) {
        showMessage('error', 'Selected user does not have a phone number');
        return;
      }
      recipients = [user.business.phone];
    } else if (smsRecipientType === 'all') {
      recipients = users.map(u => u.business?.phone).filter(Boolean);
      if (recipients.length === 0) {
        showMessage('error', 'No users with phone numbers found');
        return;
      }
    }

    setSendingSms(true);
    let successCount = 0;
    let failCount = 0;

    // Send SMS to each recipient (Twilio sends one at a time)
    for (const recipient of recipients) {
      try {
        const response = await fetch('/api/admin/send-sms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': 'theivsightcompany@gmail.com'
          },
          body: JSON.stringify({
            to: recipient,
            message: sendSmsForm.message
          })
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    if (successCount > 0) {
      showMessage('success', `SMS sent to ${successCount} recipient${successCount > 1 ? 's' : ''}${failCount > 0 ? ` (${failCount} failed)` : ''}!`);
      setSendSmsForm({ to: '', message: '' });
      setSmsRecipientType('custom');
      setSelectedSmsUserId('');
    } else {
      showMessage('error', 'Failed to send SMS to any recipients');
    }
    setSendingSms(false);
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
        // Calculate real revenue metrics
        const activeUsers = users.filter(u => u.billing.subscription_status === 'active');
        const baseMRR = activeUsers.length * 97; // Founder pricing base
        const businessAddonMRR = users.reduce((acc, u) => {
          if (u.billing.subscription_status === 'active') {
            const extraBusinesses = Math.max(0, (u.billing.business_count || 0) - 1);
            return acc + (extraBusinesses * 49);
          }
          return acc;
        }, 0);
        const seatMRR = users.reduce((acc, u) => {
          if (u.billing.subscription_status === 'active') {
            const extraSeats = Math.max(0, (u.billing.seat_count || 0) - 1);
            return acc + (extraSeats * 15);
          }
          return acc;
        }, 0);
        const totalMRR = baseMRR + businessAddonMRR + seatMRR;
        const ARR = totalMRR * 12;

        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Revenue Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700">Monthly Recurring Revenue (MRR)</h3>
                        <p className="text-4xl font-bold text-green-600 mt-2">${totalMRR.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Base: ${baseMRR} | Businesses: ${businessAddonMRR} | Seats: ${seatMRR}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700">Annual Run Rate (ARR)</h3>
                        <p className="text-4xl font-bold text-green-600 mt-2">${ARR.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 mt-2">Based on {activeUsers.length} active subscriptions</p>
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
            {/* Environment Variables Required */}
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-amber-800 mb-3">Required Environment Variables</h3>
                <p className="text-sm text-amber-700 mb-4">Set these in your Vercel project settings (Settings → Environment Variables):</p>
                <div className="bg-white rounded-lg p-4 font-mono text-sm space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-purple-600 font-semibold">RESEND_API_KEY</span>
                        <span className="text-gray-500">= your Resend API key (starts with re_)</span>
                    </div>
                </div>
                <p className="text-xs text-amber-600 mt-3">Get your API key from <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">resend.com/api-keys</a></p>
            </div>

            {/* Email Configuration */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Email Configuration</h3>
                <div className="space-y-4">
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
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Reply-To Email</label>
                            <input type="email" value={emailForm.reply_to_email} onChange={e => setEmailForm({...emailForm, reply_to_email: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" placeholder="reply@getjetsuite.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Forward To Email</label>
                            <input type="email" value={emailForm.forward_to_email} onChange={e => setEmailForm({...emailForm, forward_to_email: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" placeholder="admin@getjetsuite.com" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Daily Email Limit</label>
                            <input type="number" value={emailForm.daily_email_limit} onChange={e => setEmailForm({...emailForm, daily_email_limit: parseInt(e.target.value) || 100})} className="w-full mt-1 p-2 border rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Hourly Email Limit</label>
                            <input type="number" value={emailForm.hourly_email_limit} onChange={e => setEmailForm({...emailForm, hourly_email_limit: parseInt(e.target.value) || 20})} className="w-full mt-1 p-2 border rounded-lg" />
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <label className="flex items-center">
                            <input type="checkbox" checked={emailForm.forward_enabled} onChange={e => setEmailForm({...emailForm, forward_enabled: e.target.checked})} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                            <span className="ml-2 text-sm text-gray-700">Enable Forwarding</span>
                        </label>
                        <label className="flex items-center">
                            <input type="checkbox" checked={emailForm.auto_reply_enabled} onChange={e => setEmailForm({...emailForm, auto_reply_enabled: e.target.checked})} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                            <span className="ml-2 text-sm text-gray-700">Enable Auto-Reply</span>
                        </label>
                    </div>
                    {emailForm.auto_reply_enabled && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Auto-Reply Message</label>
                            <textarea value={emailForm.auto_reply_message} onChange={e => setEmailForm({...emailForm, auto_reply_message: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" rows={3} placeholder="Thank you for contacting us..." />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Default Signature</label>
                        <textarea value={emailForm.default_signature} onChange={e => setEmailForm({...emailForm, default_signature: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" rows={2} placeholder="Best regards, JetSuite Team" />
                    </div>
                    <button onClick={saveEmailSettings} disabled={updating} className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {updating ? 'Saving...' : 'Save Email Settings'}
                    </button>
                </div>
            </div>

            {/* Send Email */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Send Email</h3>
                <div className="space-y-4">
                    {/* Recipient Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="emailRecipientType"
                                    checked={emailRecipientType === 'custom'}
                                    onChange={() => setEmailRecipientType('custom')}
                                    className="h-4 w-4 text-blue-600 border-gray-300"
                                />
                                <span className="ml-2 text-sm text-gray-700">Custom Email</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="emailRecipientType"
                                    checked={emailRecipientType === 'user'}
                                    onChange={() => setEmailRecipientType('user')}
                                    className="h-4 w-4 text-blue-600 border-gray-300"
                                />
                                <span className="ml-2 text-sm text-gray-700">Specific User</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="emailRecipientType"
                                    checked={emailRecipientType === 'all'}
                                    onChange={() => setEmailRecipientType('all')}
                                    className="h-4 w-4 text-blue-600 border-gray-300"
                                />
                                <span className="ml-2 text-sm text-gray-700">All Users ({users.length})</span>
                            </label>
                        </div>
                    </div>

                    {/* Custom Email Input */}
                    {emailRecipientType === 'custom' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input
                                type="email"
                                value={sendEmailForm.to}
                                onChange={e => setSendEmailForm({...sendEmailForm, to: e.target.value})}
                                className="w-full mt-1 p-2 border rounded-lg"
                                placeholder="recipient@example.com"
                            />
                        </div>
                    )}

                    {/* User Selection Dropdown */}
                    {emailRecipientType === 'user' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Select User</label>
                            <select
                                value={selectedEmailUserId}
                                onChange={e => setSelectedEmailUserId(e.target.value)}
                                className="w-full mt-1 p-2 border rounded-lg"
                            >
                                <option value="">-- Select a user --</option>
                                {users.map(u => (
                                    <option key={u.user.id} value={u.user.id}>
                                        {u.user.firstName} {u.user.lastName} ({u.user.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* All Users Info */}
                    {emailRecipientType === 'all' && (
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                            <p className="text-sm text-blue-800">
                                This will send the email to all {users.length} users in the system.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Subject</label>
                        <input
                            type="text"
                            value={sendEmailForm.subject}
                            onChange={e => setSendEmailForm({...sendEmailForm, subject: e.target.value})}
                            className="w-full mt-1 p-2 border rounded-lg"
                            placeholder="Email subject"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Message (HTML supported)</label>
                        <textarea
                            value={sendEmailForm.body}
                            onChange={e => setSendEmailForm({...sendEmailForm, body: e.target.value})}
                            className="w-full mt-1 p-2 border rounded-lg"
                            rows={6}
                            placeholder="Enter your email message here..."
                        />
                    </div>
                    <button
                        onClick={sendEmail}
                        disabled={sendingEmail}
                        className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <EnvelopeIcon className="w-5 h-5" />
                        {sendingEmail ? 'Sending...' : emailRecipientType === 'all' ? `Send Email to All (${users.length})` : 'Send Email'}
                    </button>
                </div>
            </div>
          </div>
        );
      case 'sms':
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">SMS Settings</h2>

                {/* Environment Variables Required */}
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-amber-800 mb-3">Required Environment Variables</h3>
                    <p className="text-sm text-amber-700 mb-4">Set these in your Vercel project settings (Settings → Environment Variables):</p>
                    <div className="bg-white rounded-lg p-4 font-mono text-sm space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-purple-600 font-semibold">TWILIO_ACCOUNT_SID</span>
                            <span className="text-gray-500">= your Twilio Account SID (starts with AC)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-purple-600 font-semibold">TWILIO_AUTH_TOKEN</span>
                            <span className="text-gray-500">= your Twilio Auth Token</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-purple-600 font-semibold">TWILIO_PHONE_NUMBER</span>
                            <span className="text-gray-500">= your Twilio phone number (+1XXXXXXXXXX)</span>
                        </div>
                    </div>
                    <p className="text-xs text-amber-600 mt-3">Get your credentials from <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="underline">console.twilio.com</a></p>
                </div>

                {/* SMS Configuration */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">SMS Configuration</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Daily SMS Limit</label>
                                <input type="number" value={smsForm.daily_sms_limit} onChange={e => setSmsForm({...smsForm, daily_sms_limit: parseInt(e.target.value) || 50})} className="w-full mt-1 p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Hourly SMS Limit</label>
                                <input type="number" value={smsForm.hourly_sms_limit} onChange={e => setSmsForm({...smsForm, hourly_sms_limit: parseInt(e.target.value) || 10})} className="w-full mt-1 p-2 border rounded-lg" />
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
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

                {/* Send SMS */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Send SMS</h3>
                    <div className="space-y-4">
                        {/* Recipient Type Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
                            <div className="flex gap-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="smsRecipientType"
                                        checked={smsRecipientType === 'custom'}
                                        onChange={() => setSmsRecipientType('custom')}
                                        className="h-4 w-4 text-blue-600 border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Custom Number</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="smsRecipientType"
                                        checked={smsRecipientType === 'user'}
                                        onChange={() => setSmsRecipientType('user')}
                                        className="h-4 w-4 text-blue-600 border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Specific User</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="smsRecipientType"
                                        checked={smsRecipientType === 'all'}
                                        onChange={() => setSmsRecipientType('all')}
                                        className="h-4 w-4 text-blue-600 border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">All Users with Phone ({users.filter(u => u.business?.phone).length})</span>
                                </label>
                            </div>
                        </div>

                        {/* Custom Phone Input */}
                        {smsRecipientType === 'custom' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                <input
                                    type="tel"
                                    value={sendSmsForm.to}
                                    onChange={e => setSendSmsForm({...sendSmsForm, to: e.target.value})}
                                    className="w-full mt-1 p-2 border rounded-lg"
                                    placeholder="+1234567890 or 1234567890"
                                />
                                <p className="text-xs text-gray-500 mt-1">Include country code or it will default to +1 (US)</p>
                            </div>
                        )}

                        {/* User Selection Dropdown */}
                        {smsRecipientType === 'user' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Select User</label>
                                <select
                                    value={selectedSmsUserId}
                                    onChange={e => setSelectedSmsUserId(e.target.value)}
                                    className="w-full mt-1 p-2 border rounded-lg"
                                >
                                    <option value="">-- Select a user --</option>
                                    {users.filter(u => u.business?.phone).map(u => (
                                        <option key={u.user.id} value={u.user.id}>
                                            {u.user.firstName} {u.user.lastName} ({u.business?.phone})
                                        </option>
                                    ))}
                                </select>
                                {users.filter(u => u.business?.phone).length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">No users have phone numbers in their business profile.</p>
                                )}
                            </div>
                        )}

                        {/* All Users Info */}
                        {smsRecipientType === 'all' && (
                            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    This will send an SMS to {users.filter(u => u.business?.phone).length} users who have phone numbers in their business profiles.
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Message</label>
                            <textarea
                                value={sendSmsForm.message}
                                onChange={e => setSendSmsForm({...sendSmsForm, message: e.target.value})}
                                className="w-full mt-1 p-2 border rounded-lg"
                                rows={4}
                                placeholder="Enter your SMS message here..."
                                maxLength={1600}
                            />
                            <p className="text-xs text-gray-500 mt-1">{sendSmsForm.message.length}/1600 characters</p>
                        </div>
                        <button
                            onClick={sendSms}
                            disabled={sendingSms}
                            className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <DevicePhoneMobileIcon className="w-5 h-5" />
                            {sendingSms ? 'Sending...' : smsRecipientType === 'all' ? `Send SMS to All (${users.filter(u => u.business?.phone).length})` : 'Send SMS'}
                        </button>
                    </div>
                </div>
            </div>
        );
      case 'inbox':
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Support Inbox</h2>
                    <button
                        onClick={() => loadInboxMessages()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <EnvelopeIcon className="w-5 h-5" />
                        Refresh
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                        <p className="text-sm text-gray-600">
                            Emails sent to <span className="font-semibold">support@getjetsuite.com</span> ({inboxMessages.length} messages)
                        </p>
                    </div>

                    {inboxMessages.length === 0 ? (
                        <div className="p-8 text-center">
                            <EnvelopeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No messages in inbox</p>
                            <p className="text-sm text-gray-400 mt-2">Configure Resend webhook to receive emails</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {inboxMessages.map(message => (
                                <div
                                    key={message.id}
                                    className="p-4 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setSelectedMessage(message)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900">
                                                    {message.from_name || message.from_email}
                                                </h3>
                                                {!message.read && (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600">{message.from_email}</p>
                                            <p className="text-sm font-medium text-gray-900 mt-1">
                                                {message.subject || '(No subject)'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(message.received_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteInboxMessage(message.id);
                                            }}
                                            disabled={deletingMessageId === message.id}
                                            className="ml-4 text-red-600 hover:text-red-800 disabled:opacity-50"
                                        >
                                            {deletingMessageId === message.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Email Detail Modal */}
                {selectedMessage && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            {selectedMessage.subject || '(No subject)'}
                                        </h3>
                                        <div className="mt-2 space-y-1">
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">From:</span> {selectedMessage.from_name || selectedMessage.from_email} &lt;{selectedMessage.from_email}&gt;
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">To:</span> {selectedMessage.to_email}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Date:</span> {new Date(selectedMessage.received_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedMessage(null)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                {selectedMessage.html_body ? (
                                    <div
                                        className="prose max-w-none"
                                        dangerouslySetInnerHTML={{ __html: selectedMessage.html_body }}
                                    />
                                ) : (
                                    <div className="whitespace-pre-wrap text-gray-900">
                                        {selectedMessage.text_body || '(No content)'}
                                    </div>
                                )}
                            </div>
                            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        deleteInboxMessage(selectedMessage.id);
                                        setSelectedMessage(null);
                                    }}
                                    disabled={deletingMessageId === selectedMessage.id}
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {deletingMessageId === selectedMessage.id ? 'Deleting...' : 'Delete Email'}
                                </button>
                                <button
                                    onClick={() => setSelectedMessage(null)}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
      case 'settings':
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">Platform Settings</h2>

                {/* Cal.com Integration */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-blue-100 p-2.5 rounded-lg">
                            <CalendarIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700">Cal.com Integration</h3>
                            <p className="text-sm text-gray-500">Connect your Cal.com calendar for demo scheduling on the marketing site.</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">Setup Instructions</h4>
                        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                            <li>Go to <a href="https://app.cal.com/settings/developer/api-keys" target="_blank" rel="noopener noreferrer" className="underline font-medium">Cal.com API Keys</a> and create/copy your API key</li>
                            <li>Go to <a href="https://app.cal.com/event-types" target="_blank" rel="noopener noreferrer" className="underline font-medium">Cal.com Event Types</a> and click on the event you want for demos</li>
                            <li>Look at the URL — it will look like: <code className="bg-blue-100 px-1 rounded">app.cal.com/event-types/123456</code></li>
                            <li>The number at the end (e.g., <code className="bg-blue-100 px-1 rounded">123456</code>) is your <strong>Event Type ID</strong></li>
                        </ol>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cal.com API Key</label>
                            <input
                                type="password"
                                value={calcomForm.calcom_api_key}
                                onChange={e => setCalcomForm({ ...calcomForm, calcom_api_key: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="cal_live_xxxxxxxxxxxxxxxx"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Your Cal.com API key — found under Settings → Developer → API Keys
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cal.com Event Type ID</label>
                            <input
                                type="text"
                                value={calcomForm.calcom_event_id}
                                onChange={e => setCalcomForm({ ...calcomForm, calcom_event_id: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="123456"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                The numeric ID of your event type — found in the URL when editing an event type (e.g., <code className="bg-gray-100 px-1 rounded">app.cal.com/event-types/<strong>123456</strong></code>)
                            </p>
                        </div>
                        <div className="flex items-center gap-4 pt-2">
                            <button
                                onClick={saveCalcomSettings}
                                disabled={updating}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                            >
                                {updating ? 'Saving...' : 'Save Cal.com Settings'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Demo Page Preview */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Schedule Demo Page</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Your Cal.com availability is shown as a native calendar on the public Schedule Demo page. Visitors who click "Schedule a Personalized Demo" on the marketing site will be directed to this page.
                    </p>
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${calcomForm.calcom_api_key && calcomForm.calcom_event_id ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            <div className={`w-2 h-2 rounded-full ${calcomForm.calcom_api_key && calcomForm.calcom_event_id ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                            {calcomForm.calcom_api_key && calcomForm.calcom_event_id ? 'Cal.com Connected' : 'Not Configured - Fallback form active'}
                        </div>
                        <a
                            href="/schedule-demo"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                        >
                            View Demo Page
                        </a>
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
          {(['overview', 'businesses', 'users', 'support', 'revenue', 'announcements', 'email', 'sms', 'inbox', 'settings'] as TabType[]).map(tab => (
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