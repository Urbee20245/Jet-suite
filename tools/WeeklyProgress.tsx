
import React from 'react';
import { WeeklyProgressIcon } from '../components/icons/ToolIcons';

export const WeeklyProgress: React.FC = () => {
  return (
    <div className="text-center bg-brand-card p-12 rounded-xl shadow-lg border-2 border-dashed border-brand-border">
      <div className="max-w-md mx-auto">
        <WeeklyProgressIcon className="w-16 h-16 mx-auto text-brand-text-muted opacity-50" />
        <h3 className="text-xl font-bold text-brand-text mt-4">Weekly Progress</h3>
        <p className="text-brand-text-muted mt-2 mb-6">
          This feature is coming soon! It will provide a detailed review of your weekly progress and momentum.
        </p>
      </div>
    </div>
  );
};
