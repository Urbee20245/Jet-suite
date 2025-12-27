import React from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
  isHidden: boolean;
  position?: 'left' | 'right'; // Add position prop
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  onClick, 
  isHidden, 
  position = 'right' // Default to right
}) => {
  if (isHidden) return null;

  // Check if mobile
  const isMobile = window.innerWidth <= 768;

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        [position]: isMobile ? '20px' : '20px', // Dynamic positioning
        bottom: isMobile ? '20px' : '20px',
        width: isMobile ? '60px' : '70px',
        height: isMobile ? '60px' : '70px',
        borderRadius: '50%',
        backgroundColor: '#3B82F6',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 10px 25px rgba(59, 130, 246, 0.5)',
        zIndex: 9999,
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        padding: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 15px 35px rgba(59, 130, 246, 0.7)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.5)';
      }}
    >
      {/* Modern chat icon */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Pulsing ring effect */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          animation: 'pulse 2s infinite',
        }} />
        
        {/* Chat bubble icon */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="32" 
          height="32" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ zIndex: 1 }}
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        
        {/* Notification dot */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: '#10B981',
          animation: 'pulseDot 1.5s infinite',
        }} />
      </div>
      
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(0.95); opacity: 0.7; }
            50% { transform: scale(1.05); opacity: 0.4; }
            100% { transform: scale(0.95); opacity: 0.7; }
          }
          @keyframes pulseDot {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </button>
  );
};
