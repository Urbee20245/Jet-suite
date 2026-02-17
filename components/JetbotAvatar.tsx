import React from 'react';
import Lottie from 'lottie-react';
import animationData from '../public/Borisgradient.json';

interface JetbotAvatarProps {
  size?: number;
  className?: string;
}

export const JetbotAvatar: React.FC<JetbotAvatarProps> = ({ size = 40, className = '' }) => {
  return (
    <Lottie
      animationData={animationData}
      loop={true}
      autoplay={true}
      style={{ width: size, height: size, objectFit: 'contain' }}
      className={className}
    />
  );
};
