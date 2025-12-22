
import React from 'react';
import { CheckCircleIcon } from '../icons/MiniIcons';

interface FeatureCardProps {
    title: string;
    description: string;
    outcome: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, outcome }) => (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 h-full flex flex-col">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="mt-2 text-gray-300 flex-grow">{description}</p>
        <div className="mt-4 pt-4 border-t border-slate-700 flex items-center text-accent-cyan">
            <CheckCircleIcon className="w-5 h-5 mr-2"/>
            <span className="text-sm font-semibold">{outcome}</span>
        </div>
    </div>
);
