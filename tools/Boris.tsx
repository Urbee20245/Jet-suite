import React, { useState, useEffect, useMemo } from 'react';
import { SparklesIcon as SparklesIconSolid, ArrowRightIcon, ChatBubbleLeftRightIcon, BoltIcon, CheckCircleIcon, InformationCircleIcon } from '../components/icons/MiniIcons';
import { BorisChatModal } from '../components/BorisChatModal';
import confetti from 'canvas-confetti';
import type { BorisContext } from '../services/borisAIService';
import { ALL_TOOLS } from '../constants';
import { manuallyStartTour } from '../components/ProductTour';

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
  const [initialChatMsg, setInitialChatMsg] = useState<string | undefined>(undefined);

  const completedTaskIds = useMemo(() => new Set(growthPlanTasks.filter(t => t.status === 'completed').map(t => t.id)), [growthPlanTasks]);

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
      message = `Let's get started on the right foot. Before we can analyze your business and create your growth strategy, I need you to complete your Business Details.\n\nThis is your foundation - everything else builds on this. Click below to set up your business profile now.`;
      actionButton = { text: 'Complete Business Details', onClick: () => onNavigate('businessdetails') };
    }
    else if (!hasJetBizAudit) {
      stage = 'jetbiz';
      completedItems = ['✓ Business Details'];
      message = `Great work! Your business details are set up.\n\nNow it's time for your Google Business Profile audit with JetBiz. This is crucial - your GBP is often the FIRST thing customers see when they search for you.\n\nToday's mission: Run your JetBiz audit so we can identify exactly what's holding you back from ranking higher.`;
      actionButton = { text: 'Run JetBiz Audit', onClick: () => onNavigate('jetbiz') };
    }
    else if (!hasJetVizAudit) {
      stage = 'jetviz';
      completedItems = ['✓ Business Details', '✓ JetBiz Audit'];
      message = `Excellent progress! You've completed your GBP audit.\n\nNext up: Your website analysis with JetViz. Your website is your digital storefront - it needs to convert visitors into customers.\n\nToday's mission: Run your JetViz audit to uncover conversion issues, SEO problems, and trust gaps.`;
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
        openingLine = `Excellent work!`;
        progressContext = `You've completed your Business Details, JetBiz audit, AND JetViz audit. That's your foundation - most businesses never get this far.\n\nNow it's time to execute. You have ${taskCount} tasks in your Growth Plan.`;
      } else if (completedCount < totalTasks / 2) {
        openingLine = `Good progress!`;
        progressContext = `You've completed ${completedCount} of ${totalTasks} tasks (${Math.round((completedCount / totalTasks) * 100)}% done).\n\nYou're building momentum. Keep going - you have ${taskCount} tasks remaining.`;
      } else if (completedCount < totalTasks) {
        openingLine = `You're crushing it!`;
        progressContext = `You've completed ${completedCount} of ${totalTasks} tasks (${Math.round((completedCount / totalTasks) * 100)}% done).\n\nYou're over halfway there! Stay focused - ${taskCount} tasks to go.`;
      } else {
        openingLine = `Outstanding!`;
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
      message = `Outstanding work! 🎉 You've completed your Growth Plan.\n\nNow it's time to maintain momentum. Your daily focus should be:\n\n• Marketing & Brand Strategy: Create fresh content with JetCreate, JetContent, and JetImage\n• Customer Engagement: Respond to reviews with JetReply, engage leads with JetLeads\n\nConsistent daily action is what separates growing businesses from stagnant ones. What will you create today?`;
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
        colors: ['#3B82F6', '#6366F1', '#8B5CF6', '#10B981']
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

  const handleAskBorisAboutTask = (taskTitle: string) => {
    const initialMsg = `I have a question about the task: "${taskTitle}". What should I know about this task, and how can I complete it?`;
    setInitialChatMsg(initialMsg);
    setShowChatModal(true);
  };

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <>
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 relative overflow-hidden shadow-xl">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
        
        {/* Header Section */}
        <div className="flex items-start gap-4 mb-6 relative z-10">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <SparklesIconSolid className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-md">
              <BoltIcon className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-2xl font-bold text-white tracking-tight">Boris</h3>
              <span className="text-xs font-semibold bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 px-3 py-1.5 rounded-full border border-blue-500/30">
                Your Growth Coach
              </span>
            </div>
            <p className="text-sm text-slate-400">Guiding your business growth with data-driven insights</p>
          </div>
        </div>

        {/* Completed Items */}
        {borisState.completedItems.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {borisState.completedItems.map((item, idx) => (
              <span key={idx} className="text-sm font-medium bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-400 px-3 py-2 rounded-lg border border-emerald-500/20 flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4" />
                {item.replace('✓ ', '')}
              </span>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 mb-6 border border-slate-700/50 relative z-10">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {getGreeting().charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-xl font-bold text-white">
                {getGreeting()}, {userFirstName}! 👋
              </p>
              <p className="text-sm text-slate-400">Ready to grow today?</p>
            </div>
          </div>

          {borisState.messageIntro ? (
            <>
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 animate-pulse"></div>
                  <span className="text-emerald-400 font-semibold text-sm">ACTION REQUIRED</span>
                </div>
                <p className="text-base text-slate-200 whitespace-pre-line leading-relaxed mb-4">{borisState.messageIntro}</p>
                
                {borisState.todaysTasks.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-300 text-sm uppercase tracking-wider">Today's Priority Tasks</h4>
                    {borisState.todaysTasks.map((task, i) => {
                      const toolId = getTaskNavigationTarget(task);
                      const isCompleted = completedTaskIds.has(task.id);
                      return (
                        <div key={task.id || i} className="group bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/50 rounded-xl p-4 transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                isCompleted 
                                  ? 'bg-gradient-to-br from-emerald-500 to-green-500' 
                                  : 'bg-gradient-to-br from-blue-500 to-indigo-500'
                              }`}>
                                <span className="text-white font-bold text-sm">{i + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium ${isCompleted ? 'text-emerald-400 line-through' : 'text-slate-100'} truncate`}>
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  {!isCompleted && (
                                    <>
                                      <button
                                        onClick={() => handleAskBorisAboutTask(task.title)}
                                        className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                                      >
                                        <SparklesIconSolid className="w-3 h-3" />
                                        Ask AI
                                      </button>
                                      <button
                                        onClick={() => onNavigate(toolId)}
                                        className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                                      >
                                        View Details
                                        <ArrowRightIcon className="w-3 h-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleTaskComplete(task.id)}
                              disabled={isCompleted}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                isCompleted
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-400 hover:from-blue-500/30 hover:to-indigo-500/30 hover:text-white'
                              }`}
                              title={isCompleted ? "Task completed" : "Mark as complete"}
                            >
                              <CheckCircleIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg p-5 border border-slate-700/50">
              <p className="text-base text-slate-200 whitespace-pre-line leading-relaxed">{borisState.message}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 relative z-10">
          {borisState.actionButton && (
            <button
              onClick={borisState.actionButton.onClick}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20 group"
            >
              <span>{borisState.actionButton.text}</span>
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setInitialChatMsg(undefined);
                setShowChatModal(true);
              }}
              className="bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 text-slate-200 font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              Ask Boris
            </button>
            <button
              onClick={manuallyStartTour}
              className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border border-slate-700 text-slate-200 font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <InformationCircleIcon className="w-5 h-5" />
              Product Tour
            </button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-6 pt-6 border-t border-slate-800 relative z-10">
          <button
            onClick={() => setShowWhyDialog(true)}
            className="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <InformationCircleIcon className="w-4 h-4" />
            Why this matters for your business
          </button>
        </div>
      </div>

      {/* Why This Matters Dialog */}
      {showWhyDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-lg w-full border border-slate-700 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <InformationCircleIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">Strategic Insight</h4>
                <p className="text-sm text-slate-400">Understanding the impact</p>
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-5 mb-6">
              <p className="text-slate-200 leading-relaxed">{handleWhyQuestion()}</p>
            </div>

            {borisState.showUpsell && (
              <div className="mb-6 p-5 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">⚡</span>
                  </div>
                  <h5 className="font-bold text-white">Need professional help?</h5>
                </div>
                <p className="text-sm text-blue-200">Our experts at Custom Websites Plus can execute this for you.</p>
                <a 
                  href="https://customwebsitesplus.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-blue-300 transition-colors mt-3"
                >
                  Explore professional services
                  <ArrowRightIcon className="w-4 h-4" />
                </a>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowWhyDialog(false)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-200"
              >
                Got it, let's continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && (
        <BorisChatModal
          context={buildChatContext()}
          onClose={() => setShowChatModal(false)}
          onNavigateToTool={onNavigate}
          onTaskComplete={handleTaskComplete}
          urgentTasks={borisState.todaysTasks}
          initialMessage={initialChatMsg}
        />
      )}
    </>
  );
};
