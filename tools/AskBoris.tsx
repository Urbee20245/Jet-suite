import React from 'react';
import { BorisChat } from '../components/BorisChat';
import type { ProfileData, GrowthPlanTask } from '../types';
import type { BorisContext } from '../services/borisAIService';

interface AskBorisPageProps {
  userFirstName: string;
  profileData: ProfileData;
  growthPlanTasks: GrowthPlanTask[];
  hasNewReviews: boolean;
  newReviewsCount: number;
  onNavigate: (toolId: string) => void;
  onReplyToReviews: () => void;
  onTaskStatusChange: (taskId: string, status: 'completed') => void;
}

export const AskBorisPage: React.FC<AskBorisPageProps> = ({
  userFirstName,
  profileData,
  growthPlanTasks,
  hasNewReviews,
  newReviewsCount,
  onNavigate,
  onReplyToReviews,
  onTaskStatusChange
}) => {
  
  // Build context for Boris
  const completedAudits: string[] = [];
  if (profileData.jetbizAnalysis) completedAudits.push('JetBiz');
  if (profileData.jetvizAnalysis) completedAudits.push('JetViz');

  // Get urgent tasks (high priority, not completed)
  const urgentTasks = growthPlanTasks
    .filter(t => t.status !== 'completed' && t.priority === 'High')
    .slice(0, 3);

  // Calculate growth score (you can adjust this logic as needed)
  const calculateGrowthScore = () => {
    let score = 0;
    if (profileData.business.is_complete) score += 10;
    if (profileData.business.isDnaApproved) score += 10;
    if (profileData.googleBusiness?.status === 'Verified') score += 15;
    const completedCount = growthPlanTasks.filter(t => t.status === 'completed').length;
    score += Math.min(completedCount * 5, 50);
    return Math.min(score, 99);
  };

  const context: BorisContext = {
    userName: userFirstName || 'there',
    businessName: profileData.business.business_name,
    growthScore: calculateGrowthScore(),
    pendingTasks: growthPlanTasks.filter(t => t.status !== 'completed').length,
    completedAudits,
    urgentTasks,
    newReviews: newReviewsCount
  };

  return (
    <div className="h-full">
      <BorisChat 
        context={context}
        onNavigateToTool={onNavigate}
        showHeader={true}
        urgentTasks={urgentTasks}
        onTaskComplete={onTaskStatusChange}
      />
    </div>
  );
};