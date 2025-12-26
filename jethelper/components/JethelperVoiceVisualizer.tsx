
import React from 'react';

type VoiceState = 'listening' | 'thinking' | 'speaking';

interface VoiceVisualizerProps {
    state: VoiceState;
    onClick: () => void;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ state, onClick }) => {
    
    let statusText = "";
    let barClasses = "";
    let animationName = "";

    switch (state) {
        case 'listening':
            statusText = "Listening...";
            barClasses = "bg-blue-500";
            animationName = "wave";
            break;
        case 'thinking':
            statusText = "Thinking...";
            barClasses = "bg-yellow-500";
            animationName = "pulse-strong";
            break;
        case 'speaking':
            statusText = "Speaking...";
            barClasses = "bg-green-500";
            animationName = "wave";
            break;
    }
    
    return (
        <div className="flex flex-col items-center justify-center w-full h-full space-y-3">
            <button
                onClick={onClick}
                className="relative rounded-full flex items-center justify-center text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#4A69FF]/50 w-16 h-16"
                aria-label="Stop voice interaction"
            >
                <div className="absolute inset-0 rounded-full bg-[#10182A] border-2 border-[#28334E]"></div>
                
                <div className="relative z-10 h-full w-full flex items-center justify-center">
                    <div className="flex items-end justify-center h-6 space-x-1">
                        {[...Array(5)].map((_, i) => (
                             <span
                                key={i}
                                className={`w-1 rounded-full ${barClasses}`}
                                style={{
                                    animation: `${animationName} 1.5s ease-in-out infinite`,
                                    animationDelay: `${i * 0.1}s`,
                                    height: `${[8, 16, 24, 20, 12][i]}px`
                                }}
                            ></span>
                        ))}
                    </div>
                </div>
            </button>
            <p className="text-sm text-gray-400 font-medium">{statusText}</p>
            <style>{`
                @keyframes wave {
                    0%, 100% { transform: scaleY(0.5); }
                    50% { transform: scaleY(1.5); }
                }
                @keyframes pulse-strong {
                    0%, 100% { transform: scaleY(1); opacity: 1; }
                    50% { transform: scaleY(0.8); opacity: 0.7; }
                }
            `}</style>
        </div>
    );
};
