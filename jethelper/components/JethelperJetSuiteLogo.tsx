
import React from 'react';

interface JetSuiteLogoProps {
    className?: string;
}

export const JetSuiteLogo: React.FC<JetSuiteLogoProps> = ({ className }) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M37.1583 14.7333L22.95 2.53333C21.4333 1.28333 19.1667 1.28333 17.65 2.53333L3.44167 14.7333C1.86667 16.05 1.63333 18.4333 2.85 20.1L17.0583 37.2C18.5333 39.1167 21.4333 39.1167 22.9083 37.2L37.1167 20.1C38.3333 18.4333 38.1 16.05 37.1583 14.7333Z" fill="#4A69FF"/>
        <path d="M22.9248 2.53333L19.9998 10L11.6665 21.6667L22.9248 37.2333C21.4498 39.15 18.5498 39.15 17.0748 37.2333L2.8665 20.1333C1.64984 18.4667 1.88317 16.0833 3.45817 14.7667L17.6665 2.53333C19.1832 1.28333 21.4498 1.28333 22.9248 2.53333Z" fill="#2D44B3"/>
    </svg>
);
