import React from 'react';
import { SparklesIcon } from './icons/MiniIcons';

interface ToolHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: string; // Optional badge (e.g., "Beta", "New")
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({ icon: Icon, title, description, badge }) => {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-brand-light rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon className="w-8 h-8 text-accent-purple" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-brand-text">{title}</h1>
            <p className="text-lg text-brand-text-muted mt-2">{description}</p>
          </div>
        </div>
        {badge && (
          <span className="bg-accent-purple/10 text-accent-purple text-xs font-bold px-3 py-1 rounded-full border border-accent-purple/30 flex items-center gap-1 mt-2">
            <SparklesIcon className="w-3 h-3" />
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};