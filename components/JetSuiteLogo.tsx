
import React from 'react';

interface JetSuiteLogoProps {
  className?: string;
}

export const JetSuiteLogo: React.FC<JetSuiteLogoProps> = ({ className }) => (
  <img 
    src="/images/jetsuite-logo.png" 
    alt="JetSuite Logo" 
    className={className}
    style={{ objectFit: 'contain' }}
  />
);
