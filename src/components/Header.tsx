import React, { useState } from 'react';
import type { Tool, BusinessProfile } from '../types';
import { BoltIcon, ChevronDownIcon, StarIcon, MapPinIcon, CheckCircleIcon, QuestionMarkCircleIcon } from './icons/MiniIcons';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';
import { ALL_TOOLS } from '../constants';

interface HeaderProps {
  activeTool: Tool | null;
  growthScore: number;
  businesses: BusinessProfile[];
  activeBusinessId: string | null;
  onSwitchBusiness: (id: string) => void;
  onAddBusiness: () => void; 
  setActiveTool: (tool: Tool | null, articleId?: string) => void;
  userId?: string; 
  pendingTasksCount: number;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTool, 
  growthScore, 
  businesses, 
  activeBusinessId, 
  onSwitchBusiness,
  onAddBusiness, 
  setActiveTool,
  userId,
  pendingTasksCount
}) => {
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const activeBusiness = businesses.find(b => b.id === activeBusinessId);
  const title = activeTool ? activeTool.name : 'Command Center';
  
  const activeBusinessName = activeBusiness?.business_name || 'Loading Business...';
  
  const gbpData = activeBusiness?.google_business_profile;
  const reviewCount = gbpData?.reviewCount || 0;
  const rating = gbpData?.rating || 0;
  const isVerified = gbpData?.status === 'Verified';

  const handleRestartTour = () => {
    setShowHelpMenu(false);
    if ((window as any).restartProductTour) {
      (window as any).restartProductTour();
    }
  };

  return (
    <header className="bg-brand-card shadow-sm border-b border-brand-border p-4 flex items-center justify-between h-16 flex-shrink-0 relative z-50">
      
      <div className="flex items-center">
        <img
          src="/Jetsuitewing.png"
          alt="JetSuite"
          className="h-8 w-auto"
        />

        <div className="relative ml-4">
          <button 
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-light hover:bg-brand-border rounded-lg border border-brand-border transition-colors group"
          >
            <span className="text-sm font-bold text-brand-text truncate max-w-[150px]">
              {activeBusinessName}
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
                        {biz.business_name}
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

              <button 
                onClick={() => {
                  onAddBusiness();
                  setIsSwitcherOpen(false);
                }}
                className="w-full p-3 text-center text-xs font-bold text-accent-purple bg-brand-light hover:bg-brand-border transition-colors border-t border-brand-border"
              >
                + Add Another Business
              </button>
            </div>
          )}
        </div>

        <span className="mx-3 text-brand-text-muted hidden sm:inline">/</span>

        <h2 className="text-xl font-semibold text-brand-text hidden sm:block">
          {title}
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        {userId && <SubscriptionStatusBadge userId={userId} />}
        
        <div className="bg-brand-light border border-brand-border rounded-lg px-3 py-1.5 flex items-center">
          <BoltIcon className="w-5 h-5 text-yellow-500" />
          <span className="ml-2 text-sm font-bold text-brand-text">
            {growthScore}
          </span>
          <span className="ml-1 text-xs text-brand-text-muted hidden sm:inline">
            Growth Score
          </span>
        </div>

        <div className="bg-brand-light border border-brand-border rounded-lg px-3 py-1.5 flex items-center">
          <CheckCircleIcon className="w-5 h-5 text-accent-pink" />
          <span className="ml-2 text-sm font-bold text-brand-text">
            {pendingTasksCount}
          </span>
          <span className="ml-1 text-xs text-brand-text-muted hidden sm:inline">
            Pending Tasks
          </span>
        </div>

        {isVerified && (
            <div className="bg-brand-light border border-brand-border rounded-lg px-3 py-1.5 flex flex-col items-center group relative">
                <div className="flex items-center">
                    <StarIcon className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                    <span className="ml-1 text-sm font-bold text-brand-text">
                        {rating.toFixed(1)}
                    </span>
                    <span className="ml-1 text-xs text-brand-text-muted">
                        ({reviewCount})
                    </span>
                </div>
                <span className="text-xs text-brand-text-muted hidden sm:inline">
                    GBP Reviews
                </span>
                
                <div className="absolute top-full mt-2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded-lg shadow-lg w-48 z-50">
                    <p>Data syncs every 24 hours. New reviews may take time to appear.</p>
                </div>
            </div>
        )}

        <div className="relative">
          <button 
            data-tour="header-help"
            onClick={() => setShowHelpMenu(!showHelpMenu)}
            className="p-2 hover:bg-brand-light rounded-lg transition-colors"
            title="Help & Support"
          >
            <QuestionMarkCircleIcon className="w-6 h-6 text-brand-text-muted" />
          </button>
          
          {showHelpMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-brand-border rounded-lg shadow-xl z-50">
              <button
                onClick={handleRestartTour}
                className="w-full px-4 py-3 text-left hover:bg-brand-light transition-colors flex items-center gap-3 border-b border-brand-border"
              >
                <span className="text-2xl">🎓</span>
                <div>
                  <div className="text-sm font-medium text-brand-text">Take Product Tour</div>
                  <div className="text-xs text-gray-500">Learn how to use JetSuite</div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowHelpMenu(false);
                  setActiveTool(ALL_TOOLS['knowledgebase']);
                }}
                className="w-full px-4 py-3 text-left hover:bg-brand-light transition-colors flex items-center gap-3 border-b border-brand-border"
              >
                <span className="text-2xl">📚</span>
                <div>
                  <div className="text-sm font-medium text-brand-text">Knowledge Base</div>
                  <div className="text-xs text-gray-500">Find answers & guides</div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowHelpMenu(false);
                  setActiveTool(ALL_TOOLS['support']);
                }}
                className="w-full px-4 py-3 text-left hover:bg-brand-light transition-colors flex items-center gap-3"
              >
                <span className="text-2xl">💬</span>
                <div>
                  <div className="text-sm font-medium text-brand-text">Contact Support</div>
                  <div className="text-xs text-gray-500">Get help from our team</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};