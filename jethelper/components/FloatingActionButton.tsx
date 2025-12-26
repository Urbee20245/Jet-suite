import React from 'react';
import { GrowthIcon } from './GrowthIcon';

interface FloatingActionButtonProps {
    onClick: () => void;
    isHidden: boolean;
}

const StarIcon: React.FC = () => (
    <svg style={{ width: '16px', height: '16px', color: '#FBBF24' }} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick, isHidden }) => {
    if (isHidden) return null;

    const isMobile = window.innerWidth <= 768;

    // MOBILE VERSION - Small circular button
    if (isMobile) {
        return (
            <button
                onClick={onClick}
                style={{
                    position: 'fixed',
                    bottom: '16px',
                    right: '16px',
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                    cursor: 'pointer',
                    zIndex: 9998,
                    transition: 'all 0.3s ease',
                }}
                aria-label="Open chat"
            >
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Pulsing ring */}
                    <span style={{
                        position: 'absolute',
                        width: '75%',
                        height: '75%',
                        borderRadius: '50%',
                        backgroundColor: '#3B82F6',
                        opacity: 0.75,
                        animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                    }} />
                    {/* Icon */}
                    <GrowthIcon className="w-7 h-7" style={{ position: 'relative', zIndex: 1 }} />
                </div>
            </button>
        );
    }

    // DESKTOP VERSION - Full card with ratings
    return (
        <button
            onClick={onClick}
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: '288px',
                padding: '12px',
                background: 'linear-gradient(to right, #1E293B, #0F172A)',
                border: '1px solid #334155',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'white',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                zIndex: 9998,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(59, 130, 246, 0.3)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#334155';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
            }}
            aria-label="Open chat"
        >
            {/* Left side - Text and ratings */}
            <div style={{ flexGrow: 1, textAlign: 'left' }}>
                {/* Title with green dot */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'relative', display: 'flex', width: '8px', height: '8px', marginRight: '8px' }}>
                        <span style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            backgroundColor: '#10B981',
                            opacity: 0.75,
                            animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                        }} />
                        <span style={{
                            position: 'relative',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#10B981'
                        }} />
                    </span>
                    <p style={{ fontWeight: 'bold', fontSize: '16px', margin: 0 }}>JetSuite Helper</p>
                </div>
                
                {/* Stars and rating */}
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px', paddingLeft: '16px' }}>
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <p style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: '8px', margin: 0 }}>Excellent (4.9/5)</p>
                </div>
            </div>
            
            {/* Right side - Animated icon */}
            <div style={{ marginLeft: '16px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{
                        position: 'absolute',
                        width: '75%',
                        height: '75%',
                        borderRadius: '50%',
                        backgroundColor: '#3B82F6',
                        opacity: 0.75,
                        animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                    }} />
                    <div style={{
                        position: 'relative',
                        width: '40px',
                        height: '40px',
                        backgroundColor: '#1E293B',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #334155'
                    }}>
                        <GrowthIcon className="w-6 h-6" />
                    </div>
                </div>
            </div>
        </button>
    );
};
