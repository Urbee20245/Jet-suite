import React, { useState, useEffect } from 'react';

interface BillingSuccessPageProps {
  navigate: (path: string) => void;
}

export const BillingSuccessPage: React.FC<BillingSuccessPageProps> = ({ navigate }) => {
  const [isVerifying, setIsVerifying] = useState(true);

  // Add a 3-second buffer to allow the Stripe Webhook to complete its trip to the DB
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVerifying(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-brand-card border border-slate-700 rounded-2xl p-12 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to JetSuite!
          </h1>
          
          <p className="text-xl text-gray-300 mb-8">
            Your payment was successful and your account is being activated.
          </p>

          <div className="bg-brand-darker border border-slate-600 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold text-white mb-4">What happens next:</h2>
            <ol className="space-y-3 text-gray-300">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-accent-purple/20 text-accent-purple rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                <span>We are synchronizing your subscription with your profile</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-accent-purple/20 text-accent-purple rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                <span>You'll get a confirmation email with your billing receipt</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-accent-purple/20 text-accent-purple rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                <span>Click the button below to start building your foundation</span>
              </li>
            </ol>
          </div>

          {isVerifying ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-purple"></div>
              <p className="text-accent-purple font-semibold animate-pulse">Finalizing Account Verification...</p>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-4 px-12 rounded-lg transition-opacity text-lg shadow-lg"
            >
              Go to Dashboard
            </button>
          )}

          <p className="text-sm text-gray-500 mt-6">
            Need help? Contact us at support@getjetsuite.com
          </p>
        </div>
      </div>
    </div>
  );
};