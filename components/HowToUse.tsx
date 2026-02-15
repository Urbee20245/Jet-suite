
import React from 'react';
import { InformationCircleIcon, XMarkIcon } from './icons/MiniIcons';

interface HowToUseProps {
  toolName: string;
  onDismiss: () => void;
  children: React.ReactNode;
}

export const HowToUse: React.FC<HowToUseProps> = ({ toolName, onDismiss, children }) => {
  return (
    <div className="bg-accent-blue/5 border-l-4 border-accent-blue text-accent-blue/90 p-5 rounded-r-xl mb-6 relative shadow-sm">
      <div className="flex">
        <div className="py-0.5">
          <InformationCircleIcon className="w-5 h-5 mr-3"/>
        </div>
        <div className="pr-6">
          <p className="font-bold text-sm">How to Use {toolName}</p>
          <div className="text-sm leading-relaxed mt-1">{children}</div>
        </div>
        <button onClick={onDismiss} className="absolute top-3 right-3 p-1.5 rounded-lg text-accent-blue/40 hover:text-accent-blue hover:bg-accent-blue/10 transition-all duration-200">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
