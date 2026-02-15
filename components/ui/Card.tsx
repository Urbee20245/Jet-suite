import React from 'react';

interface CardProps {
  level?: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ level = 1, children, className = '' }) => {
  let styles = '';

  switch (level) {
    case 1:
      // Main Cards: glow-card, bg-brand-card, shadow-lg, p-6, rounded-xl
      styles = 'glow-card glow-card-rounded-xl bg-brand-card shadow-lg p-6 rounded-xl transition-shadow duration-200';
      break;
    case 2:
      // Section Cards: bg-brand-card, shadow-md, p-5, rounded-xl, border border-brand-border
      styles = 'bg-brand-card shadow-md p-5 rounded-xl border border-brand-border transition-shadow duration-200 hover:shadow-lg';
      break;
    case 3:
      // Item Cards: bg-brand-card, p-4, rounded-lg, border border-brand-border, subtle shadow
      styles = 'bg-brand-card p-4 rounded-lg border border-brand-border shadow-sm transition-all duration-200 hover:shadow-md hover:border-brand-border/80';
      break;
    default:
      styles = 'bg-brand-card p-6 rounded-xl';
  }

  return (
    <div className={`${styles} ${className}`}>
      {children}
    </div>
  );
};