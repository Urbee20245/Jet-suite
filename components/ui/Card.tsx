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
      styles = 'glow-card glow-card-rounded-xl bg-brand-card shadow-lg p-6 rounded-xl';
      break;
    case 2:
      // Section Cards: bg-brand-card, shadow-md, p-4, rounded-lg, border border-brand-border
      styles = 'bg-brand-card shadow-md p-4 rounded-lg border border-brand-border';
      break;
    case 3:
      // Item Cards: bg-brand-card, p-3, rounded-lg, border border-brand-border, No shadow
      styles = 'bg-brand-card p-3 rounded-lg border border-brand-border';
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