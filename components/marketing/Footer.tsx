import React from 'react';

interface FooterProps {
    navigate: (path: string) => void;
    isDarkMode?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ navigate, isDarkMode = false }) => {
  const bgClass = isDarkMode ? 'bg-brand-darker border-slate-800' : 'bg-slate-50 border-slate-200';
  const textClass = isDarkMode ? 'text-white' : 'text-slate-900';
  const linkClass = isDarkMode ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-blue-600';
  const copyrightClass = isDarkMode ? 'text-gray-500' : 'text-slate-400';

  return (
    <footer className={`${bgClass} border-t`}>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
        <h3 className={`text-lg font-semibold ${textClass}`}>JetSuite Growth OS</h3>
        <div className={`mt-4 flex justify-center items-center space-x-6`}>
          <button className={linkClass}>Privacy</button>
          <button className={linkClass}>Terms</button>
          <button className={linkClass}>Support</button>
          <button onClick={() => navigate('/login')} className={linkClass}>Login</button>
        </div>
        <p className={`mt-8 text-sm ${copyrightClass}`}>
          © {new Date().getFullYear()} JetSuite by Jet Automations. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
