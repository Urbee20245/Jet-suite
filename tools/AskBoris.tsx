import React, { useEffect } from 'react';
import { BorisChatModal } from '../components/BorisChatModal';
import type { ProfileData, GrowthPlanTask } from '../types';
import type { BorisContext } from '../services/borisAIService';
import { ALL_TOOLS } from '../constants';

interface AskBorisPageProps {
  userFirstName: string;
  profileData: ProfileData;
  growthPlanTasks: GrowthPlanTask[];
  hasNewReviews: boolean;
  newReviewsCount: number;
  onNavigate: (toolId: string) => void;
  onReplyToReviews: () => void;
  onTaskStatusChange: (taskId: string, status: 'completed') => void;
  onClose?: () => void;
}

export const AskBorisPage: React.FC<AskBorisPageProps> = ({
  userFirstName,
  profileData,
  growthPlanTasks,
  hasNewReviews,
  newReviewsCount,
  onNavigate,
  onReplyToReviews,
  onTaskStatusChange,
  onClose
}) => {

  // Build context for Boris
  const completedAudits: string[] = [];
  if (profileData.jetbizAnalysis) completedAudits.push('JetBiz');
  if (profileData.jetvizAnalysis) completedAudits.push('JetViz');

  const pendingTasks = growthPlanTasks.filter(t => t.status !== 'completed');
  const completedTasks = growthPlanTasks.filter(t => t.status === 'completed');

  // Simple Growth Score calculation for context (actual score is calculated in InternalApp)
  const calculateGrowthScore = () => {
    let score = 0;
    if (profileData.business.is_complete) score += 10;
    if (profileData.business.isDnaApproved) score += 10;
    if (profileData.googleBusiness.status === 'Verified') score += 15;
    score += Math.min(completedTasks.length * 5, 50);
    return Math.min(score, 99);
  };

  const context: BorisContext = {
    userName: userFirstName || 'there',
    businessName: profileData.business.business_name,
    growthScore: calculateGrowthScore(),
    pendingTasks: pendingTasks.length,
    completedAudits,
    urgentTasks: pendingTasks.filter(t => t.priority === 'High').slice(0, 3),
    newReviews: newReviewsCount
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Navigate back to home if no onClose handler
      onNavigate('home');
    }
  };

  return (
    <BorisChatModal
      context={context}
      onClose={handleClose}
      onNavigateToTool={(toolId) => {
        const tool = ALL_TOOLS[toolId];
        if (tool) onNavigate(tool.id);
      }}
      onTaskComplete={(taskId) => onTaskStatusChange(taskId, 'completed')}
      urgentTasks={pendingTasks.filter(t => t.priority === 'High').slice(0, 3)}
    />
  );
};