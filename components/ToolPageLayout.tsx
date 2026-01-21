import React from 'react';

interface ToolPageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const ToolPageLayout: React.FC<ToolPageLayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 ${className}`}>
      {children}
    </div>
  );
};