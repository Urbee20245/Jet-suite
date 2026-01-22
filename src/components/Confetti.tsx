import React from 'react';
import ReactConfetti from 'react-confetti';

interface ConfettiProps {
  onComplete: () => void;
}

export const Confetti: React.FC<ConfettiProps> = ({ onComplete }) => {
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    // Set dimensions on mount
    const { innerWidth: width, innerHeight: height } = window;
    setDimensions({ width, height });
  }, []);

  if (dimensions.width === 0) {
    return null;
  }

  return (
    <ReactConfetti
      width={dimensions.width}
      height={dimensions.height}
      recycle={false}
      numberOfPieces={500}
      gravity={0.15}
      onConfettiComplete={() => {
        onComplete();
      }}
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 1000 }}
    />
  );
};