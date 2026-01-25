import React, { useState, useEffect } from 'react';
import { SparklesIcon as SparklesIconSolid, ArrowRightIcon, ChatBubbleLeftRightIcon, BoltIcon, CheckCircleIcon, InformationCircleIcon } from './icons/MiniIcons';
import { BorisChatModal } from './BorisChatModal';
import confetti from 'canvas-confetti';
import type { BorisContext } from '../services/borisAIService';
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

interface BorisState {
  stage: 'business_details' | 'jetbiz' | 'jetviz' | 'growth_plan' | 'daily_tools';
  message: string;
  messageIntro?: string;
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

const FOUNDATION_TOOLS = ['jetbiz', 'jetviz', 'jetcompete', 'jetkeywords'];
const EXECUTION_TOOLS = ['jetcreate', 'jetsocial', 'jetimage', 'jetcontent', 'jetreply', 'jettrust', 'jetleads', 'jetevents', 'jetads', 'jetproduct'];

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
  const [borisState, setBorisState] = useState<BorisState | null>(null);
  const [showWhyDialog, setShowWhyDialog] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  useEffect(() => {
    determineBorisState();
  }, [profileData, growthPlanTasks, hasNewReviews, newReviewsCount, userFirstName]);

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
    let messageIntro: string | undefined = undefined;
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
      
