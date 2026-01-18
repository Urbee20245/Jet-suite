import React, { useState, useRef, useEffect } from 'react';

interface HintTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export const HintTooltip: React.FC<HintTooltipProps> = ({ content, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the parent StepCard from toggling
    setIsOpen(prev => !prev);
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative flex items-center">
      <button
        type="button"
        onClick={handleToggle}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-brand-text-muted hover:text-accent-blue transition-colors focus:outline-none"
        aria-label="Show hint"
      >
        {children}
      </button>
      {isOpen && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-white p-4 rounded-lg shadow-xl border border-brand-border z-20 animate-in fade-in slide-in-from-bottom-2"
          role="tooltip"
        >
          <div className="text-sm text-brand-text-muted leading-relaxed">{content}</div>
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-brand-border transform rotate-45"></div>
        </div>
      )}
    </div>
  );
};