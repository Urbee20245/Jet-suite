
import React from 'react';

type AppState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'text_input';

interface AIStatusIndicatorProps {
    state: AppState;
}

export const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({ state }) => {
    if (state !== 'thinking' && state !== 'speaking') {
        return null;
    }

    const isThinking = state === 'thinking';
    const statusText = isThinking ? "AI is thinking..." : "AI is speaking...";
    
    return (
        <div className="flex items-center space-x-2 p-2 animate-fade-in-up">
            {isThinking ? (
                 <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse-dot" style={{ animationDelay: '0s' }}></span>
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse-dot" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse-dot" style={{ animationDelay: '0.4s' }}></span>
                </div>
            ) : (
                <div className="flex items-end justify-center h-4 space-x-1">
                    <span className="w-1 h-2 bg-green-500 rounded-full animate-wave-bar" style={{ animationDelay: '0s' }}></span>
                    <span className="w-1 h-4 bg-green-500 rounded-full animate-wave-bar" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-1 h-3 bg-green-500 rounded-full animate-wave-bar" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1 h-4 bg-green-500 rounded-full animate-wave-bar" style={{ animationDelay: '0.3s' }}></span>
                    <span className="w-1 h-2 bg-green-500 rounded-full animate-wave-bar" style={{ animationDelay: '0.4s' }}></span>
                </div>
            )}
            <p className="text-xs text-gray-400">{statusText}</p>
             <style>{`
                @keyframes pulse-dot {
                    0%, 80%, 100% {
                        transform: scale(0.5);
                        opacity: 0.5;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .animate-pulse-dot {
                    animation: pulse-dot 1.4s infinite ease-in-out both;
                }

                @keyframes wave-bar {
                    0%, 100% { transform: scaleY(0.5); }
                    50% { transform: scaleY(1.5); }
                }
                .animate-wave-bar {
                     animation: wave-bar 1.2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
