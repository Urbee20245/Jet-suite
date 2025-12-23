import React, { useState } from 'react';
import type { Tool, AuditReport, GrowthPlanTask, ProfileData } from '../types';
import { analyzeCompetitor } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { AuditResultDisplay } from '../components/AuditResultDisplay';
import { HowToUse } from '../components/HowToUse';
import { InformationCircleIcon } from '../components/icons/MiniIcons';
import { ALL_TOOLS } from '../constants';

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

  if (!profileData.business.name) {
    return (
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg text-center">
        <InformationCircleIcon className="w-12 h-12 mx-auto text-accent-blue" />
        <h2 className="text-2xl font-bold text-brand-text mt-4">Complete Your Profile First</h2>
        <p className="text-brand-text-muted my-4 max-w-md mx-auto">
          Please add your own business details to your profile before analyzing a competitor. This helps the AI provide better counter-strategies.
        </p>
        <button
          onClick={() => setActiveTool(ALL_TOOLS['businessdetails'])}
          className="bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Go to Business Details
        </button>
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
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <p className="text-brand-text-muted mb-2">{tool.description}</p>
        <p className="text-sm text-brand-text-muted mb-6">
          Replaces: <span className="text-accent-purple font-semibold">Competitor Research Service ($300-1,500/mo)</span>
        </p>
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
            className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? 'Analyzing...' : 'Analyze Competitor'}
          </button>
        </form>
      </div>
      {loading && <Loader />}
      {result && <AuditResultDisplay report={result} onRerun={handleSubmit} isRunning={loading} />}
    </div>
  );
};