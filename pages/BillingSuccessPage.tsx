import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, ArrowRightIcon } from '../components/icons/MiniIcons';
import { JetSuiteLogo } from '../components/JetSuiteLogo';

interface BillingSuccessPageProps {
  navigate: (path: string) => void;
}

export const BillingSuccessPage: React.FC<BillingSuccessPageProps> = ({ navigate }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Get session_id from URL query params
    const params = new URLSearchParams(window.location.search);
    const id = params.get('session_id');
    setSessionId(id);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-dark p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="inline-block">
            <JetSuiteLogo className="w-16 h-16 mx-auto"/>
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 backdrop-blur-sm border-2 border-green-500/30 p-12 rounded-2xl shadow-2xl text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="w-12 h-12 text-white" />
          </div>
          
          {/* Success Message */}
          <h1 className="text-4xl font-extrabold text-white mb-4">
            Welcome to JetSuite! 🎉
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Your subscription is now active. Let's get started!
          </p>

          {/* What Happens Next */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-8 text-left">
            <h2 className="text-lg font-bold text-white mb-4">What happens next:</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300 text-sm">
                  <strong className="text-white">Your account is activated</strong> - Full access to all 13+ tools
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300 text-sm">
                  <strong className="text-white">Email confirmation sent</strong> - Check your inbox for receipt
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300 text-sm">
                  <strong className="text-white">Manage billing anytime</strong> - Update plan, payment method, or cancel from Account
                </p>
              </div>
            </div>
          </div>

          {/* Session ID (for debugging) */}
          {sessionId && (
            <div className="mb-6 p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-gray-400">
                Session ID: <span className="font-mono">{sessionId}</span>
              </p>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-4 px-8 rounded-xl transition-opacity shadow-lg text-lg"
            >
              Go to Dashboard
              <ArrowRightIcon className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => navigate('/account')}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold py-4 px-8 rounded-xl transition"
            >
              View Billing Details
            </button>
          </div>

          {/* Cancellation Policy */}
          <p className="mt-6 text-sm text-gray-400 text-center">
            Cancel anytime from your account settings. No refunds.
          </p>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 mb-2">
            Need help getting started?
          </p>
          <button
            onClick={() => navigate('/knowledge-base')}
            className="text-accent-purple hover:text-accent-pink font-semibold transition"
          >
            Check out our Knowledge Base →
          </button>
        </div>
      </div>
    </div>
  );
};
