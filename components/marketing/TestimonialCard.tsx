
import React from 'react';
import { StarIcon } from '../icons/MiniIcons';

interface TestimonialCardProps {
    quote: string;
    author: string;
    role: string;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({ quote, author, role }) => {
    return (
        <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700 h-full flex flex-col glow-card glow-card-rounded-xl">
            <div className="flex mb-4">
                {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-5 h-5 text-yellow-400" />)}
            </div>
            <p className="text-lg text-gray-300 flex-grow">"{quote}"</p>
            <div className="mt-6">
                <p className="font-bold text-white">{author}</p>
                <p className="text-sm text-gray-400">{role}</p>
            </div>
        </div>
    );
};
