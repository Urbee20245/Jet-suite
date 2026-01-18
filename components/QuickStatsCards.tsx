"use client";

import React from 'react';
import type { ProfileData, ReadinessState } from '../types';
import { BoltIcon, StarIcon, DnaIcon, CheckCircleIcon, ExclamationTriangleIcon, LockClosedIcon } from '../components/icons/MiniIcons';

interface QuickStatsCardsProps {
    profileData: ProfileData;
    growthScore: number;
    readinessState: ReadinessState;
}

const StatCard: React.FC<{ title: string; value: React.ReactNode; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-brand-card p-6 rounded-xl shadow-lg border border-brand-border flex flex-col justify-between aspect-square min-h-[150px] glow-card glow-card-rounded-xl">
        <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-brand-text-muted">{title}</h3>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} bg-opacity-10`}>
                {icon}
            </div>
        </div>
        <div className="mt-4">
            {value}
        </div>
    </div>
);

export const QuickStatsCards: React.FC<QuickStatsCardsProps> = ({ profileData, growthScore, readinessState }) => {
    const { googleBusiness, business } = profileData;

    // 1. Growth Score Card
    const growthScoreLevel = growthScore >= 80 ? 'Excellent' : growthScore >= 60 ? 'Strong' : 'Building';
    const growthScoreColor = growthScore >= 80 ? 'bg-green-500' : growthScore >= 60 ? 'bg-blue-500' : 'bg-yellow-500';
    const growthScoreIcon = <BoltIcon className={`w-6 h-6 ${growthScoreColor}`} />;
    const growthScoreValue = (
        <>
            <p className="text-3xl font-extrabold text-brand-text">{growthScore}</p>
            <p className="text-xs text-brand-text-muted mt-1">{growthScoreLevel} Momentum</p>
        </>
    );

    // 2. GBP Rating Card
    const gbpRating = googleBusiness.rating || 0;
    const gbpReviews = googleBusiness.reviewCount || 0;
    const gbpStatus = gbpRating >= 4.5 ? 'Excellent' : gbpRating > 0 ? 'Good' : 'N/A';
    const gbpColor = gbpRating >= 4.5 ? 'bg-yellow-500' : 'bg-gray-500';
    const gbpIcon = <StarIcon className={`w-6 h-6 ${gbpColor}`} />;
    const gbpValue = (
        <>
            <p className="text-3xl font-extrabold text-brand-text flex items-center">
                {gbpRating.toFixed(1)}
                <span className="text-xl ml-1">★</span>
            </p>
            <p className="text-xs text-brand-text-muted mt-1">{gbpReviews} Reviews ({gbpStatus})</p>
        </>
    );

    // 3. DNA Status Card
    const dnaApproved = business.isDnaApproved;
    const dnaColor = dnaApproved ? 'bg-accent-purple' : 'bg-red-500';
    const dnaIcon = <DnaIcon className={`w-6 h-6 ${dnaApproved ? 'text-accent-purple' : 'text-red-500'}`} />;
    const dnaValue = (
        <>
            <p className="text-xl font-extrabold text-brand-text flex items-center gap-2">
                {dnaApproved ? 'Approved' : 'Missing'}
            </p>
            <p className="text-xs text-brand-text-muted mt-1">Brand DNA Status</p>
        </>
    );

    // 4. Profile Readiness Card
    let readinessIcon;
    let readinessColor;
    let readinessText;
    if (readinessState === 'Foundation Ready') {
        readinessIcon = <CheckCircleIcon className="w-6 h-6 text-green-500" />;
        readinessColor = 'bg-green-500';
        readinessText = 'Ready';
    } else if (readinessState === 'Foundation Weak') {
        readinessIcon = <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />;
        readinessColor = 'bg-yellow-500';
        readinessText = 'Weak';
    } else {
        readinessIcon = <LockClosedIcon className="w-6 h-6 text-red-500" />;
        readinessColor = 'bg-red-500';
        readinessText = 'Incomplete';
    }
    
    const readinessValue = (
        <>
            <p className="text-xl font-extrabold text-brand-text flex items-center gap-2">
                {readinessText}
            </p>
            <p className="text-xs text-brand-text-muted mt-1">Profile Readiness</p>
        </>
    );

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard title="Growth Score" value={growthScoreValue} icon={growthScoreIcon} color={growthScoreColor} />
            <StatCard title="GBP Rating" value={gbpValue} icon={gbpIcon} color={gbpColor} />
            <StatCard title="Brand DNA" value={dnaValue} icon={dnaIcon} color={dnaColor} />
            <StatCard title="Readiness" value={readinessValue} icon={readinessIcon} color={readinessColor} />
        </div>
    );
};