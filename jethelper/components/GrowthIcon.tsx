
import React from 'react';

interface GrowthIconProps {
    className?: string;
}

export const GrowthIcon: React.FC<GrowthIconProps> = ({ className }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
    >
        <path 
            d="M3 17L9 11L13 15L21 7M21 7H15M21 7V13" 
            stroke="#4A69FF" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
    </svg>
);
