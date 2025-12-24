
import React, { useState } from 'react';
import { PlusIcon, XMarkIcon } from '../icons/MiniIcons';

interface FaqItemProps {
    question: string;
    answer: string;
    variant?: 'dark' | 'light';
}

export const FaqItem: React.FC<FaqItemProps> = ({ question, answer, variant = 'dark' }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (variant === 'dark') {
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

    // Light theme version
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
