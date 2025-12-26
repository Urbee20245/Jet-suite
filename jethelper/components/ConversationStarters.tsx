
import React from 'react';

interface ConversationStartersProps {
    onSelect: (starterText: string) => void;
}

type Starter = {
    text: string;
    type: 'prompt' | 'link';
    url?: string;
};

const starters: Starter[] = [
    { text: "What is JetSuite?", type: 'prompt' },
    { text: "Tell me about the Free Tools", type: 'prompt' },
    { text: "Show me the Jetbiz Demo", type: 'link', url: 'https://www.getjetsuite.com/demo/jetbiz' },
    { text: "Show me the Jetviz Demo", type: 'link', url: 'https://www.getjetsuite.com/demo/jetviz' },
    { text: "Book a Live Demo Session", type: 'link', url: 'https://tidycal.com/team/jetsuit/jetsuite-demo' },
    { text: "I'd like the 20% discount!", type: 'prompt' },
];

const ExternalLinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1.5 inline-block text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);


export const ConversationStarters: React.FC<ConversationStartersProps> = ({ onSelect }) => {
    
    const handleClick = (starter: Starter) => {
        if (starter.type === 'link' && starter.url) {
            window.open(starter.url, '_blank', 'noopener,noreferrer');
        } else {
            onSelect(starter.text);
        }
    };
    
    return (
        <div className="flex flex-wrap items-center justify-center gap-2 p-2 animate-fade-in-up">
            {starters.map((starter) => (
                <button
                    key={starter.text}
                    onClick={() => handleClick(starter)}
                    className="flex items-center px-3 py-1.5 bg-transparent border-2 border-[#28334E] rounded-full text-sm text-gray-300 hover:bg-[#1E293B] hover:border-[#4A69FF] transition-colors"
                >
                    {starter.text}
                    {starter.type === 'link' && <ExternalLinkIcon />}
                </button>
            ))}
        </div>
    );
};