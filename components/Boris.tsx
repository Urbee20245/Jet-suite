import React, { useState, useEffect } from 'react';
import { SparklesIcon as SparklesIconSolid, ArrowRightIcon, ChatBubbleLeftRightIcon, BoltIcon } from './icons/MiniIcons';

interface BorisProps {
  userFirstName: string;
  profileData: any;
  growthPlanTasks: any[];
  hasNewReviews: boolean;
  newReviewsCount: number;
  onNavigate: (toolId: string) => void;
  onReplyToReviews: () => void;
}

interface BorisState {
  stage: 'business_details' | 'jetbiz' | 'jetviz' | 'growth_plan' | 'daily_tools';
  message: string;
  actionButton: { text: string; onClick: () => void; } | null;
  completedItems: string[];
  todaysTasks: any[];
  showUpsell: boolean;
}

const UPSELL_KEYWORDS = {
  WEBSITE: ['website', 'speed', 'layout', 'responsive', 'redesign', 'landing page'],
  SEO: ['ranking', 'keywords', 'meta', 'schema', 'seo'],
  CITATIONS: ['citation', 'directory', 'listing', 'nap'],
  AUTOMATION: ['automation', 'workflow', 'integration', 'api', 'automated'],
};

const shouldShowUpsell = (task: any): boolean => {
  if (!task || !task.title) return false;
  const taskText = `${task.title.toLowerCase()} ${task.description?.toLowerCase() || ''}`;
  const allKeywords = Object.values(UPSELL_KEYWORDS).flat();
  return allKeywords.some(keyword => taskText.includes(keyword));
};

