import React from 'react';
import { ExclamationTriangleIcon, LockClosedIcon, ArrowRightIcon } from '../components/icons/MiniIcons';
import { JetSuiteLogo } from '../components/JetSuiteLogo';

interface BillingLockedPageProps {
  navigate: (path: string) => void;
  reason?: string;
  status?: string;
}

/**
 * BillingLockedPage Component
 * 
 * Shown when a logged-in user tries to access the app without an active subscription.
 * Can be accessed via direct navigation (e.g., from SubscriptionGuard callback).
 */
export const BillingLockedPage: React.FC<BillingLockedPageProps> = ({ 
  navigate, 
  reason = 'Your subscription is not active. Please subscribe to continue using JetSuite.',
  status = 'inactive'
}) => {
  const isPastDue = status === 'past_due' || status === 'unpaid';
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-dark p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="inline-block">
            <JetSuiteLogo className="w-16 h-16 mx-auto"/>
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 backdrop-blur-sm border-2 border-red-500/30 p-12 rounded-2xl shadow-2xl text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            {isPastDue ? (
              <ExclamationTriangleIcon className="w-10 h-10 text-yellow-500" />
            ) : (
              <LockClosedIcon className="w-10 h-10 text-red-500" />
            )}
          </div>
          
          {/* Status Badge */}
          <div className="inline-block mb-4 px-4 py-2 bg-white/5 rounded-full">
            <span className="text-sm font-semibold text-gray-300">
              {isPastDue ? '⚠️ Payment Issue' : '🔒 Subscription Required'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-extrabold text-white mb-4">
            {isPastDue ? 'Payment Required' : 'Access Restricted'}
          </h1>

          {/* Reason */}
          <p className="text-lg text-gray-300 mb-8 max-w-md mx-auto">
            {reason}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(isPastDue ? '/account' : '/pricing')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-4 px-8 rounded-xl transition-opacity shadow-lg"
            >
              {isPastDue ? 'Update Payment Method' : 'View Pricing Plans'}
              <ArrowRightIcon className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold py-4 px-8 rounded-xl transition"
            >
              Back to Home
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-sm text-gray-400 mb-2">
              Need help or have questions?
            </p>
            <button
              onClick={() => navigate('/knowledge-base')}
              className="text-accent-purple hover:text-accent-pink font-semibold transition"
            >
              Visit our Knowledge Base →
            </button>
          </div>
        </div>

        {/* Features Reminder */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 text-center">
            With JetSuite, you get:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl mb-2">🚀</div>
              <p className="text-sm text-gray-300 font-semibold">13+ Growth Tools</p>
            </div>
            <div>
              <div className="text-3xl mb-2">💰</div>
              <p className="text-sm text-gray-300 font-semibold">Save $4,000+/month</p>
            </div>
            <div>
              <div className="text-3xl mb-2">⚡</div>
              <p className="text-sm text-gray-300 font-semibold">AI-Powered Automation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
