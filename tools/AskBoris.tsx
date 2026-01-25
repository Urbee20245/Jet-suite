import React from 'react';
import { BorisChat } from '../components/BorisChat';
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <BorisChat 
          context={context}
          onNavigateToTool={(toolId) => {
            const tool = ALL_TOOLS[toolId];
            if (tool) onNavigate(tool.id);
          }}
          showHeader={true}
        />
      </div>
    </div>
  );
};