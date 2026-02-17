import React, { useState } from 'react';
import type { Tool, AuditReport, GrowthPlanTask, ProfileData } from '../types';
import { analyzeCompetitor } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { AuditResultDisplay } from '../components/AuditResultDisplay';
import { HowToUse } from '../components/HowToUse';
import { InformationCircleIcon, ChartBarIcon, SparklesIcon, BoltIcon, TrendingUpIcon, ArrowRightIcon } from '../components/icons/MiniIcons';
import { ALL_TOOLS } from '../constants';
import { AnalysisLoadingState } from '../components/AnalysisLoadingState';

interface JetCompeteProps {
  tool: Tool;
  addTasksToGrowthPlan: (tasks: Omit<GrowthPlanTask, 'id' | 'status' | 'createdAt' | 'completionDate'>[]) => void;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null) => void;
}

export const JetCompete: React.FC<JetCompeteProps> = ({ tool, addTasksToGrowthPlan, profileData, setActiveTool }) => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);

  if (!profileData.business.business_name) {
    return (
      <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden text-center">
        <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center flex-shrink-0">
            <InformationCircleIcon className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-brand-text mt-2">Complete Your Profile First</h2>
          <p className="text-brand-text-muted my-4 max-w-md mx-auto">
            Please add your own business details to your profile before analyzing a competitor. This helps the AI provide better counter-strategies.
          </p>
          <button
            onClick={() => setActiveTool(ALL_TOOLS['businessdetails'])}
            className="bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-2 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-accent-purple/20 active:scale-[0.99]"
          >
            <span className="flex items-center gap-2 justify-center">
              <ArrowRightIcon className="w-4 h-4" />
              Go to Business Details
            </span>
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError('Please enter a competitor URL.');
      return;
    }
    try { new URL(url); } catch (_) {
      setError('Please enter a valid URL.');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);
    try {
      const analysis = await analyzeCompetitor(url);
      setResult(analysis);
      addTasksToGrowthPlan(analysis.weeklyActions);
    } catch (err) {
      setError('Failed to analyze competitor. The AI may be having trouble with this request. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {showHowTo && (
        <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
            <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Enter the full website URL of a direct competitor.</li>
                <li>Click 'Analyze Competitor' to identify their strengths and weaknesses.</li>
                <li>Receive a set of counter-strategies to add to your Growth Plan.</li>
            </ul>
        </HowToUse>
      )}
      <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
        <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center flex-shrink-0">
            <ChartBarIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-brand-text text-sm">Competitor Analysis</h2>
            <p className="text-xs text-brand-text-muted">See what your competitors are doing</p>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-accent-blue/5 via-brand-card to-accent-purple/5 border border-brand-border rounded-2xl p-6 mb-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent-purple/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <p className="text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-3">What you get</p>
            <div className="grid grid-cols-2 gap-3 relative">
              {[
                { icon: '🔍', title: 'Live Competitor Scan', desc: 'AI finds real local competitors' },
                { icon: '📊', title: 'SWOT Analysis', desc: 'Strengths, weaknesses & opportunities' },
                { icon: '💡', title: 'Action Insights', desc: 'Specific steps to outperform them' },
                { icon: '🚀', title: 'Growth Gaps', desc: 'Untapped market opportunities' },
              ].map(f => (
                <div key={f.title} className="flex items-start gap-2">
                  <span className="text-lg">{f.icon}</span>
                  <div><p className="font-semibold text-brand-text text-xs">{f.title}</p><p className="text-xs text-brand-text-muted">{f.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://competitor-website.com"
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
              />
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:shadow-accent-purple/20 active:scale-[0.99]"
            >
              <span className="flex items-center gap-2 justify-center">
                <ChartBarIcon className="w-4 h-4" />
                {loading ? 'Analyzing...' : 'Analyze Competitor'}
              </span>
            </button>
          </form>
        </div>
      </div>
      {loading && (
          <AnalysisLoadingState 
            title="Analyzing Competitor Strategy"
            message="Our AI is performing a deep dive into your competitor's online presence and identifying strategic gaps. This can take up to 5 minutes."
            durationEstimateSeconds={300}
          />
      )}
      {result && <AuditResultDisplay report={result} onRerun={handleSubmit} isRunning={loading} />}
    </div>
  );
};