      messageIntro = `${openingLine} ${progressContext}\n\nHere's what you need to focus on TODAY:`;
      message = '';
      actionButton = { text: 'View Full Growth Plan', onClick: () => onNavigate('growthplan') };
      showUpsell = todaysTasks.some(shouldShowUpsell);
    }
    else {
      stage = 'daily_tools';
      completedItems = ['✓ Business Details', '✓ JetBiz Audit', '✓ JetViz Audit', '✓ All Growth Plan Tasks'];
      message = `Outstanding work, ${userFirstName}! 🎉 You've completed your Growth Plan.\n\nNow it's time to maintain momentum. Your daily focus should be:\n\n• Marketing & Brand Strategy: Create fresh content with JetCreate, JetContent, and JetImage\n• Customer Engagement: Respond to reviews with JetReply, engage leads with JetLeads\n\nConsistent daily action is what separates growing businesses from stagnant ones. What will you create today?`;
      actionButton = null;
    }

    setBorisState({ stage, message, messageIntro, actionButton, completedItems, todaysTasks, showUpsell });
  };

  const handleWhyQuestion = () => {
    const whyResponses: Record<BorisState['stage'], string> = {
      business_details: "Completing your Business Details is the most critical first step. This information is the 'brain' for all of JetSuite's AI tools. Accurate details ensure every analysis, piece of content, and recommendation is perfectly tailored to your specific business, location, and industry, which is essential for effective local SEO.",
      jetbiz: "Your Google Business Profile is your most powerful local SEO tool. It's often the first impression customers get, appearing directly in Google search and Maps. JetBiz identifies exactly what's broken or missing so you can fix it and start showing up higher in local searches immediately.",
      jetviz: "Your website is your digital storefront. If it loads slowly, looks unprofessional, or doesn't clearly explain what you do, visitors leave. JetViz identifies the exact technical, design, and content issues that are costing you customers, so you can fix them systematically.",
      growth_plan: "Audits identify problems. Your Growth Plan turns those problems into a prioritized, step-by-step action list. Each task is designed to move the needle on visibility, trust, or revenue. Completing them systematically compounds your results over time.",
      daily_tools: "Growth isn't about one big push - it's about consistent daily action. Creating content, engaging with reviews, and reaching out to leads builds momentum that competitors can't match. The businesses that win are the ones that show up every single day."
    };
    return whyResponses[borisState!.stage];
  };
  
  const getTaskNavigationTarget = (task: any) => {
    const source = task.sourceModule.toLowerCase();
    if (FOUNDATION_TOOLS.includes(source)) {
      return 'growthplan';
    }
    if (EXECUTION_TOOLS.includes(source)) {
      return source;
    }
    return 'growthplan';
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = { origin: { y: 0.7 } };
    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
        colors: ['#A855F7', '#EC4899', '#8B5CF6', '#F472B6']
      });
    }
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  const handleTaskComplete = (taskId: string) => {
    triggerConfetti();
    onTaskStatusChange(taskId, 'completed');
  };

  // Build context for chat
  const buildChatContext = (): BorisContext => {
    const completedAudits: string[] = [];
    if (profileData.jetbizAnalysis) completedAudits.push('JetBiz');
    if (profileData.jetvizAnalysis) completedAudits.push('JetViz');
    
    const completedTasks = growthPlanTasks.filter(t => t.status === 'completed');
    
    const calculateGrowthScore = () => {
      let score = 0;
      if (profileData.business.is_complete) score += 10;
      if (profileData.business.isDnaApproved) score += 10;
      if (profileData.googleBusiness?.status === 'Verified') score += 15;
      score += Math.min(completedTasks.length * 5, 50);
      return Math.min(score, 99);
    };

    return {
      userName: userFirstName,
      businessName: profileData.business.business_name,
      growthScore: calculateGrowthScore(),
      pendingTasks: growthPlanTasks.filter(t => t.status !== 'completed').length,
      completedAudits,
      urgentTasks: borisState?.todaysTasks || [],
      newReviews: newReviewsCount
    };
  };

  if (!borisState) return null;

  return (
    <>
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

        {borisState.completedItems.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {borisState.completedItems.map((item, idx) => (
              <span key={idx} className="text-xs bg-green-500/10 text-green-400 px-3 py-1 rounded-full border border-green-500/20">
                {item}
              </span>
            ))}
          </div>
        )}

        <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
          {borisState.messageIntro ? (
              <>
                  <p className="text-gray-200 whitespace-pre-line leading-relaxed">{borisState.messageIntro}</p>
                  {borisState.todaysTasks.length > 0 && (
                      <div className="mt-4 space-y-2">
                          {borisState.todaysTasks.map((task, i) => {
                              const toolId = getTaskNavigationTarget(task);
                              const isCompleted = growthPlanTasks.find(t => t.id === task.id)?.status === 'completed';
                              return (
                                  <div key={task.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
                                      <div className="flex items-center flex-1">
                                          <span className={`text-gray-300 text-sm mr-4 ${isCompleted ? 'line-through text-green-400' : ''}`}>{i + 1}. {task.title}</span>
                                          {!isCompleted && (
                                            <button
                                                onClick={() => onNavigate(toolId)}
                                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-semibold flex items-center gap-1"
                                                title={toolId === 'growthplan' ? 'View task details in Growth Plan' : `Go to ${task.sourceModule} tool`}
                                            >
                                                {toolId === 'growthplan' ? 'View Task' : 'Go to Tool'} <ArrowRightIcon className="w-3 h-3" />
                                            </button>
                                          )}
                                      </div>
                                      <button 
                                          onClick={() => handleTaskComplete(task.id)}
                                          disabled={isCompleted}
                                          className={`p-3 rounded-full flex-shrink-0 transition-all ${
                                            isCompleted
                                              ? 'bg-green-500 text-white'
                                              : 'bg-purple-500/20 hover:bg-purple-500/40 text-purple-300'
                                          }`}
                                          title="Mark as complete"
                                      >
                                          <CheckCircleIcon className="w-5 h-5" />
                                      </button>
                                  </div>
                              );
                          })}
                      </div>
                  )}
              </>
          ) : (
              <p className="text-gray-200 whitespace-pre-line leading-relaxed">{borisState.message}</p>
          )}
        </div>

        {borisState.actionButton && (
          <button
            onClick={borisState.actionButton.onClick}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 group mb-3"
          >
            {borisState.actionButton.text}
            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        )}

        {/* Ask a Question Button */}
        <button
          onClick={() => setShowChatModal(true)}
          className="w-full bg-slate-800/50 hover:bg-slate-700/50 border border-purple-500/30 text-purple-300 font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          Ask a Question
        </button>

        <div className="mt-3 text-sm flex items-center justify-center gap-4">
          <button
            onClick={() => setShowWhyDialog(true)}
            className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1"
          >
            <InformationCircleIcon className="w-4 h-4" />
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

      {/* Chat Modal */}
      {showChatModal && (
        <BorisChatModal
          context={buildChatContext()}
          onClose={() => setShowChatModal(false)}
          onNavigateToTool={onNavigate}
          onTaskComplete={handleTaskComplete}
          urgentTasks={borisState.todaysTasks}
        />
      )}
    </>
  );
};