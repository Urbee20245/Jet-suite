
import React from 'react';
import { GrowthIcon } from './JethelperGrowthIcon';

interface FloatingActionButtonProps {
    onClick: () => void;
    isHidden: boolean;
}

const StarIcon: React.FC = () => (
    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);


export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick, isHidden }) => {
    return (
        <button
            onClick={onClick}
            className={`jetsuite-fab ${isHidden ? 'hidden' : ''} w-72 p-3 bg-gradient-to-r from-[#1E293B] to-[#10182A] border border-[#28334E] rounded-xl flex items-center justify-between text-white shadow-lg hover:border-[#4A69FF] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#4A69FF]/50`}
            aria-label="Open chat"
        >
            <div className="flex-grow text-left">
                <div className="flex items-center">
                    <span className="relative flex h-2 w-2 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <p className="font-bold text-base">JetSuite Helper</p>
                </div>
                <div className="flex items-center mt-1 pl-4">
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <p className="text-xs text-gray-400 ml-2">Excellent (4.9/5)</p>
                </div>
            </div>
            <div className="ml-4 w-12 h-12 flex items-center justify-center">
                 <div className="relative w-full h-full flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-3/4 w-3/4 rounded-full bg-[#4A69FF] opacity-75"></span>
                    <div className="relative w-10 h-10 bg-[#1E293B] rounded-full flex items-center justify-center border border-[#28334E]">
                        <GrowthIcon className="w-6 h-6" />
                    </div>
                </div>
            </div>
        </button>
    );
};
