
import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-accent-purple/20 border-t-accent-purple"></div>
    </div>
  );
};