import React, { useState } from 'react';
import type { Tool, BusinessProfile } from '../types';
import { BoltIcon, ChevronDownIcon } from './icons/MiniIcons';
import { ALL_TOOLS } from '../constants';

interface HeaderProps {
  activeTool: Tool | null;
  growthScore: number;
  businesses: BusinessProfile[];
  activeBusinessId: string | null;
  onSwitchBusiness: (id: string) => void;
  setActiveTool: (tool: Tool | null) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTool, 
  growthScore, 
  businesses, 
  activeBusinessId, 
  onSwitchBusiness,
  setActiveTool
}) => {
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const activeBusiness = businesses.find(b => b.id === activeBusinessId);
  const title = activeTool ? activeTool.name : 'Command Center';

  return (
    <header className="bg-brand-card shadow-sm border-b border-brand-border p-4 flex items-center justify-between h-16 flex-shrink-0 relative z-50">
      
      {/* LEFT: Logo + Business Switcher + Page Title */}
      <div className="flex items-center">
        <img
          src="/Jetsuitewing.png"
          alt="JetSuite"
          className="h-8 w-auto"
        />

        {/* Business Switcher Dropdown */}
        <div className="relative ml-4">
          <button 
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-light hover:bg-brand-border rounded-lg border border-brand-border transition-colors group"
          >
            <span className="text-sm font-bold text-brand-text">
              {activeBusiness?.name || 'Loading Business...'}
            </span>
            <ChevronDownIcon
              className={`w-4 h-4 text-brand-text-muted transition-transform ${
                isSwitcherOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isSwitcherOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-brand-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1">
              <div className="p-2 border-b border-brand-light bg-brand-light/50">
                <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider px-2">
                  Switch Business
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto">
                {businesses.map(biz => (
                  <button
                    key={biz.id}
                    onClick={() => {
                      onSwitchBusiness(biz.id);
                      setIsSwitcherOpen(false);
                    }}
                    className={`w-full text-left p-3 flex items-center justify-between hover:bg-brand-light transition-colors ${
                      activeBusinessId === biz.id ? 'bg-accent-purple/5' : ''
                    }`}
                  >
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          activeBusinessId === biz.id
                            ? 'text-accent-purple'
                            : 'text-brand-text'
                        }`}
                      >
                        {biz.name}
                      </p>
                      <p className="text-xs text-brand-text-muted">
                        {biz.location}
                      </p>
                    </div>

                    {activeBusinessId === biz.id && (
                      <div className="w-2 h-2 rounded-full bg-accent-purple"></div>
                    )}
                  </button>
                ))}
              </div>

              {/* ✅ FIXED: Wire to existing business creation tool */}
              <button 
                onClick={() => {
                  setActiveTool(ALL_TOOLS['business_creation'] || null);
                  setIsSwitcherOpen(false);
                }}
                className="w-full p-3 text-center text-xs font-bold text-accent-purple bg-brand-light hover:bg-brand-border transition-colors border-t border-brand-border"
              >
                + Add Another Business
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <span className="mx-3 text-brand-text-muted">/</span>

        {/* Page Title */}
        <h2 className="text-xl font-semibold text-brand-text">
          {title}
        </h2>
      </div>

      {/* RIGHT: Growth Score */}
      <div className="flex items-center">
        <div className="bg-brand-light border border-brand-border rounded-lg px-3 py-1.5 flex items-center">
          <BoltIcon className="w-5 h-5 text-yellow-500" />
          <span className="ml-2 text-sm font-bold text-brand-text">
            {growthScore}
          </span>
          <span className="ml-1 text-xs text-brand-text-muted">
            Growth Score
          </span>
        </div>
      </div>

    </header>
  );
};
