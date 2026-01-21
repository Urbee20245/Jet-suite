import React from 'react';

interface FooterProps {
    navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    navigate(path);
  };

  const baseUrl = "https://getjetsuite.com";

  return (
    <footer className="bg-brand-darker border-t border-slate-800">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <img src="/Jetsuitewing.png" alt="JetSuite Logo" className="w-8 h-8" />
          <span className="text-xl font-bold text-white">JetSuite</span>
        </div>
        <div className="mt-4 flex justify-center items-center space-x-6 text-gray-400">
          <a 
            href={`${baseUrl}/privacy`} 
            onClick={(e) => handleNavigation(e, '/privacy')} 
            className="hover:text-white"
          >
            Privacy
          </a>
          <a 
            href={`${baseUrl}/terms`} 
            onClick={(e) => handleNavigation(e, '/terms')} 
            className="hover:text-white"
          >
            Terms
          </a>
          <a 
            href={`${baseUrl}/contact`} 
            onClick={(e) => handleNavigation(e, '/contact')} 
            className="hover:text-white"
          >
            Contact
          </a>
          <a 
            href={`${baseUrl}/login`} 
            onClick={(e) => handleNavigation(e, '/login')} 
            className="hover:text-white"
          >
            Login
          </a>
        </div>
        <p className="mt-8 text-sm text-gray-500">
          © {new Date().getFullYear()} JetSuite by Jet Automations. All rights reserved.
        </p>
      </div>
    </footer>
  );
};