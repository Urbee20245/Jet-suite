import React from 'react';
import { ExclamationTriangleIcon, LockClosedIcon, ArrowRightIcon, ArrowRightStartOnRectangleIcon } from '../components/icons/MiniIcons';
import { JetSuiteLogo } from '../components/JetSuiteLogo';

interface BillingLockedPageProps {
  navigate: (path: string) => void;
  onLogout?: () => void;
  reason?: string;
  status?: string;
}

/**
 * BillingLockedPage Component
 * 
 * Shown when a logged-in user tries to access the app without an active subscription.
 */
export const BillingLockedPage: React.FC<BillingLockedPageProps> = ({ 
  navigate, 
  onLogout,
  reason = 'Your subscription is not active. Please subscribe to continue using JetSuite.',
  status = 'inactive'
}) => {
  const isPastDue = status === 'past_due' || status === 'unpaid';
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-dark p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="inline-block transition-transform hover:scale-105">
            <JetSuiteLogo className="w-16 h-16 mx-auto"/>
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-slate-900 to-brand-darker border-2 border-slate-700 p-8 sm:p-12 rounded-2xl shadow-2xl text-center relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent-purple/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent-pink/10 rounded-full blur-3xl"></div>

          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
            {isPastDue ? (
              <ExclamationTriangleIcon className="w-10 h-10 text-yellow-500" />
            ) : (
              <LockClosedIcon className="w-10 h-10 text-red-500" />
            )}
          </div>
          
          {/* Status Badge */}
          <div className="inline-block mb-4 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <span className="text-sm font-semibold text-gray-300">
              {isPastDue ? '⚠️ Payment Issue' : '🔒 Subscription Required'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-extrabold text-white mb-4">
            {isPastDue ? 'Payment Required' : 'Access Restricted'}
          </h1>

          {/* Reason */}
          <p className="text-lg text-gray-400 mb-8 max-w-md mx-auto">
            {reason}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => navigate(isPastDue ? '/account' : '/pricing')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-accent-purple/20 text-lg"
            >
              {isPastDue ? 'Update Payment Method' : 'View Pricing Plans'}
              <ArrowRightIcon className="w-5 h-5" />
            </button>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3 px-6 rounded-xl transition"
              >
                ← Back to Home
              </button>
              
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold py-3 px-6 rounded-xl transition"
                >
                  <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
                  Sign Out
                </button>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-sm text-gray-500 mb-2">
              Looking for quick answers?
            </p>
            <button
              onClick={() => navigate('/faq')}
              className="text-accent-purple hover:text-accent-pink font-semibold transition-colors"
            >
              Check out our FAQ →
            </button>
          </div>
        </div>

        {/* Support Link */}
        <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
                Having trouble? <button onClick={() => navigate('/contact')} className="text-gray-400 hover:text-white underline">Contact support</button>
            </p>
        </div>
      </div>
    </div>
  );
};