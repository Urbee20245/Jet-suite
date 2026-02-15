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
    <div className="bg-brand-card p-8 sm:p-10 rounded-xl shadow-lg mt-6 text-center border border-brand-border/50">
      <Loader />
      <h3 className="text-xl font-bold text-brand-text mt-4 flex items-center justify-center gap-2.5 tracking-tight">
        <SparklesIcon className="w-5 h-5 text-accent-purple animate-pulse" />
        {title}
      </h3>
      <p className="text-brand-text-muted mt-2 text-sm leading-relaxed">{message}</p>

      <div className="w-full max-w-md mx-auto mt-8 mb-4">
        <div className="relative">
          <div className="overflow-hidden h-2 rounded-full bg-accent-purple/10">
            <div
              style={{ width: `${progress}%` }}
              className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-purple transition-all duration-700 ease-out"
            ></div>
          </div>
          <p className="text-xs text-brand-text-muted mt-3">
            {Math.round(progress)}% Complete • This can take up to 5 minutes.
          </p>
        </div>
      </div>
    </div>
  );
};