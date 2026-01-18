"use client";

import React from 'react';
import type { ProfileData, ReadinessState } from '../types';
import { BoltIcon, StarIcon, DnaIcon, CheckCircleIcon, ExclamationTriangleIcon, LockClosedIcon } from '../components/icons/MiniIcons';

interface QuickStatsCardsProps {
    profileData: ProfileData;
    growthScore: number;
    readinessState: ReadinessState;
}

const StatCard: React.FC<{ title: string; value: React.ReactNode; icon: React.ReactNode; color: string; borderColor: string; }> = ({ title, value, icon, color, borderColor }) => (
    <div className={`bg-brand-card p-4 rounded-xl shadow-lg border ${borderColor} flex flex-col justify-between glow-card glow-card-rounded-xl`}>
        <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-brand-text-muted">{title}</h3>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color} bg-opacity-10`}>
                {icon}
            </div>
        </div>
        <div className="mt-2">
            {value}
        </div>
    </div>
);

export const QuickStatsCards: React.FC<QuickStatsCardsProps> = ({ profileData, growthScore, readinessState }) => {
    const { googleBusiness, business } = profileData;

    // 1. Growth Score Card
    const growthScoreLevel = growthScore >= 80 ? 'Excellent' : growthScore >= 60 ? 'Strong' : 'Building';
    const growthScoreColor = growthScore >= 80 ? 'bg-green-500' : growthScore >= 60 ? 'bg-blue-500' : 'bg-yellow-500';
    const growthScoreBorder = growthScore >= 80 ? 'border-green-500/30' : growthScore >= 60 ? 'border-blue-500/30' : 'border-yellow-500/30';
    const growthScoreIconColor = growthScore >= 80 ? 'text-green-500' : growthScore >= 60 ? 'text-blue-500' : 'text-yellow-500';
    const growthScoreIcon = <BoltIcon className={`w-5 h-5 ${growthScoreIconColor}`} />;
    const growthScoreValue = (
        <>
            <p className="text-2xl font-extrabold text-brand-text">{growthScore}</p>
            <p className="text-xs text-brand-text-muted mt-1">{growthScoreLevel} Momentum</p>
        </>
    );

    // 2. GBP Rating Card
    const gbpRating = googleBusiness.rating || 0;
    const gbpReviews = googleBusiness.reviewCount || 0;
    const gbpStatus = gbpRating >= 4.5 ? 'Excellent' : gbpRating > 0 ? 'Good' : 'N/A';
    const gbpColor = gbpRating >= 4.5 ? 'bg-yellow-500' : 'bg-gray-500';
    const gbpBorder = gbpRating >= 4.5 ? 'border-yellow-500/30' : 'border-gray-500/30';
    const gbpIconColor = gbpRating >= 4.5 ? 'text-yellow-500' : 'text-gray-500';
    const gbpIcon = <StarIcon className={`w-5 h-5 ${gbpIconColor}`} />;
    const gbpValue = (
        <>
            <p className="text-2xl font-extrabold text-brand-text flex items-center">
                {gbpRating.toFixed(1)}
                <span className="text-lg ml-1">★</span>
            </p>
            <p className="text-xs text-brand-text-muted mt-1">{gbpReviews} Reviews ({gbpStatus})</p>
        </>
    );

    // 3. DNA Status Card
    const dnaApproved = business.isDnaApproved;
    const dnaColor = dnaApproved ? 'bg-accent-purple' : 'bg-red-500';
    const dnaBorder = dnaApproved ? 'border-accent-purple/30' : 'border-red-500/30';
    const dnaIconColor = dnaApproved ? 'text-accent-purple' : 'text-red-500';
    const dnaIcon = <DnaIcon className={`w-5 h-5 ${dnaIconColor}`} />;
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
    let readinessBorder;
    let readinessText;
    if (readinessState === 'Foundation Ready') {
        readinessIcon = <CheckCircleIcon className="w-5 h-5 text-green-500" />;
        readinessColor = 'bg-green-500';
        readinessBorder = 'border-green-500/30';
        readinessText = 'Ready';
    } else if (readinessState === 'Foundation Weak') {
        readinessIcon = <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
        readinessColor = 'bg-yellow-500';
        readinessBorder = 'border-yellow-500/30';
        readinessText = 'Weak';
    } else {
        readinessIcon = <LockClosedIcon className="w-5 h-5 text-red-500" />;
        readinessColor = 'bg-red-500';
        readinessBorder = 'border-red-500/30';
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
            <StatCard title="Growth Score" value={growthScoreValue} icon={growthScoreIcon} color={growthScoreColor} borderColor={growthScoreBorder} />
            <StatCard title="GBP Rating" value={gbpValue} icon={gbpIcon} color={gbpColor} borderColor={gbpBorder} />
            <StatCard title="Brand DNA" value={dnaValue} icon={dnaIcon} color={dnaColor} borderColor={dnaBorder} />
            <StatCard title="Readiness" value={readinessValue} icon={readinessIcon} color={readinessColor} borderColor={readinessBorder} />
        </div>
    );
};