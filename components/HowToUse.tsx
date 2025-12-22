
import React from 'react';
import { InformationCircleIcon, XMarkIcon } from './icons/MiniIcons';

interface HowToUseProps {
  toolName: string;
  onDismiss: () => void;
  children: React.ReactNode;
}

export const HowToUse: React.FC<HowToUseProps> = ({ toolName, onDismiss, children }) => {
  return (
    <div className="bg-accent-blue/10 border-l-4 border-accent-blue text-accent-blue/90 p-4 rounded-r-lg mb-6 relative">
      <div className="flex">
        <div className="py-1">
          <InformationCircleIcon className="w-6 h-6 mr-3"/>
        </div>
        <div>
          <p className="font-bold">How to Use {toolName}</p>
          <div className="text-sm">{children}</div>
        </div>
        <button onClick={onDismiss} className="absolute top-2 right-2 p-1 text-accent-blue/50 hover:text-accent-blue">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
