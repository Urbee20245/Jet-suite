import React from 'react';

interface NotFoundPageProps {
  navigate?: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ navigate }) => {
  const handleGoHome = () => {
    if (navigate) {
      navigate('/');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/Jetsuitewing.png" alt="JetSuite" className="w-20 h-20" />
        </div>

        {/* 404 Text */}
        <div className="mb-6">
          <h1 className="text-9xl font-bold text-accent-purple mb-4">404</h1>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Illustration or Icon */}
        <div className="mb-8">
          <svg 
            className="w-64 h-64 mx-auto text-slate-700" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGoHome}
            className="px-8 py-4 bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold rounded-lg transition-opacity text-lg shadow-lg"
          >
            ← Back to Home
          </button>
          
          <a
            href="/pricing"
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors text-lg border border-slate-600"
          >
            View Pricing
          </a>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-slate-700">
          <p className="text-sm text-gray-500 mb-4">Maybe these can help:</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="/" className="text-accent-purple hover:text-accent-pink transition-colors">
              Home
            </a>
            <a href="/features" className="text-accent-purple hover:text-accent-pink transition-colors">
              Features
            </a>
            <a href="/how-it-works" className="text-accent-purple hover:text-accent-pink transition-colors">
              How It Works
            </a>
            <a href="/faq" className="text-accent-purple hover:text-accent-pink transition-colors">
              FAQ
            </a>
            <a href="/login" className="text-accent-purple hover:text-accent-pink transition-colors">
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};