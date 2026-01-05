import React, { useState, useEffect } from 'react';
import type { Tool, LiveWebsiteAnalysis, GrowthPlanTask, ProfileData, AuditIssue } from '../types';
import { analyzeWebsiteWithLiveApis } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { InformationCircleIcon, CheckCircleIcon, ArrowPathIcon, ExclamationTriangleIcon, ChevronDownIcon, XMarkIcon, ArrowDownTrayIcon } from '../components/icons/MiniIcons';
import { ALL_TOOLS } from '../constants';
import { getSupabaseClient } from '../integrations/supabase/client';

interface JetVizProps {
  tool: Tool;
  addTasksToGrowthPlan: (tasks: Omit<GrowthPlanTask, 'id' | 'status' | 'createdAt' | 'completionDate'>[]) => void;
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


const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
    const getColor = (s: number) => s >= 90 ? 'text-green-500' : s >= 50 ? 'text-yellow-500' : 'text-red-500';
    const color = getColor(score);
    return (
        <div className="relative w-24 h-24">
            <svg className="w-full h-full" viewBox="0 0 36 36">
                <path className="text-gray-200" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={color} strokeWidth="3" strokeDasharray={`${score}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${color}`}>{score}</span>
            </div>
        </div>
    );
};

// --- Task and Issue Card components copied from JetBiz ---
const statusStyles = {
  to_do: { badge: 'bg-red-100 text-red-800', text: 'To Do' },
  in_progress: { badge: 'bg-yellow-100 text-yellow-800', text: 'In Progress' },
  completed: { badge: 'bg-green-100 text-green-800', text: 'Completed' },
};

