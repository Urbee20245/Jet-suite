import React from 'react';

interface JetbotAvatarProps {
  size?: number;
  className?: string;
}

export const JetbotAvatar: React.FC<JetbotAvatarProps> = ({ size = 40, className = '' }) => {
  return (
    <img
      src="/BorisAI.gif"
      alt="Boris AI avatar"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
};
