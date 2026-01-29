import React, { useState, useEffect, useMemo } from 'react';
import { SparklesIcon as SparklesIconSolid, ArrowRightIcon, ChatBubbleLeftRightIcon, BoltIcon, CheckCircleIcon, InformationCircleIcon, ChevronDownIcon } from './icons/MiniIcons';
import { BorisChatModal } from './BorisChatModal';
import confetti from 'canvas-confetti';
import type { BorisContext } from '../services/borisAIService';
import { ALL_TOOLS } from '../constants';
import { manuallyStartTour } from '../components/ProductTour'; // <-- NEW IMPORT

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
      
      messageIntro = `${openingLine} ${progressContext}`;
      message = '';
      actionButton = { text: 'View Full Growth Plan', onClick: () => onNavigate('growthplan') };
      showUpsell = todaysTasks.some(shouldShowUpsell);
    }
    else {
      stage = 'daily_tools';
      completedItems = ['✓ Business Details', '✓ JetBiz Audit', '✓ JetViz Audit', '✓ All Growth Plan Tasks'];
      
      const toolsWithProgress = EXECUTION_TOOLS.map(toolId => {
        const tool = ALL_TOOLS.find(t => t.id === toolId);
        if (!tool) return null;
        const usage = profileData?.toolUsage?.[toolId] || 0;
        return { ...tool, usage };
      }).filter(Boolean);
      
      const leastUsedTools = toolsWithProgress.sort((a, b) => a!.usage - b!.usage).slice(0, 3);
      
      message = `Outstanding work! You've completed everything in your Growth Plan.\n\nNow it's time to stay sharp. Here are some tools you haven't used lately:`;
      todaysTasks = leastUsedTools.map(tool => ({
        id: tool!.id,
        title: tool!.name,
        description: tool!.description,
        sourceModule: tool!.id,
        status: 'pending'
      }));
    }

    setBorisState({ stage, message, messageIntro, actionButton, completedItems, todaysTasks, showUpsell });
  };

  const handleTaskComplete = (taskId: string) => {
    if (completedTaskIds.has(taskId)) return;
    onTaskStatusChange(taskId, 'completed');
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  const getTaskNavigationTarget = (task: any): string => {
    if (task.sourceModule && task.sourceModule !== 'growthplan') {
      return task.sourceModule.toLowerCase();
    }
    return 'growthplan';
  };

  const handleWhyQuestion = (): string => {
    if (!borisState) return '';
    
    switch (borisState.stage) {
      case 'business_details':
        return `Your Business Details are the foundation of everything in JetSuite. Without this information, the AI tools can't personalize content, analyze your market, or create strategies specific to YOUR business. This takes 3 minutes but saves you HOURS later.`;
      
      case 'jetbiz':
        return `Your Google Business Profile is often the FIRST impression customers have of you. It appears in Google Maps, local search, and knowledge panels. JetBiz scans your profile for issues that hurt rankings - missing info, poor photos, weak descriptions, citation problems. Most businesses lose customers daily because of fixable GBP issues they don't even know exist.`;
      
      case 'jetviz':
        return `Your website might look good to you, but is it converting visitors into customers? JetViz analyzes your site like a marketing expert - checking load speed, mobile experience, trust signals, SEO, calls-to-action, and conversion blockers. Most websites leak 70% of their traffic due to preventable issues. JetViz finds them so you can fix them.`;
      
      case 'growth_plan':
        return `Your Growth Plan isn't just a to-do list - it's a strategic roadmap built from your actual business data. Each task is prioritized based on impact and effort. These aren't generic suggestions - they're specific actions that will move YOUR business forward. The businesses that execute their Growth Plans see real results. The ones that don't... stay stuck.`;
      
      case 'daily_tools':
        return `You've completed the foundation work - great! Now it's about consistency. Using JetSuite's tools regularly keeps you visible, builds trust, and attracts customers. Social posts, content creation, review responses, lead generation - these aren't one-time tasks. They're ongoing activities that compound over time. The most successful businesses use these tools DAILY.`;
      
      default:
        return `Every step in JetSuite is designed to help you grow your business systematically. Follow Boris's guidance, complete your tasks, and you'll see real results.`;
    }
  };

  const buildChatContext = (): BorisContext => {
    return {
      businessName: profileData?.business?.business_name || '',
      industry: profileData?.business?.industry || '',
      currentStage: borisState?.stage || 'business_details',
      completedAudits: {
        jetBiz: !!(profileData?.business?.audits?.jetbiz?.completed || profileData?.business?.audits?.jetBiz?.completed),
        jetViz: !!(profileData?.business?.audits?.jetviz?.completed || profileData?.business?.audits?.jetViz?.completed)
      },
      pendingTasks: growthPlanTasks.filter(t => t.status !== 'completed'),
      recentActivity: profileData?.recentActivity || []
    };
  };

  if (!borisState) {
    return (
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-2xl p-8 shadow-2xl text-white">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <SparklesIconSolid className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Loading Boris...</h3>
            <p className="text-purple-200 text-sm">Analyzing your progress...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-2xl p-8 shadow-2xl text-white">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center animate-pulse">
            <SparklesIconSolid className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold">Boris</h3>
            <p className="text-purple-200 text-sm">Your Growth Coach</p>
            <p className="text-purple-300 text-xs mt-1">Motivating you to take action TODAY</p>
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
                  {/* Greeting Message */}
                  <p className="text-xl font-semibold text-white mb-3">
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {userFirstName}! 👋
                  </p>
                  <p className="text-base text-gray-200 whitespace-pre-line leading-relaxed mb-6">{borisState.messageIntro}</p>
                  
                  {/* ENHANCED: Much larger and bolder "Here's what you need to focus on TODAY" with down arrow */}
                  {borisState.todaysTasks.length > 0 && (
                      <div className="mt-6">
                          <div className="flex flex-col items-center mb-4">
                              <h4 className="text-3xl font-black text-white text-center mb-2 tracking-tight">
                                  HERE'S WHAT YOU NEED TO FOCUS ON TODAY:
                              </h4>
                              {/* Down Arrow Animation */}
                              <div className="animate-bounce">
                                  <ChevronDownIcon className="w-10 h-10 text-pink-400" />
                              </div>
                          </div>
                          
                          <div className="space-y-2">
                              {borisState.todaysTasks.map((task, i) => {
                                  const toolId = getTaskNavigationTarget(task);
                                  const isCompleted = completedTaskIds.has(task.id);
                                  return (
                                      <div key={task.id || i} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
                                          <div className="flex items-center flex-1">
                                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white flex items-center justify-center mr-3">
                                                  <span className="text-purple-600 font-bold text-sm">{i + 1}</span>
                                              </div>
                                              <span className={`text-sm text-gray-300 ${isCompleted ? 'line-through text-green-400' : ''}`}>{task.title}</span>
                                              {!isCompleted && (
                                                <button
                                                    onClick={() => onNavigate(toolId)}
                                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-semibold flex items-center gap-1 ml-3"
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
                      </div>
                  )}
              </>
          ) : (
              <>
                  {/* Greeting Message */}
                  <p className="text-xl font-semibold text-white mb-3">
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {userFirstName}! 👋
                  </p>
                  <p className="text-base text-gray-200 whitespace-pre-line leading-relaxed">{borisState.message}</p>
              </>
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

          {/* ENHANCED: Removed book icon from Product Tour */}
          <>
            <span className="text-gray-600">•</span>
            <button
              onClick={manuallyStartTour}
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
            >
              <InformationCircleIcon className="w-4 h-4" />
              Take the Product Tour
            </button>
          </>
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
