business_name).">
import React, { useState, useEffect } from 'react';
import type { Tool, AuditReport, BusinessSearchResult, ConfirmedBusiness, GrowthPlanTask, ProfileData, AuditIssue } from '../types';
import { searchGoogleBusiness, analyzeBusinessListing } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { MapPinIcon, StarIcon, TagIcon, InformationCircleIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon, ChevronDownIcon, ArrowDownTrayIcon, XMarkIcon } from '../components/icons/MiniIcons';
import { ALL_TOOLS } from '../constants';
import { getSupabaseClient } from '../integrations/supabase/client';

interface JetBizProps {
  tool: Tool;
  addTasksToGrowthPlan: (tasks: Omit<GrowthPlanTask, 'id' | 'status' | 'createdAt' | 'completionDate'>[]) => void;
  onSaveAnalysis: (report: AuditReport | null) => void;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null, articleId?: string) => void;
  growthPlanTasks: GrowthPlanTask[];
  onTaskStatusChange: (taskId: string, newStatus: GrowthPlanTask['status']) => void;
  userId: string; // Added for persistence
  activeBusinessId: string | null; // Added for persistence
}

const gbpFacts = [
  "Did you know? Businesses that add photos to their Google Business Profiles receive 42% more requests for directions.",
  "Fact: Companies that respond to customer reviews are perceived as 1.7x more trustworthy.",
  "Pro Tip: Regularly posting updates on your Google Business Profile can significantly boost your local search ranking.",
  "Did you know? Completing your Google Business Profile can lead to a 70% increase in location visits.",
  "Fact: Businesses with complete and accurate information are 2.7x more likely to be considered reputable by consumers.",
  "Optimizing for 'near me' searches is crucial. 76% of people who search for something nearby on their smartphone visit a related business within a day."
];

const AnalysisLoading: React.FC = () => {
    const [currentFactIndex, setCurrentFactIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentFactIndex(prev => (prev + 1) % gbpFacts.length);
        }, 3500); // Change fact every 3.5 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg mt-6 text-center">
            <Loader />
            <h3 className="text-xl font-bold text-brand-text mt-4">Analyzing Your Profile...</h3>
            <p className="text-brand-text-muted mt-2">This may take a moment as we compare you to local competitors.</p>
            
            <div className="mt-6 bg-brand-light p-4 rounded-lg border border-brand-border min-h-[90px] flex items-center justify-center transition-opacity duration-500">
                <p className="text-brand-text-muted text-sm italic">
                    {gbpFacts[currentFactIndex]}
                </p>
            </div>
        </div>
    );
};

const BusinessResultCard: React.FC<{ business: BusinessSearchResult; onSelect: (business: BusinessSearchResult) => void; }> = ({ business, onSelect }) => (
    <button onClick={() => onSelect(business)} className="w-full text-left p-4 bg-white hover:bg-brand-light rounded-lg border border-brand-border shadow-sm transition-all duration-200 flex flex-col justify-between">
        <div>
            <h3 className="font-bold text-brand-text">{business.name}</h3>
            <p className="text-sm text-brand-text-muted mt-1 flex items-start">
                <MapPinIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{business.address}</span>
            </p>
        </div>
        <div className="flex items-center justify-between text-xs text-brand-text-muted mt-3 pt-3 border-t border-brand-border">
            <span className="flex items-center font-semibold">
                <StarIcon className="w-4 h-4 mr-1 text-yellow-400" /> {business.rating} ({business.reviewCount})
            </span>
             <span className="flex items-center bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                <TagIcon className="w-3 h-3 mr-1" /> {business.category}
            </span>
        </div>
    </button>
);

const JetBizGuidanceMode: React.FC<{setActiveTool: (tool: Tool | null) => void}> = ({setActiveTool}) => (
    <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-brand-text">Pre-Profile Guidance Mode</h2>
            <p className="text-brand-text-muted mt-1">Your Google Business Profile isn't connected yet. Here's how to get started.</p>
          </div>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">GUIDANCE</span>
        </div>
        
        <div className="bg-brand-light p-6 rounded-lg border border-brand-border">
          <p className="text-brand-text mb-4">A verified Google Business Profile is the most important step for local discovery. Follow this checklist to create a powerful profile, then connect it to JetSuite to run a full analysis.</p>
          <ul className="space-y-3">
            <li className="flex items-start"><CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"/><span>Choose the most accurate primary business category.</span></li>
            <li className="flex items-start"><CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"/><span>Add high-quality photos of your business, products, and team.</span></li>
            <li className="flex items-start"><CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"/><span>Write a compelling, keyword-rich business description.</span></li>
            <li className="flex items-start"><CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"/><span>Ensure your business name, address, and phone number (NAP) are consistent everywhere.</span></li>
          </ul>
        </div>
        
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <a href="https://www.google.com/business/" target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-accent-blue hover:bg-accent-blue/80 text-white font-bold py-3 px-5 rounded-lg transition-colors shadow">
                Create Google Business Profile
            </a>
            <button onClick={() => setActiveTool(ALL_TOOLS['businessdetails'])} className="flex-1 text-center bg-brand-card hover:bg-brand-light border border-brand-border font-bold py-3 px-5 rounded-lg transition-colors shadow-sm">
                Update Profile Status in JetSuite
            </button>
        </div>
    </div>
);

