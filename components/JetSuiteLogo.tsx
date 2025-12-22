
import React from 'react';

export const JetSuiteLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stopColor="#06B6D4" />
        <stop offset="50%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
    </defs>
    
    <g fill="url(#logoGradient)">
      <path d="M50,22 L5,35 L50,48 L30,35 Z" />
      <path d="M60,19 L15,35 L60,51 L40,35 Z" />
    </g>
  </svg>
);
