import React, { useState, useEffect, useMemo } from 'react';
import { SparklesIcon as SparklesIconSolid, ArrowRightIcon, ChatBubbleLeftRightIcon, BoltIcon, CheckCircleIcon, InformationCircleIcon, ChevronDownIcon } from './icons/MiniIcons';
import { BorisChatModal } from './BorisChatModal';
import confetti from 'canvas-confetti';
import type { BorisContext } from '../services/borisAIService';
import { ALL_TOOLS } from '../constants';
import { manuallyStartTour } from '../components/ProductTour';

interface TypingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

const TypingText: React.FC<TypingTextProps> = ({ text, speed = 20, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete && currentIndex === text.length) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return <span>{displayedText}</span>;
};

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
        const foundTool = ALL_TOOLS[toolId];
        if (!foundTool) return null;
        const usage = profileData?.toolUsage?.[toolId] || 0;
        return { ...(foundTool as any), usage };
      }).filter((t: any) => t !== null);

      const leastUsedTools = toolsWithProgress.sort((a: any, b: any) => a.usage - b.usage).slice(0, 3);

      message = `Outstanding work! You've completed everything in your Growth Plan.\n\nNow it's time to stay sharp. Here are some tools you haven't used lately:`;
      todaysTasks = leastUsedTools.map((tool: any) => ({
        id: tool.id,
        title: tool.name,
        description: tool.description,
        sourceModule: tool.id,
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
    const title = (task.title || '').toLowerCase();
    const description = (task.description || '').toLowerCase();
    const sourceModule = (task.sourceModule || '').toLowerCase();
    const combined = `${title} ${description}`;

    // Social media / posting tasks → JetSocial
    if (/\b(post|share|publish|social media|instagram|facebook|tweet|linkedin|tiktok|client.{0,20}success|success.{0,20}update)\b/.test(combined)) {
      return 'jetsocial';
    }
    // Review / reputation tasks → JetReply
    if (/\b(review|reply|respond|rating|reputation|star|feedback)\b/.test(combined)) {
      return 'jetreply';
    }
    // Ad / advertising tasks → JetAds
    if (/\b(ads?|advertis|campaign|ppc|facebook ad|google ad|paid|sponsor)\b/.test(combined)) {
      return 'jetads';
    }
    // Blog / content writing tasks → JetContent
    if (/\b(blog|article|write|content|seo content)\b/.test(combined)) {
      return 'jetcontent';
    }
    // Keyword / SEO research tasks → JetKeywords
    if (/\b(keyword|search term|seo|ranking|meta|schema)\b/.test(combined)) {
      return 'jetkeywords';
    }
    // Competitor analysis → JetCompete
    if (/\b(competitor|competition|compete|rival)\b/.test(combined)) {
      return 'jetcompete';
    }
    // Event / promotion tasks → JetEvents
    if (/\b(event|promotion|promo|workshop|sale|discount|offer)\b/.test(combined)) {
      return 'jetevents';
    }
    // Lead generation → JetLeads
    if (/\b(lead|prospect|acquisition|outreach)\b/.test(combined)) {
      return 'jetleads';
    }
    // Image / visual tasks → JetImage
    if (/\b(image|photo|visual|graphic|picture|design)\b/.test(combined)) {
      return 'jetimage';
    }
    // Trust / widget tasks → JetTrust
    if (/\b(widget|trust|testimonial|embed)\b/.test(combined)) {
      return 'jettrust';
    }
    // Website / design tasks → JetViz
    if (/\b(website|web page|landing page|site speed|mobile|load time)\b/.test(combined)) {
      return 'jetviz';
    }
    // Google Business Profile tasks → JetBiz
    if (/\b(google business|gbp|business profile|google maps|listing|citation)\b/.test(combined)) {
      return 'jetbiz';
    }

    // Fallback: use source module if it maps to a known tool, otherwise Growth Plan
    if (sourceModule && sourceModule !== 'growthplan' && ALL_TOOLS[sourceModule]) {
      return sourceModule;
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
    const completedAuditsArray: string[] = [];
    if (profileData?.business?.audits?.jetbiz?.completed || (profileData?.business?.audits as any)?.jetBiz?.completed) {
      completedAuditsArray.push('JetBiz');
    }
    if (profileData?.business?.audits?.jetviz?.completed || (profileData?.business?.audits as any)?.jetViz?.completed) {
      completedAuditsArray.push('JetViz');
    }

    return {
      userName: profileData?.user?.firstName || profileData?.user?.name || userFirstName || 'there',
      businessName: profileData?.business?.business_name || '',
      growthScore: profileData?.growthScore || 0,
      pendingTasks: growthPlanTasks.filter((t: any) => t.status !== 'completed').length,
      completedAudits: completedAuditsArray,
      urgentTasks: growthPlanTasks.filter((t: any) => t.status === 'in_progress').slice(0, 3),
      newReviews: 0
    };
  };

  if (!borisState) {
    return (
      <div className="relative rounded-2xl p-8 overflow-hidden border-2 border-purple-300/50 bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-100/40 to-indigo-100/40 animate-pulse"></div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <SparklesIconSolid className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Loading Boris...</h3>
              <p className="text-slate-600 text-sm">Analyzing your progress...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="relative rounded-2xl p-8 overflow-hidden border-2 border-purple-300/50 bg-gradient-to-br from-purple-50 via-white to-indigo-50 shadow-xl">
      {/* Enhanced glowing background */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-100/30 to-indigo-100/30 animate-pulse"></div>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>
      
      {/* Glowing orb effects */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-300/30 to-pink-300/30 rounded-full blur-3xl -translate-y-36 translate-x-36"></div>
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-indigo-300/30 to-blue-300/30 rounded-full blur-3xl -translate-x-28 translate-y-28"></div>
      
      {/* Inner border glow */}
      <div className="absolute inset-0 rounded-2xl border border-purple-200/50 pointer-events-none"></div>
      
      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl blur-lg opacity-20 animate-pulse"></div>
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg border-2 border-white/30">
                <SparklesIconSolid className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-sm border-2 border-white">
                <BoltIcon className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Boris AI</h2>
              <p className="text-slate-700 font-medium">Your Business Growth Assistant</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-semibold bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
                  Growth Coach
                </span>
                <span className="text-xs font-medium text-slate-500">•</span>
                <span className="text-xs text-slate-500">Taking action today</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Indicators */}
        {borisState.completedItems.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Completed Milestones</h3>
            <div className="flex flex-wrap gap-2">
              {borisState.completedItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50 px-3 py-2 rounded-lg border border-emerald-200 shadow-sm">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">{item.replace('✓ ', '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Greeting & Content Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4 animate-[popIn_0.4s_ease-out]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center border border-purple-200 shadow-sm">
              <span className="text-purple-700 font-bold text-sm">
                {getGreeting().charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">
                {getGreeting()}, {userFirstName}!
              </p>
              <p className="text-sm text-slate-600">Let's make progress today</p>
            </div>
          </div>

          {borisState.messageIntro ? (
            <div className="space-y-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 animate-pulse"></div>
                  <span className="text-sm font-semibold text-purple-700">Progress Update</span>
                </div>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                  <TypingText text={borisState.messageIntro} speed={20} />
                </p>
              </div>

              {/* Today's Tasks Section */}
              {borisState.todaysTasks.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Today's Priority Tasks</h3>
                    <div className="animate-bounce">
                      <ChevronDownIcon className="w-5 h-5 text-indigo-500" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {borisState.todaysTasks.map((task, i) => {
                      const toolId = getTaskNavigationTarget(task);
                      const isCompleted = completedTaskIds.has(task.id);
                      return (
                        <div key={task.id || i} className="group bg-white/95 backdrop-blur-sm hover:bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 transition-all duration-200 shadow-sm hover:shadow-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isCompleted 
                                  ? 'bg-gradient-to-br from-emerald-100 to-green-100' 
                                  : 'bg-gradient-to-br from-purple-50 to-indigo-50'
                              } border ${isCompleted ? 'border-emerald-200' : 'border-indigo-100'}`}>
                                <span className={`font-bold text-sm ${
                                  isCompleted ? 'text-emerald-700' : 'text-indigo-700'
                                }`}>{i + 1}</span>
                              </div>
                              <div className="flex-1">
                                <p className={`font-medium ${isCompleted ? 'text-emerald-700 line-through' : 'text-slate-900'}`}>
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  {!isCompleted && (
                                    <button
                                      onClick={() => onNavigate(toolId)}
                                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                                    >
                                      {toolId === 'growthplan' ? 'View Task' : `Go to ${ALL_TOOLS[toolId]?.name || 'Tool'}`}
                                      <ArrowRightIcon className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleTaskComplete(task.id)}
                              disabled={isCompleted}
                              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                isCompleted
                                  ? 'bg-emerald-500 text-white shadow-sm'
                                  : 'bg-gradient-to-br from-purple-50 to-indigo-50 text-indigo-700 hover:from-purple-100 hover:to-indigo-100 hover:shadow-md border border-indigo-200'
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
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-slate-200 shadow-sm">
              <p className="text-slate-700 whitespace-pre-line leading-relaxed">{borisState.message}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {borisState.actionButton && (
            <button
              onClick={borisState.actionButton.onClick}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group border border-purple-500/30"
            >
              <span className="text-base">{borisState.actionButton.text}</span>
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowChatModal(true)}
              className="bg-white/95 backdrop-blur-sm hover:bg-white border border-slate-300 hover:border-indigo-300 text-slate-800 font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-indigo-600" />
              <span>Ask Boris</span>
            </button>
            <button
              onClick={manuallyStartTour}
              className="bg-white/95 backdrop-blur-sm hover:bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow"
            >
              <InformationCircleIcon className="w-5 h-5 text-slate-600" />
              <span>Product Tour</span>
            </button>
          </div>

          {/* Footer Links */}
          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={() => setShowWhyDialog(true)}
              className="text-slate-600 hover:text-indigo-700 transition-colors font-medium flex items-center gap-2 text-sm"
            >
              <InformationCircleIcon className="w-4 h-4" />
              Why this matters for your business growth
            </button>
          </div>
        </div>
      </div>

      {/* Why This Matters Modal */}
      {showWhyDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center border border-purple-100">
                  <InformationCircleIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Strategic Insight</h3>
                  <p className="text-sm text-slate-600">Understanding the business impact</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-slate-50 rounded-xl p-5 mb-4 border border-slate-200">
                <p className="text-slate-700 leading-relaxed">
                  {handleWhyQuestion()}
                </p>
              </div>
              
              {borisState.showUpsell && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white font-bold">⚡</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">Need professional assistance?</h4>
                      <p className="text-sm text-slate-700 mb-3">
                        Custom Websites Plus offers expert execution of these strategies.
                      </p>
                      <a 
                        href="https://customwebsitesplus.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900 transition-colors"
                      >
                        Explore professional services
                        <ArrowRightIcon className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100">
              <button
                onClick={() => setShowWhyDialog(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Got It — Let's Continue
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
        />
      )}
    </div>
  );
};
