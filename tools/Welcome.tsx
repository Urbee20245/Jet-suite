"use client";

import React, { useState } from 'react';
import { ALL_TOOLS } from '../constants';
import type { Tool, ProfileData, ReadinessState, GrowthPlanTask } from '../types';
import { ArrowRightIcon, InformationCircleIcon, ChevronDownIcon, ChevronUpIcon, SparklesIcon, CheckCircleIcon, StarIcon } from '../components/icons/MiniIcons';
import { QuickStatsCards } from '../components/QuickStatsCards';
import { Boris } from '../components/Boris';

interface WelcomeProps { 
  setActiveTool: (tool: Tool | null, articleId?: string) => void;
  profileData: ProfileData;
  readinessState: ReadinessState;
  plan: { name: string, profileLimit: number };
  growthScore: number;
  pendingTasksCount: number;
  reviewResponseRate: number;
  tasks: GrowthPlanTask[];
  hasNewReviews: boolean;
  newReviewsCount: number;
  onReplyToReviews: () => void;
  onTaskStatusChange: (taskId: string, newStatus: 'completed') => void;
}

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
      className={`bg-brand-card p-3 rounded-lg shadow-sm border ${colorClasses[accentColor] || colorClasses['bg-accent-purple']} hover:shadow-md transition-all duration-200 flex flex-col items-start text-left w-full group`}
    >
      <div className={`w-10 h-10 ${accentColor} bg-opacity-10 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
        {tool.icon && <tool.icon className={`w-5 h-5 ${accentColor.replace('bg-', 'text-')}`} />}
      </div>
      <h3 className="font-bold text-sm text-brand-text mb-1 group-hover:text-accent-purple transition-colors">
        {tool.name}
      </h3>
      <p className="text-xs text-brand-text-muted line-clamp-2">
        {tool.description}
      </p>
    </button>
  );
};

// Collapsible Category Card Component
const CategoryCard: React.FC<{
  title: string;
  number: string;
  description: string;
  tools: string[];
  accentColor: string;
  textColor: string;
  setActiveTool: (tool: Tool | null) => void;
}> = ({ title, number, description, tools, accentColor, textColor, setActiveTool }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const colorClasses = {
    'bg-accent-purple': 'border-accent-purple/30 hover:border-accent-purple/50',
    'bg-accent-blue': 'border-accent-blue/30 hover:border-accent-blue/50',
    'bg-accent-pink': 'border-accent-pink/30 hover:border-accent-pink/50',
  };

  return (
    <div className={`bg-brand-card rounded-xl shadow-lg border ${colorClasses[accentColor]} transition-all duration-300 ${isExpanded ? 'col-span-full' : ''}`}>
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-brand-light/50 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${accentColor} bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0`}>
            <span className={`text-2xl font-bold ${textColor}`}>{number}</span>
          </div>
          <div className="text-left">
            <h2 className={`text-lg font-bold ${textColor} mb-1`}>{title}</h2>
            <p className="text-sm text-brand-text-muted">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-brand-text-muted font-medium">{tools.length} tools</span>
          {isExpanded ? (
            <ChevronUpIcon className="w-5 h-5 text-brand-text-muted" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-brand-text-muted" />
          )}
        </div>
      </button>

      {/* Expanded Content - Tools Grid */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tools.map(toolId => {
              const tool = ALL_TOOLS[toolId];
              return tool ? (
                <ToolCard 
                  key={tool.id}
                  tool={tool}
                  onClick={() => setActiveTool(tool)}
                  accentColor={accentColor}
                />
              ) : null;
            })}
          </div>
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

export const Welcome: React.FC<WelcomeProps> = ({ 
  setActiveTool, 
  profileData, 
  readinessState, 
  plan, 
  growthScore, 
  pendingTasksCount, 
  reviewResponseRate,
  tasks,
  hasNewReviews,
  newReviewsCount,
  onReplyToReviews,
  onTaskStatusChange
}) => {
    // Tool organization by phase
    const businessFoundationTools = ['jetbiz', 'jetviz', 'jetkeywords', 'jetcompete'];
    const marketingTools = ['jetcreate', 'jetsocial', 'jetimage', 'jetcontent', 'jetproduct'];
    const engagementTools = ['jetreply', 'jetleads', 'jettrust', 'jetevents', 'jetads'];

    return (
      <div className="h-full w-full space-y-6 pb-12">
          
          {/* Boris Component - MAIN FOCUS */}
          <div className="max-w-4xl mx-auto">
            <Boris
              userFirstName={profileData.user.firstName || 'there'}
              profileData={profileData}
              growthPlanTasks={tasks}
              hasNewReviews={hasNewReviews}
              newReviewsCount={newReviewsCount}
              onNavigate={(toolId) => {
                const tool = ALL_TOOLS[toolId];
                if (tool) setActiveTool(tool);
              }}
              onReplyToReviews={onReplyToReviews}
              onTaskStatusChange={onTaskStatusChange}
            />
          </div>
          
          {/* Access All Tools Card */}
          <div className="max-w-4xl mx-auto mt-6">
            <div className="bg-brand-card rounded-xl p-6 border border-brand-border shadow-lg">
              <h3 className="text-lg font-bold text-brand-text mb-2">Access All Tools</h3>
              <p className="text-sm text-brand-text-muted mb-4">
                Need a specific tool? Browse all available tools organized by category below.
              </p>
            </div>
          </div>

          {/* Collapsible Category Cards - Horizontal Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Business Foundation */}
            <CategoryCard
              number="1"
              title="Business Foundation"
              description="Get found and build trust by optimizing your online presence."
              tools={businessFoundationTools}
              accentColor="bg-accent-purple"
              textColor="text-accent-purple"
              setActiveTool={setActiveTool}
            />

            {/* 2. Marketing and Brand Strategy */}
            <CategoryCard
              number="2"
              title="Marketing Strategy"
              description="Turn strategy into on-brand content that attracts customers."
              tools={marketingTools}
              accentColor="bg-accent-blue"
              textColor="text-accent-blue"
              setActiveTool={setActiveTool}
            />

            {/* 3. Customer Engagement */}
            <CategoryCard
              number="3"
              title="Customer Engagement"
              description="Turn visibility into revenue by engaging leads and customers."
              tools={engagementTools}
              accentColor="bg-accent-pink"
              textColor="text-accent-pink"
              setActiveTool={setActiveTool}
            />
          </div>
          
          <Footer setActiveTool={setActiveTool} />
      </div>
    );
};