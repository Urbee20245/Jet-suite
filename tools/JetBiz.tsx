import React, { useState, useEffect } from 'react';
import type { Tool, AuditReport, BusinessSearchResult, ConfirmedBusiness, GrowthPlanTask, ProfileData, AuditIssue } from '../types';
import { searchGoogleBusiness, analyzeBusinessListing } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { MapPinIcon, StarIcon, TagIcon, InformationCircleIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon, ChevronDownIcon, ArrowDownTrayIcon, XMarkIcon, TrashIcon } from '../components/icons/MiniIcons';
import { ALL_TOOLS } from '../constants';
import { getSupabaseClient } from '../integrations/supabase/client';
import { syncToSupabase, loadFromSupabase } from '../utils/syncService';

interface JetBizProps {
  tool: Tool;
  addTasksToGrowthPlan: (tasks: Omit<GrowthPlanTask, 'id' | 'status' | 'createdAt' | 'completionDate'>[]) => void;
  onSaveAnalysis: (report: AuditReport | null) => void;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null, articleId?: string) => void;
  growthPlanTasks: GrowthPlanTask[];
  onTaskStatusChange: (taskId: string, newStatus: GrowthPlanTask['status']) => void;
  userId: string;
  activeBusinessId: string | null;
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
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Cycle through facts every 3.5 seconds
        const factInterval = setInterval(() => {
            setCurrentFactIndex(prev => (prev + 1) % gbpFacts.length);
        }, 3500);
        
        // Animate progress bar over 10 seconds (estimated max analysis time)
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) return prev; // Stop just before 100
                return prev + 5;
            });
        }, 500);

        return () => {
            clearInterval(factInterval);
            clearInterval(progressInterval);
        };
    }, []);

    return (
        <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg mt-6 text-center">
            <Loader />
            <h3 className="text-xl font-bold text-brand-text mt-4">Analyzing Your Profile...</h3>
            <p className="text-brand-text-muted mt-2">This may take up to 5 minutes as we compare you to local competitors.</p>
            
            {/* Progress Bar */}
            <div className="w-full max-w-md mx-auto my-6">
                <div className="relative pt-1">
                    <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-accent-purple/20">
                        <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-accent-blue to-accent-purple transition-all duration-500 ease-out"></div>
                    </div>
                    <p className="text-xs text-brand-text-muted text-right">{progress}% Complete</p>
                </div>
            </div>

            {/* Rotating Fact */}
            <div className="mt-6 bg-brand-darker p-4 rounded-lg border border-slate-700 min-h-[90px] flex items-center justify-center transition-opacity duration-500">
                <p className="text-white text-sm italic">
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

// --- CONSTANTS ---
const statusStyles = {
  to_do: { badge: 'bg-red-100 text-red-800', text: 'To Do' },
  in_progress: { badge: 'bg-yellow-100 text-yellow-800', text: 'In Progress' },
  completed: { badge: 'bg-green-100 text-green-800', text: 'Completed' },
};

const priorityStyles = {
  High: { icon: ExclamationTriangleIcon, badge: 'bg-red-100 text-red-800 border-red-200', iconColor: 'text-red-500' },
  Medium: { icon: ExclamationTriangleIcon, badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', iconColor: 'text-yellow-500' },
  Low: { icon: InformationCircleIcon, badge: 'bg-blue-100 text-blue-800 border-blue-200', iconColor: 'text-blue-500' },
};
// --- END CONSTANTS ---

// --- TYPES ---
// Simplified TaskCardProps: No longer needs onStatusChange
interface SimpleTaskCardProps {
  task: Omit<GrowthPlanTask, 'id' | 'status' | 'createdAt' | 'completionDate'>;
  isAdded: boolean;
  onAdd: () => void;
}

// Simplified IssueCardProps: No longer needs onStatusChange
interface SimpleIssueCardProps {
  issue: AuditIssue;
  isAdded: boolean;
  onAdd: () => void;
}
// --- END TYPES ---

// --- COMPONENTS ---
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

const JetBizResultDisplay: React.FC<{ 
    report: AuditReport, 
    growthPlanTasks: GrowthPlanTask[], 
    onRerun: (e: React.FormEvent) => Promise<void>, 
    isRunning: boolean, 
    onAddTask: (tasks: Omit<GrowthPlanTask, 'id' | 'status' | 'createdAt' | 'completionDate'>[]) => void,
    setActiveTool: (tool: Tool | null) => void 
}> = ({ report, growthPlanTasks, onRerun, isRunning, onAddTask, setActiveTool }) => {

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
        sourceModule: issue.task.sourceModule
    }]);
  };

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
                        The recommended tasks below have been added to your Growth Plan.
                        <button onClick={() => setActiveTool(ALL_TOOLS['growthplan'])} className="font-bold underline ml-2 whitespace-nowrap">Go to Growth Plan &rarr;</button>
                    </p>
                </div>
            </div>
        </div>
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h2 className="text-2xl font-extrabold text-brand-text">What You Should Do This Week</h2>
                <p className="text-brand-text-muted mt-1">Focus on these high-impact tasks. They are already in your Growth Plan.</p>
            </div>
            <button onClick={() => setActiveTool(ALL_TOOLS['growthplan'])} className="text-sm font-bold text-accent-purple hover:underline mt-2 sm:mt-0">View Growth Plan &rarr;</button>
        </div>
         <div className="mb-4">
            <div className="w-full bg-brand-light rounded-full h-2"><div className="bg-gradient-to-r from-accent-blue to-accent-purple h-2 rounded-full" style={{ width: `100%` }}></div></div>
        </div>
        <div className="space-y-4">
          {(report.weeklyActions || []).map((task, index) => (
            <SimpleTaskCard 
                key={index} 
                task={task} 
                isAdded={existingTaskTitles.has(task.title)}
                onAdd={() => handleAddWeeklyAction(task)}
            />
          ))}
        </div>
      </div>
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-extrabold text-brand-text mb-4">Full List of Issues Identified</h2>
        <div className="space-y-4">
          {(report.issues || []).map(issue => {
            const isAdded = existingTaskTitles.has(issue.task.title);
            return <SimpleIssueCard 
                key={issue.id} 
                issue={issue} 
                isAdded={isAdded}
                onAdd={() => handleAddIssueTask(issue)}
            />;
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
  
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (profileData.jetbizAnalysis) {
      setAuditReport(profileData.jetbizAnalysis);
      setStep('result');
    }
  }, [profileData.jetbizAnalysis]);
  
  if (!profileData.business.business_name) {
    return (
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg text-center">
        <InformationCircleIcon className="w-12 h-12 mx-auto text-accent-blue" />
        <h2 className="text-2xl font-bold text-brand-text mt-4">Complete Your Profile First</h2>
        <p className="text-brand-text-muted my-4 max-w-md mx-auto">Please provide your business name in your profile to use this tool.</p>
        <button onClick={() => setActiveTool(ALL_TOOLS['businessdetails'])} className="bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-2 px-6 rounded-lg">Go to Business Details</button>
      </div>
    );
  }

  if (profileData.googleBusiness.status === 'Not Created' && !profileData.jetbizAnalysis) {
      return <JetBizGuidanceMode setActiveTool={setActiveTool} />;
  }

  const businessQuery = profileData.business.location 
    ? `${profileData.business.business_name}, ${profileData.business.location}`
    : profileData.business.business_name;

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
    const minDelayPromise = new Promise(resolve => setTimeout(resolve, 1500)); // Minimum 1.5s delay
    
    try {
      const analysisPromise = analyzeBusinessListing(business);
      
      // Wait for both analysis and minimum delay
      const [analysis] = await Promise.all([
        analysisPromise,
        minDelayPromise
      ]);

      setAuditReport(analysis);
      // Tasks are automatically added to the Growth Plan via this call
      addTasksToGrowthPlan([...analysis.weeklyActions, ...analysis.issues.map(i => ({ ...i.task, whyItMatters: i.whyItMatters }))]);
      // Report is saved to the active profile via this call
      onSaveAnalysis(analysis);
    } catch (err) { 
      setError('Failed to get analysis. Please try again.'); 
    } 
    finally { 
      setLoading(false); 
    }
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
      onSaveAnalysis(null);
      setStep('initial');
      setSelectedBusiness(null);
      setAuditReport(null);
      setError('');
  }

  const renderContent = () => {
    // CRITICAL FIX: Show loading screen if analysis is running (loading is true) AND we don't have the report yet.
    if (loading && !auditReport) {
        return <AnalysisLoading />;
    }

    if (step === 'result' && auditReport) {
        return (
          <>
            <div className="bg-brand-card p-4 sm:p-6 rounded-xl shadow-lg mb-6 flex justify-between items-center">
              <div>
                  <h2 className="text-lg font-bold text-brand-text">
                      <span className="text-sm text-brand-text-muted font-normal">Analysis for:</span> 
                      <span className="ml-2 font-extrabold">{auditReport.businessName}</span>
                  </h2>
              </div>
              <button onClick={handleStartOver} className="text-sm font-semibold text-accent-purple hover:text-accent-pink">Start New Analysis</button>
            </div>
            {error && <p className="text-red-500 text-sm my-4 bg-red-100 p-4 rounded-lg">{error}</p>}
            <JetBizResultDisplay 
                report={auditReport} 
                growthPlanTasks={growthPlanTasks} 
                onRerun={handleRerun} 
                isRunning={loading} 
                onAddTask={addTasksToGrowthPlan} 
                setActiveTool={setActiveTool} 
            />
            
            {/* Single button to move to the next step */}
            <div className="mt-6">
                <button
                    onClick={() => setActiveTool(ALL_TOOLS['growthplan'])}
                    className="w-full bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-lg"
                >
                    Go to Growth Plan to Execute Tasks
                    <ArrowPathIcon className="w-5 h-5" />
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
            <p className="text-brand-text-muted mb-2"><span className="font-bold text-brand-text">{tool.description}</span></p>
            <p className="text-sm text-brand-text-muted mt-2">
                Replaces: <span className="text-accent-purple font-semibold">Local SEO Consultant ($500-2,000/mo)</span>
            </p>
            <button onClick={() => setActiveTool(ALL_TOOLS['knowledgebase'], 'foundation/jetbiz')} className="text-sm font-bold text-accent-purple hover:underline mt-2">Learn why Google Business Profile is critical &rarr;</button>
        </div>
        {profileData.googleBusiness.status === 'Not Verified' && step !== 'result' && ( <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4 rounded-r-lg"><div className="flex"><ExclamationTriangleIcon className="w-6 h-6 mr-3"/><p>Your profile isn't verified, so some data may be unavailable.</p></div></div> )}
        {error && <p className="text-red-500 bg-red-100 p-4 rounded-lg">{error}</p>}
        {renderContent()}
    </div>
    );
};