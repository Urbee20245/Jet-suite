"use client";

import React from 'react';
import type { ProfileData } from '../types';
import { BoltIcon, StarIcon, CheckCircleIcon, ChatBubbleLeftRightIcon } from '../components/icons/MiniIcons';

interface QuickStatsCardsProps {
    profileData: ProfileData;
    growthScore: number;
    pendingTasksCount: number;
    reviewResponseRate: number;
}

const StatCard: React.FC<{ title: string; value: React.ReactNode; icon: React.ReactNode; color: string; borderColor: string; }> = ({ title, value, icon, color, borderColor }) => (
    <div className={`bg-brand-card p-4 rounded-xl shadow-lg border ${borderColor} flex flex-col justify-between glow-card glow-card-rounded-xl h-full`}>
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

export const QuickStatsCards: React.FC<QuickStatsCardsProps> = ({ profileData, growthScore, pendingTasksCount, reviewResponseRate }) => {
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
            <p className="text-[10px] font-bold text-accent-purple truncate mb-1 uppercase tracking-wider" title={business.business_name}>
                {business.business_name}
            </p>
            <p className="text-2xl font-extrabold text-brand-text flex items-center">
                {gbpRating.toFixed(1)}
                <span className="text-lg ml-1">★</span>
            </p>
            <p className="text-xs text-brand-text-muted mt-1">{gbpReviews} Reviews ({gbpStatus})</p>
        </>
    );

    // 3. Review Response Rate Card
    const reviewColor = reviewResponseRate >= 90 ? 'bg-green-500' : reviewResponseRate >= 70 ? 'bg-blue-500' : 'bg-orange-500';
    const reviewBorder = reviewResponseRate >= 90 ? 'border-green-500/30' : reviewResponseRate >= 70 ? 'border-blue-500/30' : 'border-orange-500/30';
    const reviewIconColor = reviewResponseRate >= 90 ? 'text-green-500' : reviewResponseRate >= 70 ? 'text-blue-500' : 'text-orange-500';
    const reviewIcon = <ChatBubbleLeftRightIcon className={`w-5 h-5 ${reviewIconColor}`} />;
    const reviewValue = (
        <>
            <p className="text-2xl font-extrabold text-brand-text">{reviewResponseRate}%</p>
            <p className="text-xs text-brand-text-muted mt-1">Response Rate</p>
        </>
    );

    // 4. Pending Tasks Card
    const taskColor = pendingTasksCount === 0 ? 'bg-green-500' : pendingTasksCount <= 3 ? 'bg-blue-500' : 'bg-yellow-500';
    const taskBorder = pendingTasksCount === 0 ? 'border-green-500/30' : pendingTasksCount <= 3 ? 'border-blue-500/30' : 'border-yellow-500/30';
    const taskIconColor = pendingTasksCount === 0 ? 'text-green-500' : pendingTasksCount <= 3 ? 'text-blue-500' : 'text-yellow-500';
    const taskIcon = pendingTasksCount === 0 ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : <BoltIcon className={`w-5 h-5 ${taskIconColor}`} />;
    
    const taskValue = (
        <>
            <p className="text-2xl font-extrabold text-brand-text">
                {pendingTasksCount}
            </p>
            <p className="text-xs text-brand-text-muted mt-1">
                {pendingTasksCount === 0 ? 'All caught up! 🎉' : pendingTasksCount === 1 ? 'Task to complete' : 'Tasks to complete'}
            </p>
        </>
    );

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard title="Growth Score" value={growthScoreValue} icon={growthScoreIcon} color={growthScoreColor} borderColor={growthScoreBorder} />
            <StatCard title="GBP Rating" value={gbpValue} icon={gbpIcon} color={gbpColor} borderColor={gbpBorder} />
            <StatCard title="Review Health" value={reviewValue} icon={reviewIcon} color={reviewColor} borderColor={reviewBorder} />
            <StatCard title="Pending Tasks" value={taskValue} icon={taskIcon} color={taskColor} borderColor={taskBorder} />
        </div>
    );
};