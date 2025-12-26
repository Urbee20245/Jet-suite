
import React from 'react';

interface SearchResultCardProps {
    userQuery?: string;
    aiResponse?: string;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({ userQuery, aiResponse }) => {
    const hasBoth = userQuery && aiResponse;

    return (
        <div className={`animate-fade-in-up ${hasBoth ? 'space-y-4' : ''}`}>
            {userQuery && (
                <div className="flex justify-end">
                    <div className="p-3 bg-[#3A56D5] rounded-lg rounded-br-none max-w-[80%] shadow-md">
                        <p className="text-white text-sm">{userQuery}</p>
                    </div>
                </div>
            )}
            {aiResponse && (
                 <div className="flex justify-start">
                    <div className="p-4 bg-[#28334E] rounded-lg rounded-bl-none max-w-[80%] shadow-md">
                        <p className="text-gray-200 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\n/g, '<br />') }}></p>
                    </div>
                </div>
            )}
        </div>
    );
};
