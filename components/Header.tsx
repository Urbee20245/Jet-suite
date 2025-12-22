
import React from 'react';
import type { Tool } from '../types';
import { BoltIcon } from './icons/MiniIcons';
import { HomeIcon } from './icons/ToolIcons';

interface HeaderProps {
  activeTool: Tool | null;
  growthScore: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTool, growthScore }) => {
  const Icon = activeTool ? activeTool.icon : HomeIcon;
  const title = activeTool ? activeTool.name : 'Command Center';

  return (
    <header className="bg-brand-card shadow-sm border-b border-brand-border p-4 flex items-center justify-between h-16 flex-shrink-0">
      <div className="flex items-center">
        <Icon className="w-6 h-6 text-accent-purple" />
        <h2 className="ml-3 text-xl font-semibold text-brand-text">{title}</h2>
      </div>
      <div className="flex items-center">
        <div className="bg-brand-light border border-brand-border rounded-lg px-3 py-1.5 flex items-center">
            <BoltIcon className="w-5 h-5 text-yellow-500" />
            <span className="ml-2 text-sm font-bold text-brand-text">{growthScore}</span>
            <span className="ml-1 text-xs text-brand-text-muted">Growth Score</span>
        </div>
      </div>
    </header>
  );
};