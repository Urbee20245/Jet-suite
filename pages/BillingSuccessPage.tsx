import React from 'react';

interface BillingSuccessPageProps {
  navigate: (path: string) => void;
}

export const BillingSuccessPage: React.FC<BillingSuccessPageProps> = ({ navigate }) => {
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
            Your payment was successful and your account has been created.
          </p>

          <div className="bg-brand-darker border border-slate-600 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold text-white mb-4">Next Steps:</h2>
            <ol className="space-y-3 text-gray-300">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-accent-purple/20 text-accent-purple rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                <span>Check your email for your login credentials</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-accent-purple/20 text-accent-purple rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                <span>Click the button below to log in to your account</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-accent-purple/20 text-accent-purple rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                <span>Complete your business profile and start growing!</span>
              </li>
            </ol>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-4 px-12 rounded-lg transition-opacity text-lg shadow-lg"
          >
            Go to Login
          </button>

          <p className="text-sm text-gray-500 mt-6">
            Need help? Contact us at support@jetsuite.com
          </p>
        </div>
      </div>
    </div>
  );
};
