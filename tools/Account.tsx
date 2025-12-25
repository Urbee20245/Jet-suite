import React, { useState, useEffect } from 'react';
import { MinusIcon, PlusIcon, CheckCircleIcon } from '../components/icons/MiniIcons';

interface AccountPageProps {
  navigate: (path: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ navigate }) => {
  // User data (in real app, fetch from your auth/database)
  const [userData, setUserData] = useState({
    firstName: 'The Ivsight',
    lastName: 'Company',
    email: 'theivsightcompany@gmail.com',
    role: 'Owner',
    isAdmin: true,
  });

  // Current subscription state
  const [currentBusinesses, setCurrentBusinesses] = useState(1);
  const [currentSeats, setCurrentSeats] = useState(0); // 0 additional (1 included)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  // New plan state (for upgrades/downgrades)
  const [newBusinesses, setNewBusinesses] = useState(currentBusinesses);
  const [newSeats, setNewSeats] = useState(currentSeats);
  
  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Pricing constants
  const basePlan = 149;
  const additionalBusinessCost = 49;
  const seatCost = 15;

  // Calculate current plan cost
  const additionalBusinessCount = Math.max(0, currentBusinesses - 1);
  const currentTotal = basePlan + (additionalBusinessCount * additionalBusinessCost) + (currentSeats * seatCost);

  // Calculate new plan cost
  const newAdditionalBusinessCount = Math.max(0, newBusinesses - 1);
  const newTotal = basePlan + (newAdditionalBusinessCount * additionalBusinessCost) + (newSeats * seatCost);

  const handleBusinessChange = (delta: number) => {
    setNewBusinesses(prev => Math.max(1, prev + delta));
  };

  const handleSeatsChange = (delta: number) => {
    setNewSeats(prev => Math.max(0, prev + delta));
  };

  const handleUpdatePlan = async () => {
    setIsProcessing(true);
    
    try {
      // Call your Stripe API to update subscription
      const response = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessCount: newBusinesses,
          seatCount: newSeats,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }

      const data = await response.json();
      
      // Redirect to Stripe Checkout for payment
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Update was successful (maybe downgrade or same price)
        setCurrentBusinesses(newBusinesses);
        setCurrentSeats(newSeats);
        setIsEditing(false);
        alert('Plan updated successfully!');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update plan. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelEdit = () => {
    setNewBusinesses(currentBusinesses);
    setNewSeats(currentSeats);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <h1 className="text-3xl font-bold text-gray-900">Account</h1>
          </div>
          <p className="text-gray-600">Manage your plan, businesses, and team.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plan & Billing */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Plan & Billing</h2>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Current Plan:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">Tier 1</span>
                  {userData.isAdmin && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>{currentBusinesses} business {currentBusinesses > 1 ? 'profiles' : 'profile'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>Full tool access</span>
                </div>
              </div>
            </div>

            {!hasActiveSubscription ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 mb-3">No active subscription found</p>
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                >
                  View Pricing Plans
                </button>
              </div>
            ) : (
              <div>
                {!isEditing ? (
                  <div>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Monthly Total</span>
                        <span className="text-2xl font-bold text-gray-900">${currentTotal}/mo</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                    >
                      Manage Plan
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Configure Plan */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <h3 className="font-semibold text-gray-900 mb-4">Adjust Your Plan</h3>
                      
                      {/* Businesses Selector */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-gray-700">Number of Businesses</label>
                          <span className="text-xs text-gray-500">
                            ${basePlan} base + ${additionalBusinessCost}/mo additional
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => handleBusinessChange(-1)}
                            disabled={newBusinesses <= 1}
                            className="w-12 h-12 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                          >
                            <MinusIcon className="w-5 h-5" />
                          </button>
                          <div className="flex-1 text-center">
                            <div className="text-4xl font-bold text-gray-900">{newBusinesses}</div>
                            <div className="text-xs text-gray-500">
                              {newBusinesses === 1 ? 'Business' : 'Businesses'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleBusinessChange(1)}
                            className="w-12 h-12 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                          >
                            <PlusIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Seats Selector */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-gray-700">Team Seats</label>
                          <span className="text-xs text-gray-500">
                            1 included + ${seatCost}/mo additional
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => handleSeatsChange(-1)}
                            disabled={newSeats <= 0}
                            className="w-12 h-12 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                          >
                            <MinusIcon className="w-5 h-5" />
                          </button>
                          <div className="flex-1 text-center">
                            <div className="text-4xl font-bold text-gray-900">{newSeats}</div>
                            <div className="text-xs text-gray-500">
                              Additional {newSeats === 1 ? 'Seat' : 'Seats'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSeatsChange(1)}
                            className="w-12 h-12 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                          >
                            <PlusIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Pricing Breakdown */}
                      <div className="bg-white rounded-lg p-4 space-y-2 text-sm border border-slate-200">
                        <div className="flex justify-between text-gray-700">
                          <span>Base Plan (includes 1 business, 1 seat)</span>
                          <span className="font-semibold">${basePlan}/mo</span>
                        </div>
                        
                        {newAdditionalBusinessCount > 0 && (
                          <div className="flex justify-between text-gray-700">
                            <span>
                              {newAdditionalBusinessCount === 1 
                                ? '1 Additional Business' 
                                : `${newAdditionalBusinessCount} Additional Businesses`}
                            </span>
                            <span className="font-semibold">${newAdditionalBusinessCount * additionalBusinessCost}/mo</span>
                          </div>
                        )}
                        
                        {newSeats > 0 && (
                          <div className="flex justify-between text-gray-700">
                            <span>
                              {newSeats === 1 
                                ? '1 Additional Seat' 
                                : `${newSeats} Additional Seats`}
                            </span>
                            <span className="font-semibold">${newSeats * seatCost}/mo</span>
                          </div>
                        )}
                        
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="flex justify-between items-baseline">
                            <span className="font-bold text-gray-900">New Monthly Total</span>
                            <span className="text-2xl font-extrabold text-gray-900">
                              ${newTotal}<span className="text-sm font-normal text-gray-500">/mo</span>
                            </span>
                          </div>
                        </div>

                        {newTotal !== currentTotal && (
                          <div className="pt-2 border-t border-gray-200">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Change</span>
                              <span className={newTotal > currentTotal ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                {newTotal > currentTotal ? '+' : ''}{newTotal - currentTotal}/mo
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelEdit}
                        disabled={isProcessing}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdatePlan}
                        disabled={isProcessing || (newBusinesses === currentBusinesses && newSeats === currentSeats)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            {newTotal > currentTotal ? 'Upgrade Plan' : newTotal < currentTotal ? 'Downgrade Plan' : 'Update Plan'}
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Business Profiles */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Business Profiles</h2>
            
            <div className="mb-4">
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-gray-900 mb-1">
                  {hasActiveSubscription ? currentBusinesses : 0}
                </div>
                <div className="text-sm text-gray-500">of Unlimited</div>
              </div>
              
              {!hasActiveSubscription ? (
                <p className="text-sm text-gray-600 text-center mb-4">
                  Your plan includes one business profile.
                </p>
              ) : (
                <p className="text-sm text-gray-600 text-center mb-4">
                  You have {currentBusinesses} business {currentBusinesses > 1 ? 'profiles' : 'profile'}.
                </p>
              )}
            </div>

            {hasActiveSubscription && (
              <div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors mb-2"
                >
                  Add another business
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Additional business profiles are ${additionalBusinessCost}/month.
                </p>
              </div>
            )}
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Team Members</h2>
            
            <div className="mb-4">
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-gray-900 mb-1">
                  {hasActiveSubscription ? currentSeats + 1 : 1}
                </div>
                <div className="text-sm text-gray-500">
                  {hasActiveSubscription ? `of ${currentSeats + 1} included` : 'of 1 included'}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 text-center mb-4">
                Your plan includes one owner user.
              </p>
            </div>

            {/* Current User */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-900">{userData.firstName} {userData.lastName}</div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                    Owner
                  </span>
                  {userData.isAdmin && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-600">{userData.email}</div>
            </div>

            {hasActiveSubscription && (
              <div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors mb-2"
                >
                  Add team member
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Additional team members are ${seatCost}/month per user.<br />
                  Perfect for assistants, marketers, or managers.
                </p>
              </div>
            )}
          </div>

          {/* Account Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Profile</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">First Name</label>
                    <input
                      type="text"
                      value={userData.firstName}
                      onChange={(e) => setUserData({...userData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={userData.lastName}
                      onChange={(e) => setUserData({...userData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title/Role (Optional)</label>
                <input
                  type="text"
                  value={userData.role}
                  onChange={(e) => setUserData({...userData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Account Email</label>
                <div className="text-gray-900 font-medium">{userData.email}</div>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-2">
                <button className="text-purple-600 hover:text-purple-700 font-semibold text-sm">
                  Log Out
                </button>
                <br />
                <button className="text-red-600 hover:text-red-700 font-semibold text-sm">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
