
import React from 'react';
import type { ReadinessState, Tool } from '../types';
import { ExclamationTriangleIcon } from './icons/MiniIcons';
import { TOOLS } from '../constants';

interface ReadinessBannerProps {
    readinessState: ReadinessState;
    onContinue: () => void;
    setActiveTool: (tool: Tool | null) => void;
}

export const ReadinessBanner: React.FC<ReadinessBannerProps> = ({ readinessState, onContinue, setActiveTool }) => {
    let message = '';
    let recommendation: { text: string; toolId: string; } | null = null;

    if (readinessState === 'Setup Incomplete') {
        message = "Your Business Details are incomplete. We can still generate content, but it will be generic. Complete your profile for better, AI-powered results.";
        recommendation = { text: 'Complete Your Profile', toolId: 'businessdetails' };
    } else if (readinessState === 'Foundation Weak') {
        message = "Your Brand DNA isn't defined yet. Results will be better and more consistent once your brand identity is extracted from your website.";
        recommendation = { text: 'Extract Brand DNA', toolId: 'businessdetails' };
    }

    if (!message) {
        return null;
    }

    const handleRecommendationClick = () => {
        if (recommendation) {
            const tool = TOOLS.find(t => t.id === recommendation.toolId);
            if (tool) {
                setActiveTool(tool);
            }
        }
    }

    return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4 rounded-r-lg mb-6">
            <div className="flex">
                <div className="py-1">
                    <ExclamationTriangleIcon className="w-6 h-6 mr-3" />
                </div>
                <div>
                    <p className="font-bold">Recommendation</p>
                    <p className="text-sm">{message}</p>
                    <div className="mt-3">
                        <button onClick={onContinue} className="text-sm font-semibold text-yellow-800 hover:underline">
                            Proceed Anyway
                        </button>
                        {recommendation && (
                             <button onClick={handleRecommendationClick} className="ml-4 text-sm font-bold bg-yellow-200 text-yellow-900 py-1 px-3 rounded-full hover:bg-yellow-300">
                                {recommendation.text} &rarr;
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
