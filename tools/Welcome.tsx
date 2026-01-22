"use client";

import React from 'react';
import { ALL_TOOLS } from '../constants';
import type { Tool, ProfileData, ReadinessState } from '../types';
import { ArrowRightIcon, InformationCircleIcon } from '../components/icons/MiniIcons';
import { QuickStatsCards } from '../components/QuickStatsCards';

interface WelcomeProps {
    setActiveTool: (tool: Tool | null, articleId?: string) => void;
    profileData: ProfileData;
    readinessState: ReadinessState;
    plan: { name: string, profileLimit: number };
    growthScore: number;
    pendingTasksCount: number;
    reviewResponseRate: number;
}

// New compact tool card component
const ToolCard: React.FC<{ 
  tool: Tool; 
  onClick: () => void;
  accentColor?: string;
}> = ({ tool, onClick, accentColor = 'bg-accent-purple' }) => {
  const colorClasses = {
    'bg-accent-purple': 'border-accent-purple/30 hover:border-accent-purple/60',
    'bg-accent-blue': 'border-accent-blue/30 hover:border-accent-blue/60',
    'bg-accent-pink': 'border-accent-pink/30 hover:border-accent-pink/60',
  };

  return (
    <button 
      onClick={onClick}
      className={`bg-brand-card p-4 rounded-xl shadow-md border ${colorClasses[accentColor] || colorClasses['bg-accent-purple']} hover:shadow-lg transition-all duration-200 flex flex-col items-start text-left w-full h-full group glow-card glow-card-rounded-xl`}
    >
      <div className={`w-12 h-12 ${accentColor} bg-opacity-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
        <tool.icon className={`w-6 h-6 ${accentColor.replace('bg-', 'text-')}`} />
      </div>
      <h3 className="font-bold text-base text-brand-text mb-1 group-hover:text-accent-purple transition-colors">
        {tool.name}
      </h3>
      <p className="text-xs text-brand-text-muted line-clamp-2">
        {tool.description}
      </p>
    </button>
  );
};

// Section header component
const SectionHeader: React.FC<{ 
  title: string; 
  description: string;
  accentColor?: string;
}> = ({ title, description, accentColor = 'text-accent-purple' }) => (
  <div className="mb-4">
    <h2 className={`text-xl font-bold ${accentColor} mb-1`}>{title}</h2>
    <p className="text-sm text-brand-text-muted">{description}</p>
  </div>
);

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

export const Welcome: React.FC<WelcomeProps> = ({ 
  setActiveTool, 
  profileData, 
  readinessState, 
  plan, 
  growthScore, 
  pendingTasksCount, 
  reviewResponseRate 
}) => {
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

    // Tool organization by phase
    const businessFoundationTools = ['jetbiz', 'jetviz', 'jetkeywords', 'jetcompete'];
    const marketingTools = ['jetcreate', 'jetsocial', 'jetimage', 'jetcontent'];
    const engagementTools = ['jetreply', 'jetleads', 'jettrust', 'jetevents', 'jetads'];

    return (
      <div className="h-full w-full space-y-8 pb-12">
          
          {/* Quick Stats Cards */}
          <QuickStatsCards 
              profileData={profileData} 
              growthScore={growthScore}
              pendingTasksCount={pendingTasksCount}
              reviewResponseRate={reviewResponseRate}
          />

          {/* Next Action Card */}
          <div className="bg-brand-card rounded-xl shadow-lg p-6 w-full border border-brand-border glow-card glow-card-rounded-xl">
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
        
          {/* 1. Business Foundation - Card Grid */}
          <div className="space-y-6">
            <SectionHeader 
              title="1. Business Foundation"
              description="Get found and build trust by optimizing your online presence."
              accentColor="text-accent-purple"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {businessFoundationTools.map(toolId => {
                const tool = ALL_TOOLS[toolId];
                return tool ? (
                  <ToolCard 
                    key={tool.id}
                    tool={tool}
                    onClick={() => setActiveTool(tool)}
                    accentColor="bg-accent-purple"
                  />
                ) : null;
              })}
            </div>
          </div>

          {/* 2. Marketing and Brand Strategy - Card Grid */}
          <div className="space-y-6">
            <SectionHeader 
              title="2. Marketing and Brand Strategy"
              description="Turn strategy into on-brand content that attracts customers."
              accentColor="text-accent-blue"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {marketingTools.map(toolId => {
                const tool = ALL_TOOLS[toolId];
                return tool ? (
                  <ToolCard 
                    key={tool.id}
                    tool={tool}
                    onClick={() => setActiveTool(tool)}
                    accentColor="bg-accent-blue"
                  />
                ) : null;
              })}
            </div>
          </div>

          {/* 3. Customer Engagement - Card Grid */}
          <div className="space-y-6">
            <SectionHeader 
              title="3. Customer Engagement"
              description="Turn visibility into revenue by engaging leads and customers."
              accentColor="text-accent-pink"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {engagementTools.map(toolId => {
                const tool = ALL_TOOLS[toolId];
                return tool ? (
                  <ToolCard 
                    key={tool.id}
                    tool={tool}
                    onClick={() => setActiveTool(tool)}
                    accentColor="bg-accent-pink"
                  />
                ) : null;
              })}
            </div>
          </div>
          
          <Footer setActiveTool={setActiveTool} />
      </div>
    );
};