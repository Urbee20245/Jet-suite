import React, { useState } from 'react';

interface HeaderProps {
  navigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ navigate }) => {
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-brand-darker/90 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <img src="/Jetsuitewing.png" alt="JetSuite" className="w-8 h-8" />
            <span className="text-lg font-bold text-white">JetSuite</span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => navigate('/features')} className="nav-link">Features</button>
            <button onClick={() => navigate('/how-it-works')} className="nav-link">How It Works</button>
            <button onClick={() => navigate('/pricing')} className="nav-link">Pricing</button>
            <button onClick={() => navigate('/faq')} className="nav-link">FAQ</button>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="text-white/80 hover:text-white">
              Login
            </button>
            <button
              onClick={() => navigate('/get-started')}
              className="bg-gradient-to-r from-accent-purple to-accent-pink px-5 py-2.5 rounded-lg font-bold text-white"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-brand-darker border-t border-slate-800 px-4 py-4 space-y-4">

          <button onClick={() => navigate('/features')} className="mobile-link">Features</button>
          <button onClick={() => navigate('/how-it-works')} className="mobile-link">How It Works</button>
          <button onClick={() => navigate('/pricing')} className="mobile-link">Pricing</button>
          <button onClick={() => navigate('/faq')} className="mobile-link">FAQ</button>

          {/* Free Tools Accordion */}
          <button
            onClick={() => setToolsOpen(!toolsOpen)}
            className="w-full flex justify-between items-center bg-slate-800 px-4 py-3 rounded-lg font-semibold text-white"
          >
            Try Free Tools
            <span>{toolsOpen ? '−' : '+'}</span>
          </button>

          {toolsOpen && (
            <div className="pl-4 space-y-2">
              <button onClick={() => navigate('/demo/jetbiz')} className="mobile-sub">
                JetBiz Demo
              </button>
              <button onClick={() => navigate('/demo/jetviz')} className="mobile-sub">
                JetViz Demo
              </button>
            </div>
          )}

          <button onClick={() => navigate('/login')} className="mobile-link">
            Login
          </button>

          <button
            onClick={() => navigate('/get-started')}
            className="w-full bg-gradient-to-r from-accent-purple to-accent-pink py-3 rounded-lg font-bold text-white"
          >
            Get Started
          </button>
        </div>
      )}
    </header>
  );
};

