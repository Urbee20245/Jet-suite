
import React, { useState } from 'react';
import { PlusIcon, XMarkIcon } from '../icons/MiniIcons';

interface FaqItemProps {
    question: string;
    answer: string;
}

export const FaqItem: React.FC<FaqItemProps> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Check if the component is rendered on a light or dark background
    // This is a simple check; a more robust solution might use React Context
    const parentBg = typeof window !== 'undefined' 
        ? window.getComputedStyle(document.body).getPropertyValue('background-color') 
        : 'rgb(2, 6, 23)'; // default to dark
        
    const isDarkBg = parentBg.includes('rgb(2, 6, 23)') || parentBg.includes('#020617');

    if (isDarkBg) {
        return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex justify-between items-center text-left p-6"
                >
                    <h3 className="text-lg font-semibold text-white">{question}</h3>
                    {isOpen 
                        ? <XMarkIcon className="w-6 h-6 text-gray-400 flex-shrink-0"/> 
                        : <PlusIcon className="w-6 h-6 text-gray-400 flex-shrink-0"/>
                    }
                </button>
                {isOpen && (
                    <div className="px-6 pb-6 text-gray-300">
                       <p>{answer}</p>
                    </div>
                )}
            </div>
        );
    }

    // Light theme version for sections with a white background
    return (
        <div className="bg-white border border-gray-200 rounded-lg">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left p-6"
            >
                <h3 className="text-lg font-semibold text-brand-text">{question}</h3>
                {isOpen 
                    ? <XMarkIcon className="w-6 h-6 text-brand-text-muted flex-shrink-0"/> 
                    : <PlusIcon className="w-6 h-6 text-brand-text-muted flex-shrink-0"/>
                }
            </button>
            {isOpen && (
                <div className="px-6 pb-6 text-brand-text-muted">
                   <p>{answer}</p>
                </div>
            )}
        </div>
    );
};
