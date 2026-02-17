import React from 'react';
import Lottie from 'lottie-react';
import borisAnimation from '../assets/boris-animation.json';

interface JetbotAvatarProps {
  size?: number;
  className?: string;
}

export const JetbotAvatar: React.FC<JetbotAvatarProps> = ({ size = 40, className = '' }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={className}
      aria-label="Boris AI avatar"
      role="img"
    >
      <Lottie
        animationData={borisAnimation}
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
