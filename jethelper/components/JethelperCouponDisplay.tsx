
import React, { useState } from 'react';

interface CouponDisplayProps {
    code: string;
}

const Sparkles: React.FC = () => (
    <>
        {[...Array(8)].map((_, i) => (
            <div
                key={i}
                className="sparkle"
                style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                }}
            />
        ))}
    </>
);


export const CouponDisplay: React.FC<CouponDisplayProps> = ({ code }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-0.5 my-2 w-full max-w-sm mx-auto bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-600 rounded-xl animate-fade-in-up relative overflow-hidden">
             <style>{`
                @keyframes sparkle-anim {
                    0% { transform: scale(0) rotate(0deg); opacity: 0.5; }
                    50% { opacity: 1; }
                    100% { transform: scale(1.5) rotate(90deg); opacity: 0; }
                }
                .sparkle {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: white;
                    border-radius: 50%;
                    box-shadow: 0 0 5px white, 0 0 10px white;
                    animation: sparkle-anim linear infinite;
                    pointer-events: none;
                }
                 @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .shimmer-text {
                    background: linear-gradient(90deg, #A7B3FF 0%, #FFFFFF 25%, #A7B3FF 50%, #FFFFFF 75%, #A7B3FF 100%);
                    background-size: 200% auto;
                    color: transparent;
                    background-clip: text;
                    -webkit-background-clip: text;
                    animation: shimmer 4s linear infinite;
                }
            `}</style>
            <Sparkles />
            <div className="bg-[#1E293B] rounded-lg p-4 text-center shadow-lg w-full h-full">
                <h3 className="text-lg font-bold text-white mb-2">Your Exclusive Coupon is Here!</h3>
                <p className="text-gray-400 mb-4 text-xs px-2">One-time use on all products. Valid for as long as you have an active subscription.</p>
                <div className="flex items-center justify-center space-x-2 bg-black/20 p-2 rounded-lg border-2 border-dashed border-[#4A69FF]/50">
                    <span className="text-xl font-bold tracking-widest text-white shimmer-text">{code}</span>
                    <button
                        onClick={handleCopy}
                        className="px-3 py-1 bg-[#4A69FF] text-white font-semibold rounded-md hover:bg-[#3A56D5] transition-colors text-xs z-10"
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>
        </div>
    );
};
