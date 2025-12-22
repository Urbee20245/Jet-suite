
import React from 'react';
import { GrowthScoreIcon } from '../../components/icons/ToolIcons';
import { BoltIcon } from '../../components/icons/MiniIcons';
import type { ProfileData } from '../../types';

interface GrowthScoreHistoryProps {
    growthScore: number;
    profileData: ProfileData;
}

export const GrowthScoreHistory: React.FC<GrowthScoreHistoryProps> = ({ growthScore, profileData }) => {
  return (
    <div className="space-y-6">
        <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
            <div className="flex items-center">
                <GrowthScoreIcon className="w-8 h-8 text-accent-purple" />
                <div className="ml-4">
                    <h2 className="text-2xl font-bold text-brand-text">Growth Score</h2>
                    <p className="text-brand-text-muted">Your score reflects your completed strategic tasks.</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-brand-card p-6 rounded-xl shadow-lg flex flex-col items-center justify-center text-center">
                <h3 className="text-lg font-semibold text-brand-text-muted">Current Score</h3>
                <div className="flex items-baseline my-2">
                    <BoltIcon className="w-10 h-10 text-yellow-500" />
                    <span className="text-6xl font-extrabold text-brand-text ml-2">{growthScore}</span>
                </div>
                {profileData.googleBusiness.status !== 'Verified' && (
                    <p className="text-xs text-brand-text-muted mt-1">
                        Local visibility is limited until your Google Business Profile is verified.
                    </p>
                )}
            </div>
            <div className="md:col-span-2 bg-brand-card p-6 rounded-xl shadow-lg">
                 <h3 className="text-lg font-semibold text-brand-text mb-4">Score History</h3>
                 <div className="h-64 bg-brand-light rounded-lg border-2 border-dashed border-brand-border flex items-center justify-center">
                    <p className="text-brand-text-muted font-semibold">Historical Chart Coming Soon</p>
                 </div>
            </div>
        </div>
    </div>
  );
};