// --- New Result Display Components for JetBiz ---

const priorityStyles = {
  High: { icon: ExclamationTriangleIcon, badge: 'bg-red-100 text-red-800 border-red-200', iconColor: 'text-red-500' },
  Medium: { icon: ExclamationTriangleIcon, badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', iconColor: 'text-yellow-500' },
  Low: { icon: InformationCircleIcon, badge: 'bg-blue-100 text-blue-800 border-blue-200', iconColor: 'text-blue-500' },
};

const statusStyles = {
  to_do: { badge: 'bg-red-100 text-red-800', text: 'To Do' },
  in_progress: { badge: 'bg-yellow-100 text-yellow-800', text: 'In Progress' },
  completed: { badge: 'bg-green-100 text-green-800', text: 'Completed' },
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
    if (correspondingTask) {
      onStatusChange(correspondingTask.id, newStatus);
    }
  };
  
  const handleToggleComplete = () => {
    if (correspondingTask) {
        onStatusChange(correspondingTask.id, isCompleted ? 'to_do' : 'completed');
    }
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
      )}
    </div>
  );
};


const JetBizResultDisplay: React.FC<{ report: AuditReport, growthPlanTasks: GrowthPlanTask[], onRerun: (e: React.FormEvent) => Promise<void>, isRunning: boolean, onTaskStatusChange: (id: string, status: GrowthPlanTask['status']) => void, setActiveTool: (tool: Tool | null) => void }> = ({ report, growthPlanTasks, onRerun, isRunning, onTaskStatusChange, setActiveTool }) => {
  const [showCompleted, setShowCompleted] = useState(false);

  const weeklyActionTasks = report.weeklyActions.map(action => growthPlanTasks.find(t => t.title === action.title)).filter(Boolean) as GrowthPlanTask[];
  const completedWeeklyTasks = weeklyActionTasks.filter(t => t.status === 'completed').length;
  const progress = weeklyActionTasks.length > 0 ? (completedWeeklyTasks / weeklyActionTasks.length) * 100 : 0;
  
  const displayedTasks = showCompleted ? weeklyActionTasks : weeklyActionTasks.filter(t => t.status !== 'completed');

  return (
    <div className="space-y-8 mt-6">
       <div className="bg-accent-blue/10 border-l-4 border-accent-blue text-accent-blue/90 p-4 rounded-r-lg">
            <div className="flex">
                <div className="py-1">
                    <InformationCircleIcon className="w-6 h-6 mr-3"/>
                </div>
                <div>
                    <p className="font-bold">Your Action Plan is Ready!</p>
                    <p className="text-sm">
                        All tasks from this analysis have been added to your Growth Plan.
                        When you leave this page, you can find them there to track your progress and start executing.
                        <button onClick={() => setActiveTool(ALL_TOOLS['growthplan'])} className="font-bold underline ml-2 whitespace-nowrap">Go to Growth Plan &rarr;</button>
                    </p>
                </div>
            </div>
        </div>
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
            <div>
                <h2 className="text-2xl font-extrabold text-brand-text">What You Should Do This Week</h2>
                <p className="text-brand-text-muted mt-1">Focus on these high-impact tasks. They've been added to your Growth Plan.</p>
            </div>
            <button onClick={() => setActiveTool(ALL_TOOLS['growthplan'])} className="text-sm font-bold text-accent-purple hover:underline mt-2 sm:mt-0">View Growth Plan &rarr;</button>
        </div>
         <div className="mb-4">
            <div className="flex justify-between items-center mb-1"><span className="text-sm font-semibold">{completedWeeklyTasks} of {weeklyActionTasks.length} done</span><span className="text-sm font-bold">{Math.round(progress)}%</span></div>
            <div className="w-full bg-brand-light rounded-full h-2"><div className="bg-gradient-to-r from-accent-blue to-accent-purple h-2 rounded-full" style={{ width: `${progress}%` }}></div></div>
        </div>
        <div className="space-y-4">
          {displayedTasks.map(task => ( <TaskCard key={task.id} task={task} onStatusChange={onTaskStatusChange} /> ))}
        </div>
        <div className="flex justify-between items-center mt-4">
            <label className="flex items-center text-sm"><input type="checkbox" checked={showCompleted} onChange={e => setShowCompleted(e.target.checked)} className="h-4 w-4 rounded mr-2"/> Show Completed</label>
            <button onClick={() => setActiveTool(ALL_TOOLS['growthplan'])} className="text-sm font-bold text-accent-purple hover:underline">Manage all tasks in Growth Plan &rarr;</button>
        </div>
      </div>
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-extrabold text-brand-text mb-4">Full List of Issues Identified</h2>
        <div className="space-y-4">
          {report.issues.map(issue => {
            const correspondingTask = growthPlanTasks.find(t => t.title === issue.task.title);
            return <IssueCard key={issue.id} issue={issue} correspondingTask={correspondingTask} onStatusChange={onTaskStatusChange} />;
          })}
        </div>
      </div>
    </div>
  );
};

