"use client";

import React, { useState } from 'react';
import { ALL_TOOLS } from '../constants';
import type { Tool, ProfileData, ReadinessState } from '../types';
import { ArrowRightIcon, InformationCircleIcon } from '../components/icons/MiniIcons';
import { QuickStatsCards } from '../components/QuickStatsCards'; // Import new component

interface WelcomeProps {
    setActiveTool: (tool: Tool | null, articleId?: string) => void;
    profileData: ProfileData;
    readinessState: ReadinessState;
    plan: { name: string, profileLimit: number };
    growthScore: number; // ADDED
}

const RecommendedAction: React.FC<{
  tool: Tool;
  onSelect: () => void;
  onWhy: () => void;
}> = ({ tool, onSelect, onWhy }) => (
    <div className="bg-white p-6 rounded-xl border border-accent-purple/50 shadow-lg glow-card glow-card-rounded-xl">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-light rounded-lg flex items-center justify-center flex-shrink-0">
                <tool.icon className="w-7 h-7 text-accent-purple" />
            </div>
            <div>
                <h3 className="font-bold text-lg text-brand-text">{tool.name}</h3>
                <p className="text-sm text-brand-text-muted">{tool.description}</p>
            </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
            <button onClick={onSelect} className="bg-accent-purple hover:bg-accent-purple/80 text-white font-bold py-2 px-5 rounded-lg transition-colors text-sm">
                Start Now
            </button>
            <button onClick={onWhy} className="text-sm font-semibold text-accent-purple hover:underline">
                Why this matters
            </button>
        </div>
    </div>
);

const ToolShortcut: React.FC<{ tool: Tool, onClick: () => void }> = ({ tool, onClick }) => (
    <button onClick={onClick} className="bg-brand-light p-3 rounded-lg hover:bg-brand-border transition-colors flex items-center gap-3 w-full text-left">
        <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center flex-shrink-0">
            <tool.icon className="w-5 h-5 text-accent-purple" />
        </div>
        <div>
            <h4 className="font-semibold text-brand-text text-sm">{tool.name}</h4>
        </div>
    </button>
);


const GrowthPhaseSection: React.FC<{
  title: string;
  description: string;
  recommendedToolId: string;
  otherToolIds: string[];
  kbArticleId: string;
  setActiveTool: (tool: Tool | null, articleId?: string) => void;
}> = ({ title, description, recommendedToolId, otherToolIds, kbArticleId, setActiveTool }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const recommendedTool = ALL_TOOLS[recommendedToolId];
  const otherTools = otherToolIds.map(id => ALL_TOOLS[id]).filter(Boolean);

  return (
    <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg glow-card glow-card-rounded-xl">
      <h2 className="text-2xl font-bold text-brand-text">{title}</h2>
      <p className="text-brand-text-muted mt-1 mb-6">{description}</p>
      
      <RecommendedAction 
        tool={recommendedTool}
        onSelect={() => setActiveTool(recommendedTool)}
        onWhy={() => setActiveTool(ALL_TOOLS['knowledgebase'], kbArticleId)}
      />

      {otherTools.length > 0 && (
        <div className="mt-6">
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-sm font-bold text-accent-purple hover:underline">
            {isExpanded ? 'Hide other tools' : `View all ${otherTools.length + 1} tools in this phase →`}
          </button>
        </div>
      )}

      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-brand-border">
          {otherTools.map(tool => (
            <ToolShortcut key={tool.id} tool={tool} onClick={() => setActiveTool(tool)} />
          ))}
        </div>
      )}
    </div>
  );
};

const Footer: React.FC<{ setActiveTool: (tool: Tool | null, articleId?: string) => void; }> = ({ setActiveTool }) => (
    <footer className="mt-16 pt-8 border-t border-brand-border text-center text-sm text-brand-text-muted">
        <p className="font-semibold">JetSuite Growth OS</p>
        <div className="mt-4 flex justify-center items-center space-x-4 md:space-x-6">
            <button className="hover:text-brand-text">Help</button>
            <span className="text-gray-300">&middot;</span>
            <button onClick={() => setActiveTool(ALL_TOOLS['knowledgebase'])} className="hover:text-brand-text">Knowledge Base</button>
            <span className="text-gray-300">&middot;</span>
            <button className="hover:text-brand-text">Privacy</button>
             <span className="text-gray-300">&middot;</span>
            <button className="hover:text-brand-text">Terms</button>
        </div>
    </footer>
);

