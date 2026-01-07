import React, { useState } from 'react';
import {
  Menu,
  X,
  Zap,
  Rocket,
  ChevronDown,
  LayoutDashboard,
  Workflow,
  DollarSign,
  HelpCircle,
  Calculator,
  PlayCircle,
  LogIn,
  Mail, // Import Mail icon for Contact
} from 'lucide-react';

interface HeaderProps {
  navigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ navigate }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const closeMobile = () => {
    setMobileOpen(false);
    setToolsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-brand-darker/80 backdrop-blur-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* LOGO */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3"
          >
            <img
              src="/Jetsuitewing.png"
              alt="JetSuite Logo"
              className="w-10 h-10"
            />
            <div className="leading-tight">
              <div className="text-xl font-bold text-white">JetSuite</div>
              <div className="text-xs text-gray-400 -mt-1">
                by Jet Automations
              </div>
            </div>
          </button>

          {/* DESKTOP NAV (TEXT ONLY) */}
          <nav className="hidden lg:flex items-center gap-8">
            <button
              onClick={() => navigate('/features')}
              className="text-gray-300 hover:text-white font-medium"
            >
              Features
            </button>
            <button
              onClick={() => navigate('/how-it-works')}
              className="text-gray-300 hover:text-white font-medium"
            >
              How It Works
            </button>
            <button
              onClick={() => navigate('/pricing')}
              className="text-gray-300 hover:text-white font-medium"
            >
              Pricing
            </button>
            <button
              onClick={() => navigate('/savings')}
              className="text-accent-cyan hover:text-accent-purple font-semibold"
            >
              💰 Calculate Savings
            </button>
            <button
              onClick={() => navigate('/faq')}
              className="text-gray-300 hover:text-white font-medium"
            >
              FAQ
            </button>
          </nav>

          {/* DESKTOP CTAs */}
          <div className="hidden md:flex items-center gap-4">

            {/* START 7-DAY FREE TRIAL (ICON OK) */}
            <div className="relative group">
              <button
                onClick={() => navigate('/get-started')}
                className="bg-gradient-to-r from-accent-cyan to-accent-purple hover:opacity-90
                           text-white font-bold px-4 py-2.5 rounded-lg
                           shadow-lg shadow-accent-cyan/30
                           flex items-center gap-2 transition-all"
              >
                <Zap className="w-5 h-5" />
                Try Free Tools
              </button>
            </div>

            {/* LOGIN (PRIMARY CTA) */}
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold rounded-lg transition-opacity shadow-lg shadow-accent-purple/20"
            >
              Login
            </button>
          </div>

          {/* MOBILE MENU TOGGLE */}
          <button
            className="md:hidden text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* MOBILE MENU */}
        {mobileOpen && (
          <div className="md:hidden pb-6">
            <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">

              {/* START 7-DAY FREE TRIAL (PRIMARY) */}
              <button
                onClick={() => {
                  navigate('/get-started');
                  closeMobile();
                }}
                className="w-full bg-gradient-to-r from-accent-cyan to-accent-purple
                           text-white font-bold px-4 py-3 rounded-xl
                           flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Try Free Tools
              </button>

              {/* LOGIN (PRIMARY MOBILE CTA) */}
              <button
                onClick={() => {
                  navigate('/login');
                  closeMobile();
                }}
                className="w-full bg-gradient-to-r from-accent-purple to-accent-pink
                           text-white font-bold px-4 py-3 rounded-xl
                           flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                Login
              </button>

              {/* NAV ITEMS (WITH ICONS ON MOBILE) */}
              <button onClick={() => { navigate('/features'); closeMobile(); }}
                className="mobile-item">
                <LayoutDashboard size={18} /> Features
              </button>

              <button onClick={() => { navigate('/how-it-works'); closeMobile(); }}
                className="mobile-item">
                <Workflow size={18} /> How It Works
              </button>

              <button onClick={() => { navigate('/pricing'); closeMobile(); }}
                className="mobile-item">
                <DollarSign size={18} /> Pricing
              </button>

              <button onClick={() => { navigate('/savings'); closeMobile(); }}
                className="mobile-item">
                <Calculator size={18} /> 💰 Calculate Savings
              </button>

              <button onClick={() => { navigate('/faq'); closeMobile(); }}
                className="mobile-item">
                <HelpCircle size={18} /> FAQ
              </button>
              
              {/* NEW CONTACT LINK */}
              <button onClick={() => { navigate('/contact'); closeMobile(); }}
                className="mobile-item">
                <Mail size={18} /> Contact Us
              </button>

              <div className="pt-2 text-center text-xs text-gray-400">
                JetSuite <span className="text-gray-500">by Jet Automations</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};