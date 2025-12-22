
import React from 'react';
import { ReportsIcon } from '../../components/icons/ToolIcons';

export const ReportsDownloads: React.FC = () => {
  return (
    <div className="text-center bg-brand-card p-12 rounded-xl shadow-lg border-2 border-dashed border-brand-border">
      <div className="max-w-md mx-auto">
        <ReportsIcon className="w-16 h-16 mx-auto text-brand-text-muted opacity-50" />
        <h3 className="text-xl font-bold text-brand-text mt-4">Reports & Downloads</h3>
        <p className="text-brand-text-muted mt-2 mb-6">
          This feature is coming soon! You'll be able to access and download all your generated reports and plans here.
        </p>
      </div>
    </div>
  );
};