export const Welcome: React.FC<WelcomeProps> = ({ setActiveTool, profileData, readinessState, plan, growthScore }) => {
    const getNextAction = () => {
        switch(readinessState) {
            case 'Setup Incomplete':
                return {
                    title: 'Welcome to JetSuite!',
                    description: 'Your first step is to complete your Business Profile. This is the foundation that powers every tool on the platform.',
                    ctaText: 'Go to Business Details',
                    onCtaClick: () => setActiveTool(ALL_TOOLS['businessdetails']),
                    onWhyClick: () => setActiveTool(ALL_TOOLS['knowledgebase'], 'getting-started/setup-profile'),
                };
            default:
                 return {
                    title: 'Your Command Center',
                    description: 'This is your starting point for growth. Your Next Best Action is always highlighted below.',
                    ctaText: 'Go to Growth Plan',
                    onCtaClick: () => setActiveTool(ALL_TOOLS['growthplan']),
                    onWhyClick: () => setActiveTool(ALL_TOOLS['knowledgebase'], 'getting-started/how-jetsuite-works'),
                };
        }
    }
    
    const nextAction = getNextAction();

  return (
    <div className="h-full w-full space-y-8 pb-12">
        
        {/* NEW: Quick Stats Cards */}
        <QuickStatsCards 
            profileData={profileData} 
            growthScore={growthScore}
            readinessState={readinessState} 
        />

        {/* NEW: Next Action Card (Replaces old large header) */}
        <div className="bg-brand-card rounded-xl shadow-lg p-6 w-full border border-brand-border">
            <div className="flex items-center gap-4 mb-4">
                <InformationCircleIcon className="w-6 h-6 text-accent-blue flex-shrink-0" />
                <div>
                    <h1 className="text-xl font-bold text-brand-text">Next Best Action</h1>
                    <p className="text-sm text-brand-text-muted">{nextAction.description}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button 
                    onClick={nextAction.onCtaClick}
                    className="bg-gradient-to-r from-accent-purple to-accent-pink hover:from-accent-purple hover:to-accent-pink/80 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl text-sm flex items-center gap-2"
                >
                    {nextAction.ctaText} <ArrowRightIcon className="w-5 h-5" />
                </button>
                 <button onClick={nextAction.onWhyClick} className="text-brand-text-muted hover:text-brand-text text-xs font-semibold underline underline-offset-2">
                    Why this matters
                </button>
            </div>
        </div>
      
        <div className="space-y-8">
            <GrowthPhaseSection 
                title="1. Business Foundation"
                description="Get found and build trust by optimizing your online presence."
                recommendedToolId="jetbiz"
                otherToolIds={['jetviz', 'jetkeywords', 'jetcompete']}
                kbArticleId="foundation/jetbiz"
                setActiveTool={setActiveTool}
            />
            <GrowthPhaseSection 
                title="2. Marketing and Brand Strategy"
                description="Turn strategy into on-brand content that attracts customers."
                recommendedToolId="jetcreate"
                otherToolIds={['jetpost', 'jetimage', 'jetcontent']}
                kbArticleId="create-publish/jetcreate"
                setActiveTool={setActiveTool}
            />
             <GrowthPhaseSection 
                title="3. Customer Engagement"
                description="Turn visibility into revenue by engaging leads and customers."
                recommendedToolId="jetreply"
                otherToolIds={['jetleads', 'jettrust', 'jetevents', 'jetads']}
                kbArticleId="engage-convert/jetreply"
                setActiveTool={setActiveTool}
            />
        </div>
        
        <Footer setActiveTool={setActiveTool} />
    </div>
  );
};