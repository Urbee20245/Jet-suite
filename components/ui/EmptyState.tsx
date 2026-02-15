import React from 'react';
import { Button } from './Button';
import { ArrowRightIcon } from '../icons/MiniIcons';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="text-center py-14 px-6 bg-brand-card rounded-xl shadow-sm border-2 border-dashed border-brand-border/60">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-light flex items-center justify-center mb-1">
        <Icon className="w-9 h-9 text-brand-text-muted opacity-40" />
      </div>
      <h3 className="text-lg font-semibold text-brand-text mt-4">{title}</h3>
      <p className="text-sm text-brand-text-muted mt-2 max-w-sm mx-auto leading-relaxed">{description}</p>
      {action && (
        <div className="mt-6">
          <Button onClick={action.onClick} variant="primary" size="md">
            {action.label}
            <ArrowRightIcon className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
};