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
    <div className="text-center py-12 bg-brand-card rounded-xl shadow-lg border-2 border-dashed border-brand-border">
      <Icon className="w-16 h-16 text-brand-text-muted mx-auto opacity-50" />
      <h3 className="text-xl font-semibold text-brand-text mt-4">{title}</h3>
      <p className="text-brand-text-muted mt-2 max-w-md mx-auto">{description}</p>
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