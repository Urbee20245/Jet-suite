import React, { useState, useEffect } from 'react';
import { SparklesIcon as SparklesIconSolid, ArrowRightIcon, ChatBubbleLeftRightIcon, BoltIcon, CheckCircleIcon } from './icons/MiniIcons';
import { ALL_TOOLS } from '../constants';

interface BorisProps {
  userFirstName: string;
  profileData: any;
  growthPlanTasks: any[];
  hasNewReviews: boolean;
  newReviewsCount: number;
  onNavigate: (toolId: string) => void;
  onReplyToReviews: () => void;
  onTaskStatusChange: (taskId: string, newStatus: 'completed') => void;
}

export const Boris: React.FC<BorisProps> = ({
  userFirstName,
  profileData,
  growthPlanTasks,
  hasNewReviews,
  newReviewsCount,
  onNavigate,
  onReplyToReviews,
  onTaskStatusChange
}) => {
  
  // This component is now a placeholder/redirect for the full BorisChat experience.
  // The logic for determining the next step is now handled by the AI in borisAIService.ts

  const handleNavigateToChat = () => {
    onNavigate(ALL_TOOLS['ask-boris'].id);
  };

  const handleReply = () => {
    onReplyToReviews();
  };

  const pendingTasks = growthPlanTasks.filter(t => t.status !== 'completed').length;
  const nextAction = hasNewReviews 
    ? `Reply to ${newReviewsCount} new review${newReviewsCount > 1 ? 's' : ''}`
    : pendingTasks > 0
    ? `Complete ${pendingTasks} pending task${pendingTasks > 1 ? 's' : ''}`
    : 'Run your first audit';

  return (
    <div className="bg-[#2D1B4E] border-2 border-purple-600 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl"></div>
      
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 ring-4 ring-purple-500/20">
          <SparklesIconSolid className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-white">Boris</h3>
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
              Your Growth Coach
            </span>
          </div>
          <p className="text-xs text-gray-400">Motivating you to take action TODAY</p>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
        <p className="text-gray-200 whitespace-pre-line leading-relaxed">
          Hello, {userFirstName}! I'm ready to guide you through your growth plan. 
          Your next critical action is: <strong className="text-white">{nextAction}</strong>.
        </p>
      </div>

      <button
        onClick={handleNavigateToChat}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 group"
      >
        Ask Boris Anything
        <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>

      <div className="mt-3 text-sm flex items-center justify-center gap-4">
        <button
          onClick={handleReply}
          className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1"
        >
          <ChatBubbleLeftRightIcon className="w-4 h-4" />
          {hasNewReviews ? `Reply to ${newReviewsCount} Reviews` : 'View Growth Plan'}
        </button>
      </div>
    </div>
  );
};