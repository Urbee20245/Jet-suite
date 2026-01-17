import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { isTrialActive, isTrialExpired, formatTrialEndDate } from '../utils/trialHelpers';
import { UserCircleIcon, CalendarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

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

export default function AdminPanel() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [newTrialDate, setNewTrialDate] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

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
        <p className="mt-2 text-gray-600">Manage users, trials, and subscriptions</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

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
    </div>
  );
}