export const Boris: React.FC<BorisProps> = ({
  userFirstName,
  profileData,
  growthPlanTasks,
  hasNewReviews,
  newReviewsCount,
  onNavigate,
  onReplyToReviews
}) => {
  const [borisState, setBorisState] = useState<BorisState | null>(null);
  const [showWhyDialog, setShowWhyDialog] = useState(false);
  const [whyResponseCount, setWhyResponseCount] = useState(0);

  useEffect(() => {
    determineBorisState();
  }, [profileData, growthPlanTasks, hasNewReviews, userFirstName]);

  const determineBorisState = () => {
    const hasBusinessDetails = profileData?.business?.business_name && 
                                profileData?.business?.business_website && 
                                profileData?.business?.industry;
    
    const hasJetBizAudit = 
      profileData?.business?.audits?.jetbiz?.completed || 
      profileData?.business?.audits?.jetBiz?.completed ||
      (profileData?.jetbizAnalysis && Object.keys(profileData.jetbizAnalysis).length > 0);

    const hasJetVizAudit = 
      profileData?.business?.audits?.jetviz?.completed || 
      profileData?.business?.audits?.jetViz?.completed ||
      (profileData?.jetvizAnalysis && Object.keys(profileData.jetvizAnalysis).length > 0);

    const completedTasks = growthPlanTasks.filter(t => t.status === 'completed');
    const incompleteTasks = growthPlanTasks.filter(t => t.status !== 'completed');
    const allGrowthTasksComplete = growthPlanTasks.length > 0 && incompleteTasks.length === 0;

    let stage: BorisState['stage'];
    let message: string;
    let actionButton: BorisState['actionButton'] = null;
    let completedItems: string[] = [];
    let todaysTasks: any[] = [];
    let showUpsell = false;

    if (hasNewReviews && newReviewsCount > 0) {
      const reviewText = newReviewsCount === 1 ? 'new review' : `${newReviewsCount} new reviews`;
      message = `${userFirstName}, you have ${reviewText} waiting! ⭐\n\nReviews are GOLD - responding quickly shows customers you care and boosts your reputation.\n\nWould you like me to draft responses for you? I'll handle the heavy lifting.`;
      actionButton = {
        text: `Reply to ${newReviewsCount === 1 ? 'Review' : 'Reviews'}`,
        onClick: onReplyToReviews
      };
      stage = hasBusinessDetails ? (hasJetBizAudit ? (hasJetVizAudit ? 'growth_plan' : 'jetviz') : 'jetbiz') : 'business_details';
    }
    else if (!hasBusinessDetails) {
      stage = 'business_details';
      message = `Hello, ${userFirstName}! 👋\n\nLet's get started on the right foot. Before we can analyze your business and create your growth strategy, I need you to complete your Business Details.\n\nThis is your foundation - everything else builds on this. Click below to set up your business profile now.`;
      actionButton = { text: 'Complete Business Details', onClick: () => onNavigate('businessdetails') };
    }
    else if (!hasJetBizAudit) {
      stage = 'jetbiz';
      completedItems = ['✓ Business Details'];
      message = `Great work, ${userFirstName}! Your business details are set up.\n\nNow it's time for your Google Business Profile audit with JetBiz. This is crucial - your GBP is often the FIRST thing customers see when they search for you.\n\nToday's mission: Run your JetBiz audit so we can identify exactly what's holding you back from ranking higher.`;
      actionButton = { text: 'Run JetBiz Audit', onClick: () => onNavigate('jetbiz') };
    }
    else if (!hasJetVizAudit) {
      stage = 'jetviz';
      completedItems = ['✓ Business Details', '✓ JetBiz Audit'];
      message = `Excellent progress, ${userFirstName}! You've completed your GBP audit.\n\nNext up: Your website analysis with JetViz. Your website is your digital storefront - it needs to convert visitors into customers.\n\nToday's mission: Run your JetViz audit to uncover conversion issues, SEO problems, and trust gaps.`;
      actionButton = { text: 'Run JetViz Audit', onClick: () => onNavigate('jetviz') };
    }
    else if (!allGrowthTasksComplete && incompleteTasks.length > 0) {
      stage = 'growth_plan';
      completedItems = ['✓ Business Details', '✓ JetBiz Audit', '✓ JetViz Audit'];
      todaysTasks = incompleteTasks.slice(0, 3);
      const taskCount = incompleteTasks.length;
      const completedCount = completedTasks.length;
      const totalTasks = taskCount + completedCount;
      
      let openingLine = '';
      let progressContext = '';
      
      if (completedCount === 0) {
        openingLine = `Excellent work, ${userFirstName}!`;
        progressContext = `You've completed your Business Details, JetBiz audit, AND JetViz audit. That's your foundation - most businesses never get this far.\n\nNow it's time to execute. You have ${taskCount} tasks in your Growth Plan.`;
      } else if (completedCount < totalTasks / 2) {
        openingLine = `Good progress, ${userFirstName}!`;
        progressContext = `You've completed ${completedCount} of ${totalTasks} tasks (${Math.round((completedCount / totalTasks) * 100)}% done).\n\nYou're building momentum. Keep going - you have ${taskCount} tasks remaining.`;
      } else if (completedCount < totalTasks) {
        openingLine = `You're crushing it, ${userFirstName}!`;
        progressContext = `You've completed ${completedCount} of ${totalTasks} tasks (${Math.round((completedCount / totalTasks) * 100)}% done).\n\nYou're over halfway there! Stay focused - ${taskCount} tasks to go.`;
      } else {
        openingLine = `Outstanding, ${userFirstName}!`;
        progressContext = `You've completed all your tasks! Time to generate more with another audit.`;
      }
      
      message = `${openingLine} ${progressContext}\n\nHere's what you need to focus on TODAY:\n\n${todaysTasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n')}`;
      actionButton = { text: 'View Growth Plan', onClick: () => onNavigate('growthplan') };
      showUpsell = todaysTasks.some(shouldShowUpsell);
    }
    else {
      stage = 'daily_tools';
      completedItems = ['✓ Business Details', '✓ JetBiz Audit', '✓ JetViz Audit', '✓ All Growth Plan Tasks'];
      message = `Outstanding work, ${userFirstName}! 🎉 You've completed your Growth Plan.\n\nNow it's time to maintain momentum. Your daily focus should be:\n\n• Marketing & Brand Strategy: Create fresh content with JetCreate, JetContent, and JetImage\n• Customer Engagement: Respond to reviews with JetReply, engage leads with JetLeads\n\nConsistent daily action is what separates growing businesses from stagnant ones. What will you create today?`;
      actionButton = null;
    }

    setBorisState({ stage, message, actionButton, completedItems, todaysTasks, showUpsell });
  };

  const handleWhyQuestion = () => {
    if (whyResponseCount >= 3) {
      return "I've explained the reasoning. Now it's time for action, not more questions. Let's get moving!";
    }
    setWhyResponseCount(prev => prev + 1);
    const whyResponses: Record<BorisState['stage'], string[]> = {
      business_details: [
        "Your business details are the foundation. Without them, I can't analyze your Google Business Profile or website accurately.",
        "Think of it like building a house - you need a solid foundation before you can build the walls. Same here.",
        "Every successful business starts with clarity. Complete this, and everything else flows naturally."
      ],
      jetbiz: [
        "Your Google Business Profile is how customers find you locally. 63% of customers use Google to find local businesses.",
        "Right now, you might be invisible to customers searching for exactly what you offer. Let's fix that.",
        "Your competitors are optimizing their GBP. You need to as well, or you'll keep losing customers to them."
      ],
      jetviz: [
        "Your website converts visitors to customers. If it's broken or unclear, you're bleeding money every single day.",
        "Most businesses lose 70%+ of website visitors due to poor design or slow loading. We need to fix yours.",
        "A website audit finds the hidden profit leaks. Every fix is money back in your pocket."
      ],
      growth_plan: [
        "These tasks are prioritized based on maximum impact for minimum effort. They're your fastest path to growth.",
        "Every task you complete moves the needle on your business. Skipping them means leaving money on the table.",
        "The Growth Plan is built from your audit data - these aren't random suggestions, they're YOUR specific fixes."
      ],
      daily_tools: [
        "Consistency beats intensity. Daily content keeps you top-of-mind with customers.",
        "Your competitors are posting daily. If you're not, they're winning the attention game.",
        "Social media algorithms reward consistent creators. Miss a day, lose visibility."
      ]
    };
    return whyResponses[borisState!.stage][whyResponseCount];
  };

  if (!borisState) return null;

  return (
    <div className="bg-[#2D1B4E] border-2 border-purple-600 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl"></div>
      
      {/* Boris Header */}
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

      {/* Completed Items */}
      {borisState.completedItems.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {borisState.completedItems.map((item, idx) => (
            <span key={idx} className="text-xs bg-green-500/10 text-green-400 px-3 py-1 rounded-full border border-green-500/20">
              {item}
            </span>
          ))}
        </div>
      )}

      {/* Boris Message */}
      <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
        <p className="text-gray-200 whitespace-pre-line leading-relaxed">{borisState.message}</p>
      </div>

      {/* Action Button */}
      {borisState.actionButton && (
        <button
          onClick={borisState.actionButton.onClick}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 group"
        >
          {borisState.actionButton.text}
          <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      {/* Ask Why Button & Upsell Link */}
      <div className="mt-3 text-sm flex items-center justify-center gap-4">
        <button
          onClick={() => {
            setWhyResponseCount(prev => prev + 1);
            setShowWhyDialog(true);
          }}
          className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1"
        >
          <ChatBubbleLeftRightIcon className="w-4 h-4" />
          Why this matters
        </button>

        {borisState.showUpsell && (
          <>
            <span className="text-gray-600">•</span>
            <a
              href="https://customwebsitesplus.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-semibold"
            >
              <BoltIcon className="w-4 h-4" />
              Need help? We can handle this ↗
            </a>
          </>
        )}
      </div>

      {/* Why Dialog */}
      {showWhyDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-purple-500/30">
            <h4 className="text-lg font-bold text-white mb-3">Why This Matters</h4>
            <p className="text-gray-300 mb-4 leading-relaxed">{handleWhyQuestion()}</p>
            
            {borisState.showUpsell && (
              <div className="my-4 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                <h5 className="font-bold text-blue-300 flex items-center gap-2">💡 Don't have time?</h5>
                <p className="text-sm text-blue-200 mt-2">Custom Websites Plus can handle this for you.</p>
                <a href="https://customwebsitesplus.com" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-white hover:underline mt-3 inline-block">
                  Check out our services →
                </a>
              </div>
            )}

            {whyResponseCount < 3 && (
              <p className="text-xs text-gray-500 mb-4">
                {3 - whyResponseCount} more clarification{3 - whyResponseCount === 1 ? '' : 's'} available
              </p>
            )}
            <button
              onClick={() => setShowWhyDialog(false)}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-xl"
            >
              Got It - Let's Go!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};