import React, { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  Zap,
  LayoutDashboard,
  Sparkles,
  Workflow,
  DollarSign,
  HelpCircle,
  Calculator,
  LogIn,
  Rocket,
  ChevronDown,
  PlayCircle,
} from "lucide-react";

interface HeaderProps {
  navigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ navigate }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement | null>(null);

  // Close desktop dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!toolsRef.current) return;
      if (!toolsRef.current.contains(e.target as Node)) setToolsOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const closeMobile = () => {
    setMobileOpen(false);
    setToolsOpen(false);
  };

  const NavBtn = ({
    icon,
    label,
    to,
    accent = false,
  }: {
    icon: React.ReactNode;
    label: string;
    to: string;
    accent?: boolean;
  }) => (
    <button
      onClick={() => {
        navigate(to);
        closeMobile();
      }}
      className={[
        "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
        accent
          ? "text-accent-cyan hover:text-accent-purple"
          : "text-gray-300 hover:text-white",
      ].join(" ")}
    >
      <span className="text-gray-400">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <header className="sticky top-0 z-50 bg-brand-darker/80 backdrop-blur-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Row */}
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 min-w-0"
            aria-label="Go to home"
          >
            <img
              src="/Jetsuitewing.png"
              alt="JetSuite Logo"
              className="w-10 h-10 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-xl font-bold text-white truncate">
                  JetSuite
                </span>
              </div>
              <span className="block text-xs text-gray-400 -mt-1 truncate">
                by Jet Automations
              </span>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-2">
            <NavBtn icon={<Sparkles size={16} />} label="Features" to="/features" />
            <NavBtn
              icon={<Workflow size={16} />}
              label="How It Works"
              to="/how-it-works"
            />
            <NavBtn icon={<DollarSign size={16} />} label="Pricing" to="/pricing" />
            <NavBtn
              icon={<Calculator size={16} />}
              label="Calculate Savings"
              to="/savings"
              accent
            />
            <NavBtn icon={<HelpCircle size={16} />} label="FAQ" to="/faq" />
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {/* Try Free Tools (desktop) */}
            <div className="relative" ref={toolsRef}>
              <button
                onClick={() => setToolsOpen((v) => !v)}
                className="bg-gradient-to-r from-accent-cyan to-accent-purple hover:opacity-90 text-white font-bold px-4 py-2.5 rounded-lg shadow-lg shadow-accent-cyan/30 flex items-center gap-2 transition-all"
                aria-haspopup="menu"
                aria-expanded={toolsOpen}
              >
                <Zap className="w-5 h-5" />
                <span className="hidden sm:inline">Try Free Tools</span>
                <span className="sm:hidden">Free Tools</span>
                <ChevronDown className="w-4 h-4 opacity-90" />
              </button>

              {toolsOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden"
                  role="menu"
                >
                  <button
                    onClick={() => {
                      navigate("/demo/jetbiz");
                      setToolsOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-slate-700 transition-colors"
                    role="menuitem"
                  >
                    <div className="flex items-start gap-3">
                      <PlayCircle className="w-5 h-5 text-accent-cyan mt-0.5" />
                      <div>
                        <div className="font-semibold">JetBiz Demo</div>
                        <div className="text-xs text-gray-400">
                          Google Business Analyzer
                        </div>
                      </div>
                    </div>
                  </button>
                  <div className="h-px bg-slate-700" />
                  <button
                    onClick={() => {
                      navigate("/demo/jetviz");
                      setToolsOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-slate-700 transition-colors"
                    role="menuitem"
                  >
                    <div className="flex items-start gap-3">
                      <PlayCircle className="w-5 h-5 text-accent-purple mt-0.5" />
                      <div>
                        <div className="font-semibold">JetViz Demo</div>
                        <div className="text-xs text-gray-400">
                          Website Visual Analyzer
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Login (desktop) */}
            <button
              onClick={() => navigate("/login")}
              className="text-white/90 hover:text-white font-medium px-2 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <LogIn size={18} className="text-gray-300" />
              <span className="hidden lg:inline">Login</span>
            </button>

            {/* Get Started (desktop) */}
            <button
              onClick={() => navigate("/get-started")}
              className="bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-2.5 px-5 rounded-lg transition-opacity shadow-lg flex items-center gap-2"
            >
              <Rocket size={18} />
              Get Started
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-white/90 hover:text-white hover:bg-slate-800/60 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu Panel */}
        {mobileOpen && (
          <div className="md:hidden pb-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur p-3">
              {/* Primary CTA first on mobile */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setToolsOpen((v) => !v)}
                  className="w-full bg-gradient-to-r from-accent-cyan to-accent-purple hover:opacity-90 text-white font-bold px-4 py-3 rounded-xl shadow-lg shadow-accent-cyan/25 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Try Free Tools
                  </span>
                  <ChevronDown
                    className={[
                      "w-4 h-4 transition-transform",
                      toolsOpen ? "rotate-180" : "",
                    ].join(" ")}
                  />
                </button>

                {toolsOpen && (
                  <div className="rounded-xl border border-slate-800 overflow-hidden">
                    <button
                      onClick={() => {
                        navigate("/demo/jetbiz");
                        closeMobile();
                      }}
                      className="w-full text-left px-4 py-3 bg-slate-950/30 hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <PlayCircle className="w-5 h-5 text-accent-cyan mt-0.5" />
                        <div>
                          <div className="text-white font-semibold">
                            JetBiz Demo
                          </div>
                          <div className="text-xs text-gray-400">
                            Google Business Analyzer
                          </div>
                        </div>
                      </div>
                    </button>
                    <div className="h-px bg-slate-800" />
                    <button
                      onClick={() => {
                        navigate("/demo/jetviz");
                        closeMobile();
                      }}
                      className="w-full text-left px-4 py-3 bg-slate-950/30 hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <PlayCircle className="w-5 h-5 text-accent-purple mt-0.5" />
                        <div>
                          <div className="text-white font-semibold">
                            JetViz Demo
                          </div>
                          <div className="text-xs text-gray-400">
                            Website Visual Analyzer
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                <button
                  onClick={() => {
                    navigate("/get-started");
                    closeMobile();
                  }}
                  className="w-full bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold px-4 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <Rocket size={18} />
                  Get Started
                </button>

                <button
                  onClick={() => {
                    navigate("/login");
                    closeMobile();
                  }}
                  className="w-full border border-slate-800 hover:bg-slate-800/40 text-white font-semibold px-4 py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <LogIn size={18} />
                  Login
                </button>
              </div>

              <div className="my-4 h-px bg-slate-800" />

              {/* Nav items with icons (mobile) */}
              <div className="grid gap-1">
                <button
                  onClick={() => {
                    navigate("/features");
                    closeMobile();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800/40 transition-colors text-left"
                >
                  <Sparkles size={18} className="text-gray-300" />
                  <span className="text-white font-medium">Features</span>
                </button>

                <button
                  onClick={() => {
                    navigate("/how-it-works");
                    closeMobile();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800/40 transition-colors text-left"
                >
                  <Workflow size={18} className="text-gray-300" />
                  <span className="text-white font-medium">How It Works</span>
                </button>

                <button
                  onClick={() => {
                    navigate("/pricing");
                    closeMobile();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800/40 transition-colors text-left"
                >
                  <DollarSign size={18} className="text-gray-300" />
                  <span className="text-white font-medium">Pricing</span>
                </button>

                <button
                  onClick={() => {
                    navigate("/savings");
                    closeMobile();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800/40 transition-colors text-left"
                >
                  <Calculator size={18} className="text-accent-cyan" />
                  <span className="text-white font-medium">
                    Calculate Savings
                  </span>
                </button>

                <button
                  onClick={() => {
                    navigate("/faq");
                    closeMobile();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800/40 transition-colors text-left"
                >
                  <HelpCircle size={18} className="text-gray-300" />
                  <span className="text-white font-medium">FAQ</span>
                </button>
              </div>

              {/* Small brand line for mobile */}
              <div className="pt-4 text-center text-xs text-gray-400">
                JetSuite <span className="text-gray-500">by Jet Automations</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

