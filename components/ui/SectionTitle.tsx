import React from 'react';

interface SectionTitleProps {
  children: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ children, subtitle, action }) => {
  return (
    <div className="mb-6 flex justify-between items-start">
      <div>
        <h2 className="text-2xl font-bold text-brand-text">{children}</h2>
        {subtitle && (
          <p className="text-sm text-brand-text-muted mt-1">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0 mt-1">
          {action}
        </div>
      )}
    </div>
  );
};