export const JetBiz: React.FC<JetBizProps> = ({ tool, addTasksToGrowthPlan, onSaveAnalysis, profileData, setActiveTool, growthPlanTasks, onTaskStatusChange, userId, activeBusinessId }) => {
  const [step, setStep] = useState<'initial' | 'select' | 'confirm' | 'result'>('initial');
  const [searchResults, setSearchResults] = useState<BusinessSearchResult[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessSearchResult | null>(null);
  
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // --- PERSISTENCE STATE ---
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);
  
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (profileData.jetbizAnalysis) {
      setAuditReport(profileData.jetbizAnalysis);
      setStep('result');
    }
  }, [profileData.jetbizAnalysis]);
  
  // --- PERSISTENCE EFFECTS ---
  useEffect(() => {
    if (userId && activeBusinessId) {
      loadSavedAnalyses();
    }
  }, [userId, activeBusinessId]);

  const loadSavedAnalyses = async () => {
    if (!supabase || !userId || !activeBusinessId) return;
    
    try {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('id, created_at, target_url, results')
        .eq('user_id', userId)
        .eq('business_id', activeBusinessId)
        .eq('tool_name', 'jetbiz')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      if (data) setSavedAnalyses(data);
    } catch (error) {
      console.error('Error loading saved analyses:', error);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!supabase || !userId || !activeBusinessId || !auditReport) return;
    
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('analysis_results')
        .insert({
          user_id: userId,
          business_id: activeBusinessId,
          tool_name: 'jetbiz',
          analysis_type: 'full_audit',
          target_url: auditReport.businessAddress,
          results: auditReport // Save the full AuditReport object
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

  const handleLoadAnalysis = (analysis: any) => {
    // The full AuditReport object is stored in the 'results' field
    const loadedReport = analysis.results as AuditReport;
    
    setAuditReport(loadedReport);
    setSelectedBusiness({
        name: loadedReport.businessName,
        address: loadedReport.businessAddress,
        rating: 0, // Placeholder
        reviewCount: 0, // Placeholder
        category: '' // Placeholder
    });
    setStep('result');
    setShowSavedList(false);
  };
  // --- END PERSISTENCE EFFECTS ---

  const businessQuery = `${profileData.business.business_name}, ${profileData.business.location}`;

  if (!profileData.business.business_name || !profileData.business.location) {
    return (
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg text-center">
        <InformationCircleIcon className="w-12 h-12 mx-auto text-accent-blue" />
        <h2 className="text-2xl font-bold text-brand-text mt-4">Complete Your Profile</h2>
        <p className="text-brand-text-muted my-4 max-w-md mx-auto">Please provide your business name and location in your profile to use this tool.</p>
        <button onClick={() => setActiveTool(ALL_TOOLS['businessdetails'])} className="bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-2 px-6 rounded-lg">Go to Business Details</button>
      </div>
    );
  }

  if (profileData.googleBusiness.status === 'Not Created' && !profileData.jetbizAnalysis) {
      return <JetBizGuidanceMode setActiveTool={setActiveTool} />;
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true); setSearchResults([]);
    try {
      const results = await searchGoogleBusiness(businessQuery);
      if (results.length === 0) setError('No businesses found. Try updating your profile.');
      else if (results.length === 1) { setSelectedBusiness(results[0]); setStep('confirm'); }
      else { setSearchResults(results); setStep('select'); }
    } catch (err) { setError('Failed to search for businesses.'); } 
    finally { setLoading(false); }
  };

  const runAnalysis = async (business: ConfirmedBusiness) => {
    try {
      const analysis = await analyzeBusinessListing(business);
      setAuditReport(analysis);
      addTasksToGrowthPlan([...analysis.weeklyActions, ...analysis.issues.map(i => ({ ...i.task, whyItMatters: i.whyItMatters }))]);
      onSaveAnalysis(analysis);
    } catch (err) { setError('Failed to get analysis. Please try again.'); } 
    finally { setLoading(false); }
  }

  const handleConfirm = async () => {
    if (!selectedBusiness) return;
    setError(''); setLoading(true); setAuditReport(null);
    setStep('result');
    await runAnalysis(selectedBusiness);
  };

  const handleRerun = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!auditReport) return;
      setError(''); setLoading(true); setAuditReport(null);
      await runAnalysis({ name: auditReport.businessName, address: auditReport.businessAddress, rating: 0, reviewCount: 0, category: ''});
  }
  
  const handleStartOver = () => {
      onSaveAnalysis(null); // Clear persisted analysis
      setStep('initial');
      setSelectedBusiness(null);
      setAuditReport(null);
      setError('');
  }

  const renderContent = () => {
    if (loading && step === 'result') {
        return <AnalysisLoading />;
    }
    if (step === 'result' && auditReport) {
        return (
          <>
            <div className="bg-brand-card p-4 sm:p-6 rounded-xl shadow-lg mb-6 flex justify-between items-center">
              <div>
                  <p className="text-sm text-brand-text-muted">Analysis for:</p>
                  <h2 className="text-lg font-bold text-brand-text">{auditReport.businessName}</h2>
              </div>
              <button onClick={handleStartOver} className="text-sm font-semibold text-accent-purple hover:text-accent-pink">Start New Analysis</button>
            </div>
            {error && <p className="text-red-500 text-sm my-4 bg-red-100 p-4 rounded-lg">{error}</p>}
            <JetBizResultDisplay report={auditReport} growthPlanTasks={growthPlanTasks} onRerun={handleRerun} isRunning={loading} onTaskStatusChange={onTaskStatusChange} setActiveTool={setActiveTool} />
            
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
            </div>
          </>
        );
    }

    switch (step) {
      case 'initial': return ( <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg"><form onSubmit={handleSearch}><button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-3 px-4 rounded-lg">{loading ? 'Searching...' : 'Analyze My Business'}</button></form></div> );
      case 'select': return ( <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg"><h2 className="text-xl font-bold">Is this your business?</h2><p className="mb-6">Please choose the correct listing.</p><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{searchResults.map((biz, i) => <BusinessResultCard key={i} business={biz} onSelect={(b) => { setSelectedBusiness(b); setStep('confirm'); }} />)}</div></div> );
      case 'confirm': if (!selectedBusiness) return null; return ( <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg"><h2 className="text-xl font-bold">Confirm Your Selection</h2><p className="mb-6">Please confirm this is correct before we run the analysis.</p><div className="bg-brand-light border rounded-lg p-4"><h3 className="font-bold text-lg">{selectedBusiness.name}</h3><p className="text-sm mt-1">{selectedBusiness.address}</p></div><div className="flex justify-between mt-6"><button onClick={() => setStep('select')} className="text-sm font-semibold">&larr; Choose a different listing</button><button onClick={handleConfirm} disabled={loading} className="bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-3 px-6 rounded-lg">{loading ? 'Analyzing...' : 'Confirm & Analyze'}</button></div></div> );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
        <div className="mb-6 bg-brand-card p-4 rounded-xl shadow-sm border border-brand-border">
            <p className="text-brand-text-muted">{tool.description}</p>
            <p className="text-sm text-brand-text-muted mt-2">
                Replaces: <span className="text-accent-purple font-semibold">Local SEO Consultant ($500-2,000/mo)</span>
            </p>
            <button onClick={() => setActiveTool(ALL_TOOLS['knowledgebase'], 'foundation/jetbiz')} className="text-sm font-bold text-accent-purple hover:underline mt-2">Learn why Google Business Profile is critical &rarr;</button>
        </div>
        {profileData.googleBusiness.status === 'Not Verified' && step !== 'result' && ( <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4 rounded-r-lg"><div className="flex"><ExclamationTriangleIcon className="w-6 h-6 mr-3"/><p>Your profile isn't verified, so some data may be unavailable.</p></div></div> )}
        {error && <p className="text-red-500 bg-red-100 p-4 rounded-lg">{error}</p>}
        {loading && step === 'initial' && <Loader />}
        {renderContent()}
        
        {/* Saved Analyses List */}
        {showSavedList && savedAnalyses.length > 0 && (
            <div className="mt-6 bg-brand-card border border-brand-border rounded-lg p-6">
              <h3 className="text-xl font-bold text-brand-text mb-4">Saved Analyses</h3>
              <div className="space-y-3">
                {savedAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="flex items-center justify-between p-4 bg-brand-light rounded-lg border border-brand-border hover:border-accent-purple transition-colors"
                    onClick={() => handleLoadAnalysis(analysis)}
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
    );
};