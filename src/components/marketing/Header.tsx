import React, { useState, useEffect, useRef } from 'react';
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
  Mail,
} from 'lucide-react';
import { SubscriptionStatusBadge } from '../../../components/SubscriptionStatusBadge';

interface HeaderProps {
  navigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ navigate }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [freeToolsOpen, setFreeToolsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get userId from localStorage to show badge if logged in
    const storedUserId = typeof localStorage !== 'undefined' ? localStorage.getItem('jetsuite_userId') : null;
    setUserId(storedUserId);
  }, []);

  const closeMobile = () => {
    setMobileOpen(false);
    setFreeToolsOpen(false);
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setFreeToolsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);


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
            
            {/* Glowing Status Indicator (only if logged in) */}
            {userId && <SubscriptionStatusBadge userId={userId} />}

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setFreeToolsOpen(!freeToolsOpen)}
                className="bg-gradient-to-r from-accent-cyan to-accent-purple hover:opacity-90
                           text-white font-bold px-4 py-2.5 rounded-lg
                           shadow-lg shadow-accent-cyan/30
                           flex items-center gap-2 transition-all"
              >
                <Zap className="w-5 h-5" />
                Try Free Tools
                <ChevronDown className={`w-4 h-4 transition-transform ${freeToolsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {freeToolsOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        navigate('/demo/jetbiz');
                        setFreeToolsOpen(false);
                      }}
                      className="w-full text-left p-3 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <LayoutDashboard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-white">JetBiz Lite</div>
                        <div className="text-xs text-gray-400">Analyze Google Business Profile</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        navigate('/demo/jetviz');
                        setFreeToolsOpen(false);
                      }}
                      className="w-full text-left p-3 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Workflow className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-white">JetViz Lite</div>
                        <div className="text-xs text-gray-400">Analyze website performance</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate(userId ? '/app' : '/login')}
              className="px-6 py-2.5 bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold rounded-lg transition-opacity shadow-lg shadow-accent-purple/20"
            >
              {userId ? 'Go to App' : 'Login'}
            </button>
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-6">
            <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
              
              {/* Mobile Status Indicator */}
              {userId && (
                <div className="flex justify-center py-2">
                  <SubscriptionStatusBadge userId={userId} />
                </div>
              )}

              <div className="relative">
                <button
                  onClick={() => setFreeToolsOpen(!freeToolsOpen)}
                  className="w-full bg-gradient-to-r from-accent-cyan to-accent-purple
                             text-white font-bold px-4 py-3 rounded-xl
                             flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Try Free Tools
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${freeToolsOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {freeToolsOpen && (
                  <div className="mt-2 space-y-2 pl-4">
                    <button
                      onClick={() => {
                        navigate('/demo/jetbiz');
                        closeMobile();
                      }}
                      className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <LayoutDashboard className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">JetBiz Lite</div>
                        <div className="text-xs text-gray-400">Analyze GBP</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        navigate('/demo/jetviz');
                        closeMobile();
                      }}
                      className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                        <Workflow className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">JetViz Lite</div>
                        <div className="text-xs text-gray-400">Analyze website</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  navigate(userId ? '/app' : '/login');
                  closeMobile();
                }}
                className="w-full bg-gradient-to-r from-accent-purple to-accent-pink
                           text-white font-bold px-4 py-3 rounded-xl
                           flex items-center justify-center gap-2"
              >
                {userId ? <LayoutDashboard className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                {userId ? 'Go to App' : 'Login'}
              </button>

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