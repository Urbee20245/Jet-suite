
import React from 'react';

export const TypingIndicator: React.FC = () => {
    return (
        <div className="flex justify-start animate-fade-in-up">
            <div className="p-4 bg-[#1E293B] border border-[#28334E] rounded-lg rounded-bl-none max-w-max">
                <div className="flex items-center justify-center space-x-1.5 h-5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot" style={{ animationDelay: '0s' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot" style={{ animationDelay: '0.4s' }}></span>
                </div>
            </div>
             <style>{`
                @keyframes typing-dot {
                    0%, 60%, 100% {
                        transform: translateY(0);
                        opacity: 0.5;
                    }
                    30% {
                        transform: translateY(-5px);
                        opacity: 1;
                    }
                }
                .animate-typing-dot {
                    animation: typing-dot 1.4s infinite ease-in-out both;
                }
            `}</style>
        </div>
    );
};
