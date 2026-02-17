import React, { useState } from 'react';
import type { Tool, ProfileData } from '../types';
import { generateEventIdeas } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { ResultDisplay } from '../components/ResultDisplay';
import { HowToUse } from '../components/HowToUse';
import { InformationCircleIcon, SparklesIcon, BoltIcon, ArrowRightIcon } from '../components/icons/MiniIcons';
import { TOOLS } from '../constants';
import { AnalysisLoadingState } from '../components/AnalysisLoadingState';

interface JetEventsProps {
  tool: Tool;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null) => void;
}

export const JetEvents: React.FC<JetEventsProps> = ({ tool, profileData, setActiveTool }) => {
  const businessType = profileData.business.industry;
  const [goal, setGoal] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal) {
      setError('Please provide a goal for your event or promotion.');
      return;
    }
    setError('');
    setLoading(true);
    setResult('');
    try {
      const analysis = await generateEventIdeas(businessType, goal);
      setResult(analysis);
    } catch (err) {
      setError('Failed to generate ideas. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!businessType) {
    return (
      <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden text-center">
        <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center flex-shrink-0">
            <InformationCircleIcon className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-bold text-brand-text text-sm">Profile Setup Required</h2>
        </div>
        <div className="p-6 sm:p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-accent-blue to-accent-purple rounded-2xl flex items-center justify-center mx-auto mb-6">
            <InformationCircleIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-brand-text mt-4">Complete Your Profile First</h2>
          <p className="text-brand-text-muted my-4 max-w-md mx-auto">
            Please add a category to your business profile to brainstorm tailored events and promotions.
          </p>
          <button
            onClick={() => setActiveTool(TOOLS.find(t => t.id === 'businessdetails')!)}
            className="bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-2 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-accent-purple/20 active:scale-[0.99] flex items-center gap-2 mx-auto"
          >
            <ArrowRightIcon className="w-4 h-4" />
            Go to Business Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {showHowTo && (
        <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
            <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Your business type is automatically pulled from your profile.</li>
                <li>State your primary goal for the event (e.g., 'attract new families', 'reward loyal customers').</li>
                <li>Click 'Generate Ideas' to get a list of creative, local event concepts.</li>
            </ul>
        </HowToUse>
      )}
      <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
        <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center flex-shrink-0">
            <BoltIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-brand-text text-sm">Event Promotion</h2>
            <p className="text-xs text-brand-text-muted">Generate content to promote your event</p>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-brand-text-muted mb-6">{tool.description}</p>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text-muted flex items-center">
                  <span className="text-sm font-medium text-brand-text mr-2">Business Type:</span>
                  <span className="font-semibold text-brand-text">{businessType}</span>
              </div>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What is your goal? (e.g., Increase traffic)"
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
              />
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:shadow-accent-purple/20 active:scale-[0.99] text-lg flex items-center justify-center gap-2"
            >
              {loading ? 'Brainstorming...' : <><SparklesIcon className="w-5 h-5" /> Generate Ideas</>}
            </button>
          </form>
        </div>
      </div>
      {loading && (
          <AnalysisLoadingState 
            title="Brainstorming Local Event Ideas"
            message="Our AI is generating creative, local event and promotion ideas tailored to your business and goals. This can take up to 5 minutes."
            durationEstimateSeconds={300}
          />
      )}
      {result && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ResultDisplay markdownText={result} />
          </div>
      )}
    </div>
  );
};
