import React, { useState, useEffect } from 'react';
import type { Tool, LiveWebsiteAnalysis, GrowthPlanTask, ProfileData, AuditIssue } from '../types';
import { analyzeWebsiteWithLiveApis } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { InformationCircleIcon, CheckCircleIcon, ArrowPathIcon, ExclamationTriangleIcon, ChevronDownIcon, XMarkIcon } from '../components/icons/MiniIcons';
import { ALL_TOOLS } from '../constants';
import { getSupabaseClient } from '../integrations/supabase/client';
import { syncToSupabase } from '../utils/syncService';

interface JetVizProps {
  tool: Tool;
  addTasksToGrowthPlan: (tasks: Omit<GrowthPlanTask, 'id' | 'status' | 'createdAt' | 'completionDate'>[]) => Promise<GrowthPlanTask[]>;
  onSaveAnalysis: (report: LiveWebsiteAnalysis | null) => void;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null, articleId?: string) => void;
  growthPlanTasks: GrowthPlanTask[];
  onTaskStatusChange: (taskId: string, newStatus: GrowthPlanTask['status']) => void;
  userId: string;
  activeBusinessId: string | null;
}

const LoadingState: React.FC = () => {
    const steps = ["Crawling website for SEO elements...", "Running PageSpeed Insights (mobile)...", "Running PageSpeed Insights (desktop)...", "Analyzing security headers...", "Compiling audit..."];
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg mt-6">
            <h3 className="text-xl font-bold text-brand-text text-center">Running Live Website Scan...</h3>
            <div className="w-full max-w-md mx-auto my-6">
                <div className="relative pt-1">
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-accent-purple/20">
                        <div style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-accent-purple transition-all duration-500"></div>
                    </div>
                </div>
                <ul className="text-left text-sm text-brand-text-muted space-y-2">
                    {steps.map((step, index) => (
                        <li key={step} className={`flex items-center transition-opacity duration-300 ${index <= currentStep ? 'opacity-100' : 'opacity-40'}`}>
                            {index < currentStep ? <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" /> : <div className="w-4 h-4 mr-2"><Loader /></div>}
                            {step}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const priorityStyles = {
  High: { icon: ExclamationTriangleIcon, badge: 'bg-red-100 text-red-800 border-red-200' },
  Medium: { icon: ExclamationTriangleIcon, badge: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  Low: { icon: InformationCircleIcon, badge: 'bg-blue-100 text-blue-800 border-blue-200' },
};

interface SimpleTaskCardProps {
  task: Omit<GrowthPlanTask, 'id' | 'status' | 'createdAt' | 'completionDate'>;
  isAdded: boolean;
  onAdd: () => void;
}

interface SimpleIssueCardProps {
  issue: AuditIssue;
  isAdded: boolean;
  onAdd: () => void;
}

const SimpleTaskCard: React.FC<SimpleTaskCardProps> = ({ task, isAdded, onAdd }) => {
  return (
    <div className={`p-4 rounded-lg border transition-all ${isAdded ? 'bg-green-50/50' : 'bg-white shadow glow-card glow-card-rounded-lg'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
            <h4 className="font-bold text-brand-text">{task.title}</h4>
            <p className="text-sm text-brand-text-muted mt-1">{task.description}</p>
            <div className="mt-2 flex items-center space-x-4 text-xs text-brand-text-muted font-medium">
                <span>Effort: <span className="font-bold text-brand-text">{task.effort}</span></span>
                <span>Source: <span className="font-bold text-brand-text">{task.sourceModule}</span></span>
            </div>
        </div>
        <button 
            onClick={onAdd} 
            disabled={isAdded}
            className={`flex-shrink-0 ml-4 px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                isAdded 
                    ? 'bg-green-500 text-white cursor-default' 
                    : 'bg-accent-purple hover:bg-accent-pink text-white'
            }`}
        >
            {isAdded ? '✓ Added' : 'Add to Plan'}
        </button>
      </div>
    </div>
  );
};

const SimpleIssueCard: React.FC<SimpleIssueCardProps> = ({ issue, isAdded, onAdd }) => {
  const styles = priorityStyles[issue.priority];
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`p-4 rounded-lg border transition-all ${isAdded ? 'bg-green-50/50' : 'bg-white'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start">
           <div className="ml-3">
              <h4 className={`font-bold text-brand-text`}>{issue.issue}</h4>
              {isAdded && <p className="text-xs text-brand-text-muted mt-1">Task already added to Growth Plan.</p>}
           </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${styles.badge}`}>{issue.priority}</span>
          <button 
            onClick={onAdd} 
            disabled={isAdded}
            className={`flex-shrink-0 ml-4 px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                isAdded 
                    ? 'bg-green-500 text-white cursor-default' 
                    : 'bg-accent-purple hover:bg-accent-pink text-white'
            }`}
        >
            {isAdded ? '✓ Added' : 'Add to Plan'}
        </button>
        </div>
      </div>
      <div className="ml-8 mt-2">
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs font-semibold text-accent-purple hover:underline">
              {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
          {isExpanded && (
              <div className="mt-2 space-y-2 text-sm">
                  <div>
                      <h4 className="font-semibold text-brand-text-muted">Why This Matters</h4>
                      <p>{issue.whyItMatters}</p>
                  </div>
                  <div>
                      <h4 className="font-semibold text-brand-text-muted">Exact Fix Instructions</h4>
                      <p className="whitespace-pre-wrap">{issue.fix}</p>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

const JetVizResultDisplay: React.FC<{ report: LiveWebsiteAnalysis; onRerun: (e: React.FormEvent) => Promise<void>; isRunning: boolean; growthPlanTasks: GrowthPlanTask[]; setActiveTool: (tool: Tool | null) => void; onAddTask: (tasks: Omit<GrowthPlanTask, 'id' | 'status' | 'createdAt' | 'completionDate'>[]) => void; userId: string; activeBusinessId: string | null; onNavigate: () => void }> = ({ report, onRerun, isRunning, growthPlanTasks, setActiveTool, onAddTask, userId, activeBusinessId, onNavigate }) => {
    const weeklyActionTasks = (report.weeklyActions || []).map(action => growthPlanTasks.find(t => t.title === action.title)).filter(Boolean) as GrowthPlanTask[];
    const completedWeeklyTasks = weeklyActionTasks.filter(t => t.status === 'completed').length;
    const progress = weeklyActionTasks.length > 0 ? (completedWeeklyTasks / weeklyActionTasks.length) * 100 : 0;
    
    const existingTaskTitles = new Set(growthPlanTasks.map(t => t.title));

    const handleAddWeeklyAction = (task: Omit<GrowthPlanTask, 'id' | 'status' | 'createdAt' | 'completionDate'>) => {
        onAddTask([task]);
    };
    
    const handleAddIssueTask = (issue: AuditIssue) => {
        onAddTask([{
            title: issue.task.title,
            description: issue.task.description,
            whyItMatters: issue.whyItMatters,
            effort: issue.task.effort,
            sourceModule: issue.task.sourceModule,
            priority: issue.priority
        }]);
    };

    return (
    <div className="space-y-8 mt-6">
       <div className="bg-accent-blue/10 border-l-4 border-accent-blue text-accent-blue/90 p-4 rounded-r-lg"><div className="flex"><div className="py-1"><InformationCircleIcon className="w-6 h-6 mr-3"/></div><div><p className="font-bold">Your Action Plan is Ready!</p><p className="text-sm">All tasks from this analysis have been added to your Growth Plan. When you leave this page, you can find them there to track your progress and start executing. <button onClick={onNavigate} className="font-bold underline ml-2 whitespace-nowrap">Go to Growth Plan &rarr;</button></p></div></div></div>
        
        <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4"><div><h2 className="text-2xl font-extrabold text-brand-text">What You Should Do This Week</h2><p className="text-brand-text-muted mt-1">Focus on these high-impact tasks to see the fastest results.</p></div></div>
            <div className="mb-4"><div className="flex justify-between items-center mb-1"><span className="text-sm font-semibold">{completedWeeklyTasks} of {weeklyActionTasks.length} done</span><span className="text-sm font-bold">{Math.round(progress)}%</span></div><div className="w-full bg-brand-light rounded-full h-2"><div className="bg-gradient-to-r from-accent-blue to-accent-purple h-2 rounded-full" style={{ width: `${progress}%` }}></div></div></div>
            <div className="space-y-4">
                {(report.weeklyActions || []).map(task => (
                    <SimpleTaskCard 
                        key={task.title} 
                        task={task} 
                        isAdded={existingTaskTitles.has(task.title)}
                        onAdd={() => handleAddWeeklyAction(task)}
                    />
                ))}
            </div>

            <div className="flex justify-end items-center mt-6">
                <button onClick={onNavigate} className="text-sm font-bold text-accent-purple hover:underline">Manage all tasks in Growth Plan &rarr;</button>
            </div>
        </div>

        <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-extrabold text-brand-text mb-4">Full List of Issues Identified</h2>
            <div className="space-y-4">
                {(report.issues || []).map(issue => (
                    <SimpleIssueCard 
                        key={issue.id} 
                        issue={issue} 
                        isAdded={existingTaskTitles.has(issue.task.title)}
                        onAdd={() => handleAddIssueTask(issue)}
                    />
                ))}
            </div>
        </div>
    </div>
  );
};

export const JetViz: React.FC<JetVizProps> = ({ tool, addTasksToGrowthPlan, onSaveAnalysis, profileData, setActiveTool, growthPlanTasks, onTaskStatusChange, userId, activeBusinessId }) => {
  const [urlToAnalyze, setUrlToAnalyze] = useState('');
  const [result, setResult] = useState<LiveWebsiteAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPromo, setShowPromo] = useState(true);
  const [latestGeneratedTasks, setLatestGeneratedTasks] = useState<GrowthPlanTask[]>([]);
  
  useEffect(() => {
    if (profileData.jetvizAnalysis) {
      setResult(profileData.jetvizAnalysis);
      setUrlToAnalyze(profileData.jetvizAnalysis.businessAddress);
    } else if (profileData.business.business_website) {
      setUrlToAnalyze(profileData.business.business_website);
    }
  }, [profileData]);

  if (!profileData.business.business_website && !result) {
    return (<div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg text-center"><InformationCircleIcon className="w-12 h-12 mx-auto text-accent-blue" /><h2 className="text-2xl font-bold text-brand-text mt-4">Complete Your Profile</h2><p className="text-brand-text-muted my-4 max-w-md mx-auto">Please add your website URL to your business profile to use this tool.</p><button onClick={() => setActiveTool(ALL_TOOLS['businessdetails'])} className="bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-2 px-6 rounded-lg">Go to Business Details</button></div>);
  }

  const handleSubmit = async (e: React.FormEvent, rerunUrl?: string) => {
    e.preventDefault();
    const url = rerunUrl || urlToAnalyze;
    if (!url) { setError('Please enter a website URL.'); return; }
    try { new URL(url); } catch (_) { setError('Please enter a valid URL.'); return; }

    setError(''); setLoading(true); setResult(null);
    try {
      const analysis = await analyzeWebsiteWithLiveApis(url);
      setResult(analysis);
      
      const newTasks = [
        ...analysis.weeklyActions, 
        ...analysis.issues.map(i => ({ 
            ...i.task, 
            whyItMatters: i.whyItMatters,
            priority: i.priority
        }))
      ];
      
      const updatedTasks = await addTasksToGrowthPlan(newTasks);
      setLatestGeneratedTasks(updatedTasks);
      
      onSaveAnalysis(analysis);
    } catch (err) { setError('Failed to get analysis. Please try again.'); console.error(err); } 
    finally { setLoading(false); }
  };
  
  const handleStartOver = () => {
      onSaveAnalysis(null);
      setResult(null);
      setUrlToAnalyze(profileData.business.business_website || '');
      setError('');
      setLatestGeneratedTasks([]);
  };

  const handleFinalNavigation = () => {
    // The saving logic is now fully handled by addTasksToGrowthPlan.
    // This function just needs to navigate the user.
    setActiveTool(ALL_TOOLS['growthplan']);
  };

  return (
    <div className="space-y-6">
        {showPromo && (
            <div className="bg-gradient-to-r from-accent-purple/10 via-accent-pink/10 to-accent-cyan/10 border border-accent-purple/30 rounded-xl p-4 relative">
                <button onClick={() => setShowPromo(false)} className="absolute top-2 right-2 text-brand-text-muted hover:text-brand-text"><XMarkIcon className="w-5 h-5" /></button>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:block bg-white p-3 rounded-lg shadow-md"><img src="/Jetsuitewing.png" alt="Custom Websites Plus" className="w-10 h-10"/></div>
                    <div>
                        <h3 className="font-bold text-brand-text">Need a Website That Converts?</h3>
                        <p className="text-sm text-brand-text-muted mt-1">
                            We build innovative, modern websites and redesign existing ones to turn visitors into customers.
                        </p>
                        <a href="https://customwebsitesplus.com" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-accent-purple hover:underline mt-2 inline-block">
                            Learn More at customwebsitesplus.com &rarr;
                        </a>
                    </div>
                </div>
            </div>
        )}

        <div className="mb-6 bg-brand-card p-4 rounded-xl shadow-sm border border-brand-border">
            <p className="text-brand-text-muted mb-2"><span className="font-bold text-brand-text">{tool.description}</span></p>
            <button onClick={() => setActiveTool(ALL_TOOLS['knowledgebase'], 'foundation/jetviz')} className="text-sm font-bold text-accent-purple hover:underline mt-2">Learn why your website is your digital storefront &rarr;</button>
        </div>

      {loading && <LoadingState />}
      
      {!loading && result && (
        <>
            <div className="bg-brand-card p-4 sm:p-6 rounded-xl shadow-lg mb-6 flex justify-between items-center">
              <div>
                  <h2 className="text-lg font-bold text-brand-text">
                      <span className="text-sm text-brand-text-muted font-normal">Analysis for:</span> 
                      <span className="ml-2 font-extrabold">{result.businessName || result.businessAddress}</span>
                  </h2>
              </div>
              <button onClick={handleStartOver} className="text-sm font-semibold text-accent-purple hover:text-accent-pink">Start New Analysis</button>
            </div>
            
            <JetVizResultDisplay 
                report={result} 
                onRerun={(e) => handleSubmit(e, result.businessAddress)} 
                isRunning={loading} 
                growthPlanTasks={growthPlanTasks} 
                setActiveTool={setActiveTool} 
                onAddTask={addTasksToGrowthPlan}
                userId={userId}
                activeBusinessId={activeBusinessId}
                onNavigate={handleFinalNavigation}
            />
            
            <div className="mt-8">
                <button
                    onClick={handleFinalNavigation}
                    className="w-full bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-lg"
                >
                    Go to Growth Plan to Execute Tasks
                    <ArrowPathIcon className="w-5 h-5" />
                </button>
            </div>
        </>
      )}

      {!loading && !result && (
        <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="url" className="block text-sm font-medium text-brand-text mb-2">Website URL to Analyze</label>
              <input type="text" id="url" value={urlToAnalyze} onChange={(e) => setUrlToAnalyze(e.target.value)} placeholder="https://your-business-website.com" className="w-full bg-brand-light border rounded-lg p-3"/>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50">
              {loading ? 'Auditing...' : 'Audit Website'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};