const priorityStyles = {
  High: { icon: ExclamationTriangleIcon, badge: 'bg-red-100 text-red-800 border-red-200' },
  Medium: { icon: ExclamationTriangleIcon, badge: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  Low: { icon: InformationCircleIcon, badge: 'bg-blue-100 text-blue-800 border-blue-200' },
};

const TaskCard: React.FC<{ task: GrowthPlanTask, onStatusChange: (id: string, status: GrowthPlanTask['status']) => void }> = ({ task, onStatusChange }) => {
  const isCompleted = task.status === 'completed';
  const handleToggle = () => onStatusChange(task.id, isCompleted ? 'to_do' : 'completed');

  return (
    <div className={`p-4 rounded-lg border transition-all ${isCompleted ? 'bg-green-50/50' : 'bg-white shadow glow-card glow-card-rounded-lg'}`}>
      <div className="flex items-start">
        <input type="checkbox" checked={isCompleted} onChange={handleToggle} className="h-5 w-5 rounded border-gray-300 text-accent-purple focus:ring-accent-purple mt-0.5 cursor-pointer"/>
        <div className="ml-3 flex-1">
            <label onClick={handleToggle} className={`font-bold text-brand-text cursor-pointer ${isCompleted ? 'line-through text-brand-text-muted' : ''}`}>{task.title}</label>
            {!isCompleted && <p className="text-sm text-brand-text-muted mt-1">{task.description}</p>}
            {isCompleted && <p className="text-xs text-brand-text-muted mt-1">Completed on: {new Date(task.completionDate!).toLocaleDateString()}</p>}
        </div>
        <div className="relative">
          <select value={task.status} onChange={(e) => onStatusChange(task.id, e.target.value as GrowthPlanTask['status'])} className={`text-xs font-semibold rounded-full border-none appearance-none cursor-pointer py-1 pl-2 pr-7 ${statusStyles[task.status].badge}`}>
            <option value="to_do">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <ChevronDownIcon className="w-4 h-4 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

const IssueCard: React.FC<{ issue: AuditIssue; correspondingTask: GrowthPlanTask | undefined; onStatusChange: (id: string, status: GrowthPlanTask['status']) => void; }> = ({ issue, correspondingTask, onStatusChange }) => {
  const isCompleted = correspondingTask?.status === 'completed';
  const styles = priorityStyles[issue.priority];
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStatusChange = (newStatus: GrowthPlanTask['status']) => {
    if (correspondingTask) { onStatusChange(correspondingTask.id, newStatus); }
  };
  
  const handleToggleComplete = () => {
    if (correspondingTask) { onStatusChange(correspondingTask.id, isCompleted ? 'to_do' : 'completed'); }
  };

  if (!correspondingTask) return null;

  return (
    <div className={`p-4 rounded-lg border transition-all ${isCompleted ? 'bg-green-50/50' : 'bg-white'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start">
           <input type="checkbox" checked={isCompleted} onChange={handleToggleComplete} className="h-5 w-5 rounded border-gray-300 text-accent-purple focus:ring-accent-purple mt-0.5 cursor-pointer"/>
           <div className="ml-3">
              <label onClick={handleToggleComplete} className={`font-bold text-brand-text cursor-pointer ${isCompleted ? 'line-through text-brand-text-muted' : ''}`}>{issue.issue}</label>
              {isCompleted && <p className="text-xs text-brand-text-muted mt-1">Completed on: {new Date(correspondingTask.completionDate!).toLocaleDateString()}</p>}
           </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${styles.badge}`}>{issue.priority}</span>
          <div className="relative">
            <select value={correspondingTask.status} onChange={(e) => handleStatusChange(e.target.value as GrowthPlanTask['status'])} className={`text-xs font-semibold rounded-full border-none appearance-none cursor-pointer py-1 pl-2 pr-7 ${statusStyles[correspondingTask.status].badge}`}>
              <option value="to_do">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <ChevronDownIcon className="w-4 h-4 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
      {!isCompleted && (
        <div className="ml-8 mt-2">
            <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs font-semibold text-accent-purple hover:underline">{isExpanded ? 'Hide Details' : 'Show Details'}</button>
            {isExpanded && (
                <div className="mt-2 space-y-2 text-sm">
                    <div><h4 className="font-semibold text-brand-text-muted">Why This Matters</h4><p>{issue.whyItMatters}</p></div>
                    <div><h4 className="font-semibold text-brand-text-muted">Exact Fix Instructions</h4><p className="whitespace-pre-wrap">{issue.fix}</p></div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};


const JetVizResultDisplay: React.FC<{ report: LiveWebsiteAnalysis; onRerun: (e: React.FormEvent) => Promise<void>; isRunning: boolean; growthPlanTasks: GrowthPlanTask[]; onTaskStatusChange: (id: string, status: GrowthPlanTask['status']) => void; setActiveTool: (tool: Tool | null) => void; }> = ({ report, onRerun, isRunning, growthPlanTasks, onTaskStatusChange, setActiveTool }) => {
    const [showCompleted, setShowCompleted] = useState(false);
    const weeklyActionTasks = report.weeklyActions.map(action => growthPlanTasks.find(t => t.title === action.title)).filter(Boolean) as GrowthPlanTask[];
    const completedWeeklyTasks = weeklyActionTasks.filter(t => t.status === 'completed').length;
    const progress = weeklyActionTasks.length > 0 ? (completedWeeklyTasks / weeklyActionTasks.length) * 100 : 0;
    const displayedTasks = showCompleted ? weeklyActionTasks : weeklyActionTasks.filter(t => t.status !== 'completed');

    const allIssueTasks = report.issues.map(issue => growthPlanTasks.find(t => t.title === issue.task.title)).filter(Boolean) as GrowthPlanTask[];
    const resolvedIssues = allIssueTasks.filter(t => t.status === 'completed').length;

    return (
    <div className="space-y-8 mt-6">
       <div className="bg-accent-blue/10 border-l-4 border-accent-blue text-accent-blue/90 p-4 rounded-r-lg"><div className="flex"><div className="py-1"><InformationCircleIcon className="w-6 h-6 mr-3"/></div><div><p className="font-bold">Your Action Plan is Ready!</p><p className="text-sm">All tasks from this analysis have been added to your Growth Plan. When you leave this page, you can find them there to track your progress and start executing. <button onClick={() => setActiveTool(ALL_TOOLS['growthplan'])} className="font-bold underline ml-2 whitespace-nowrap">Go to Growth Plan &rarr;</button></p></div></div></div>
        
        <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
             <div className="flex justify-between items-start mb-4"><div><h2 className="text-2xl font-extrabold text-brand-text">Live Analysis Results <span className="ml-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">🟢 Live Scan</span></h2><p className="text-xs text-brand-text-muted mt-1">Scanned: {new Date(report.timestamp).toLocaleString()}</p></div>
                <button onClick={onRerun} disabled={isRunning} className="flex items-center bg-white hover:bg-brand-light border border-brand-border text-brand-text font-semibold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50"><ArrowPathIcon className={`w-5 h-5 mr-2 ${isRunning ? 'animate-spin' : ''}`} />{isRunning ? 'Re-scanning...' : 'Re-run Scan'}</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-brand-light p-4 rounded-lg border"><h3 className="font-bold text-lg mb-4 text-center">Mobile Performance</h3><div className="flex justify-around"><div className="text-center"><ScoreCircle score={report.mobile.performance} /><p className="text-xs mt-1 font-semibold">Performance</p></div><div className="text-center"><ScoreCircle score={report.mobile.seo} /><p className="text-xs mt-1 font-semibold">SEO</p></div></div></div><div className="bg-brand-light p-4 rounded-lg border"><h3 className="font-bold text-lg mb-4 text-center">Desktop Performance</h3><div className="flex justify-around"><div className="text-center"><ScoreCircle score={report.desktop.performance} /><p className="text-xs mt-1 font-semibold">Performance</p></div><div className="text-center"><ScoreCircle score={report.desktop.seo} /><p className="text-xs mt-1 font-semibold">SEO</p></div></div></div></div>
        </div>
        
        <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4"><div><h2 className="text-2xl font-extrabold text-brand-text">What You Should Do This Week</h2><p className="text-brand-text-muted mt-1">Focus on these high-impact tasks to see the fastest results.</p></div></div>
            <div className="mb-4"><div className="flex justify-between items-center mb-1"><span className="text-sm font-semibold">{completedWeeklyTasks} of {weeklyActionTasks.length} done</span><span className="text-sm font-bold">{Math.round(progress)}%</span></div><div className="w-full bg-brand-light rounded-full h-2"><div className="bg-gradient-to-r from-accent-blue to-accent-purple h-2 rounded-full" style={{ width: `${progress}%` }}></div></div></div>
            <div className="space-y-4">{displayedTasks.map(task => (<TaskCard key={task.id} task={task} onStatusChange={onTaskStatusChange} />))}</div>
            <div className="flex justify-between items-center mt-4"><label className="flex items-center text-sm"><input type="checkbox" checked={showCompleted} onChange={e => setShowCompleted(e.target.checked)} className="h-4 w-4 rounded mr-2"/> Show Completed</label><button onClick={() => setActiveTool(ALL_TOOLS['growthplan'])} className="text-sm font-bold text-accent-purple hover:underline">Manage all tasks in Growth Plan &rarr;</button></div>
        </div>

        <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-extrabold text-brand-text mb-4">Full List of Issues Identified ({resolvedIssues} of {allIssueTasks.length} resolved)</h2>
            <div className="space-y-4">{report.issues.map(issue => <IssueCard key={issue.id} issue={issue} correspondingTask={growthPlanTasks.find(t => t.title === issue.task.title)} onStatusChange={onTaskStatusChange} />)}</div>
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
  
  // ADDED STATE FOR PERSISTENCE
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);
  
  const supabase = getSupabaseClient();

  // ADDED EFFECT TO LOAD SAVED ANALYSES
  useEffect(() => {
    if (userId && activeBusinessId) {
      loadSavedAnalyses();
    }
  }, [userId, activeBusinessId]);

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

  // ADDED FUNCTION TO LOAD SAVED ANALYSES
  const loadSavedAnalyses = async () => {
    if (!supabase || !userId || !activeBusinessId) return;
    
    try {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('id, created_at, target_url, results')
        .eq('user_id', userId)
        .eq('business_id', activeBusinessId)
        .eq('tool_name', 'jetviz')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      if (data) setSavedAnalyses(data);
    } catch (error) {
      console.error('Error loading saved analyses:', error);
    }
  };

  // ADDED FUNCTION TO SAVE ANALYSIS
  const handleSaveAnalysis = async () => {
    if (!supabase || !userId || !activeBusinessId || !result) return;
    
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('analysis_results')
        .insert({
          user_id: userId,
          business_id: activeBusinessId,
          tool_name: 'jetviz',
          analysis_type: 'full_audit',
          target_url: urlToAnalyze,
          results: result // Save the full LiveWebsiteAnalysis object
        })
        .select()
        .single();
      
      if (error) throw error;
      
      alert('Analysis saved successfully!');
      loadSavedAnalyses();
    } catch (error) {
      console.error('Error saving analysis:', error);
      alert('Failed to save analysis. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ADDED FUNCTION TO LOAD PREVIOUS ANALYSIS
  const handleLoadAnalysis = (analysis: any) => {
    // The full LiveWebsiteAnalysis object is stored in the 'results' field
    const loadedReport = analysis.results as LiveWebsiteAnalysis;
    
    setUrlToAnalyze(loadedReport.businessAddress); // Assuming businessAddress holds the URL
    setResult(loadedReport);
    
    // Note: We don't need to call onSaveAnalysis here as it's already saved.
    setShowSavedList(false);
  };

  const handleSubmit = async (e: React.FormEvent, rerunUrl?: string) => {
    e.preventDefault();
    const url = rerunUrl || urlToAnalyze;
    if (!url) { setError('Please enter a website URL.'); return; }
    try { new URL(url); } catch (_) { setError('Please enter a valid URL.'); return; }

    setError(''); setLoading(true); setResult(null);
    try {
      const analysis = await analyzeWebsiteWithLiveApis(url);
      setResult(analysis);
      addTasksToGrowthPlan([...analysis.weeklyActions, ...analysis.issues.map(i => ({ ...i.task, whyItMatters: i.whyItMatters }))]);
      onSaveAnalysis(analysis);
    } catch (err) { setError('Failed to get analysis. Please try again.'); console.error(err); } 
    finally { setLoading(false); }
  };
  
  const handleStartOver = () => {
      onSaveAnalysis(null);
      setResult(null);
      setUrlToAnalyze(profileData.business.business_website || '');
      setError('');
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
            <p className="text-brand-text-muted">{tool.description}</p>
            <p className="text-sm text-brand-text-muted mt-2">
                Replaces: <span className="text-accent-purple font-semibold">SEO Tools (Ahrefs, SEMrush) ($99-399/mo)</span>
            </p>
            <button onClick={() => setActiveTool(ALL_TOOLS['knowledgebase'], 'foundation/jetviz')} className="text-sm font-bold text-accent-purple hover:underline mt-2">Learn why your website is your digital storefront &rarr;</button>
        </div>

      {loading && <LoadingState />}
      
      {!loading && result && (
        <>
          <JetVizResultDisplay report={result} onRerun={(e) => handleSubmit(e, result.businessAddress)} isRunning={loading} growthPlanTasks={growthPlanTasks} onTaskStatusChange={onTaskStatusChange} setActiveTool={setActiveTool} />
          
          {/* Save Analysis Button */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleSaveAnalysis}
              disabled={isSaving}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              {isSaving ? 'Saving...' : '💾 Save Analysis'}
            </button>
            
            <button
              onClick={() => setShowSavedList(!showSavedList)}
              className="px-6 py-3 bg-brand-card hover:bg-brand-light border border-brand-border text-brand-text font-semibold rounded-lg transition-colors shadow-md"
            >
              📂 View Saved Analyses ({savedAnalyses.length})
            </button>
            
            <button
              onClick={handleStartOver}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              Start New Scan
            </button>
          </div>

          {/* Saved Analyses List */}
          {showSavedList && savedAnalyses.length > 0 && (
            <div className="mt-6 bg-brand-card border border-brand-border rounded-lg p-6">
              <h3 className="text-xl font-bold text-brand-text mb-4">Saved Analyses</h3>
              <div className="space-y-3">
                {savedAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="flex items-center justify-between p-4 bg-brand-light rounded-lg border border-brand-border hover:border-accent-purple transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-brand-text">{analysis.target_url}</div>
                      <div className="text-sm text-brand-text-muted">
                        {new Date(analysis.created_at).toLocaleDateString()} at{' '}
                        {new Date(analysis.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleLoadAnalysis(analysis)}
                      className="px-4 py-2 bg-accent-purple hover:bg-accent-purple/80 text-white font-semibold rounded-lg transition-colors"
                    >
                      Load
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
          
          {savedAnalyses.length > 0 && (
            <div className="mt-6 pt-6 border-t border-brand-border">
              <button
                onClick={() => setShowSavedList(!showSavedList)}
                className="w-full px-6 py-3 bg-brand-card hover:bg-brand-light border border-brand-border text-brand-text font-semibold rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
              >
                📂 View Saved Analyses ({savedAnalyses.length})
              </button>
            </div>
          )}
          
          {showSavedList && savedAnalyses.length > 0 && (
            <div className="mt-6 bg-brand-card border border-brand-border rounded-lg p-6">
              <h3 className="text-xl font-bold text-brand-text mb-4">Saved Analyses</h3>
              <div className="space-y-3">
                {savedAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="flex items-center justify-between p-4 bg-brand-light rounded-lg border border-brand-border hover:border-accent-purple transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-brand-text">{analysis.target_url}</div>
                      <div className="text-sm text-brand-text-muted">
                        {new Date(analysis.created_at).toLocaleDateString()} at{' '}
                        {new Date(analysis.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleLoadAnalysis(analysis)}
                      className="px-4 py-2 bg-accent-purple hover:bg-accent-purple/80 text-white font-semibold rounded-lg transition-colors"
                    >
                      Load
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};