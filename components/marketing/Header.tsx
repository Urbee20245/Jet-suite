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
              Calculate Savings
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

            {/* TRY FREE TOOLS (ICON OK) */}
            <div className="relative group">
              <button
                className="bg-gradient-to-r from-accent-cyan to-accent-purple hover:opacity-90
                           text-white font-bold px-4 py-2.5 rounded-lg
                           shadow-lg shadow-accent-cyan/30
                           flex items-center gap-2 transition-all"
              >
                <Zap className="w-5 h-5" />
                Try Free Tools
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* DESKTOP DROPDOWN */}
              <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700
                              rounded-lg shadow-xl opacity-0 invisible
                              group-hover:opacity-100 group-hover:visible
                              transition-all z-50">
                <button
                  onClick={() => navigate('/demo/jetbiz')}
                  className="block w-full text-left px-4 py-3 text-sm
                             text-gray-300 hover:bg-slate-700 hover:text-white"
                >
                  <div className="font-semibold">JetBiz Demo</div>
                  <div className="text-xs text-gray-500">
                    Google Business Analyzer
                  </div>
                </button>
                <button
                  onClick={() => navigate('/demo/jetviz')}
                  className="block w-full text-left px-4 py-3 text-sm
                             text-gray-300 hover:bg-slate-700 hover:text-white
                             border-t border-slate-700"
                >
                  <div className="font-semibold">JetViz Demo</div>
                  <div className="text-xs text-gray-500">
                    Website Visual Analyzer
                  </div>
                </button>
              </div>
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

              {/* TRY FREE TOOLS (PRIMARY) */}
              <button
                onClick={() => setToolsOpen(!toolsOpen)}
                className="w-full bg-gradient-to-r from-accent-cyan to-accent-purple
                           text-white font-bold px-4 py-3 rounded-xl
                           flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Try Free Tools
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    toolsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {toolsOpen && (
                <div className="rounded-lg overflow-hidden border border-slate-800">
                  <button
                    onClick={() => {
                      navigate('/demo/jetbiz');
                      closeMobile();
                    }}
                    className="w-full px-4 py-3 flex items-start gap-3
                               bg-slate-950/40 hover:bg-slate-800"
                  >
                    <PlayCircle className="w-5 h-5 text-accent-cyan mt-0.5" />
                    <div>
                      <div className="text-white font-semibold">JetBiz Demo</div>
                      <div className="text-xs text-gray-400">
                        Google Business Analyzer
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/demo/jetviz');
                      closeMobile();
                    }}
                    className="w-full px-4 py-3 flex items-start gap-3
                               bg-slate-950/40 hover:bg-slate-800 border-t border-slate-800"
                  >
                    <PlayCircle className="w-5 h-5 text-accent-purple mt-0.5" />
                    <div>
                      <div className="text-white font-semibold">JetViz Demo</div>
                      <div className="text-xs text-gray-400">
                        Website Visual Analyzer
                      </div>
                    </div>
                  </button>
                </div>
              )}

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
                <Calculator size={18} /> Calculate Savings
              </button>

              <button onClick={() => { navigate('/faq'); closeMobile(); }}
                className="mobile-item">
                <HelpCircle size={18} /> FAQ
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