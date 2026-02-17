import React from 'react';
import Lottie from 'lottie-react';
import animationData from '../public/Borisgradient.json';

interface JetbotAvatarProps {
  size?: number;
  className?: string;
}

export const JetbotAvatar: React.FC<JetbotAvatarProps> = ({ size = 40, className = '' }) => {
  // The animation is 621×360 (landscape). Scale so height fills `size` and
  // center horizontally — identical to CSS object-fit: cover for a circle.
  const scaledWidth = Math.ceil(size * (621 / 360));
  return (
    <div
      className={className}
      style={{ width: size, height: size, overflow: 'hidden', position: 'relative' }}
    >
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: scaledWidth,
          height: size,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
};
