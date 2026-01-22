import React, { useState, useEffect } from 'react';
import { Loader } from './Loader';
import { SparklesIcon } from './icons/MiniIcons';

interface AnalysisLoadingStateProps {
  title: string;
  message: string;
  durationEstimateSeconds?: number; // e.g., 300 for 5 minutes
}

export const AnalysisLoadingState: React.FC<AnalysisLoadingStateProps> = ({
  title,
  message,
  durationEstimateSeconds = 300,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate progress over the estimated duration
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev; // Stop just before 100%
        
        // Calculate step size based on duration
        const step = 100 / (durationEstimateSeconds * 2); // 0.5% per second
        return Math.min(prev + step, 95);
      });
    }, 500);

    return () => clearInterval(interval);
  }, [durationEstimateSeconds]);

  return (
    <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg mt-6 text-center">
      <Loader />
      <h3 className="text-xl font-bold text-brand-text mt-4 flex items-center justify-center gap-2">
        <SparklesIcon className="w-6 h-6 text-accent-purple animate-pulse" />
        {title}
      </h3>
      <p className="text-brand-text-muted mt-2">{message}</p>
      
      <div className="w-full max-w-md mx-auto my-6">
        <div className="relative pt-1">
          <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-accent-purple/20">
            <div 
              style={{ width: `${progress}%` }} 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-accent-blue to-accent-purple transition-all duration-500 ease-out"
            ></div>
          </div>
          <p className="text-xs text-brand-text-muted text-right">
            {Math.round(progress)}% Complete • This can take up to 5 minutes.
          </p>
        </div>
      </div>
    </div>
  );
};