import React, { useState } from 'react';
import type { Tool, ProfileData } from '../types';
import { generateEventIdeas } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { ResultDisplay } from '../components/ResultDisplay';
import { HowToUse } from '../components/HowToUse';
import { InformationCircleIcon, SparklesIcon } from '../components/icons/MiniIcons';
import { TOOLS } from '../constants';

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
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg text-center">
        <InformationCircleIcon className="w-12 h-12 mx-auto text-accent-blue" />
        <h2 className="text-2xl font-bold text-brand-text mt-4">Complete Your Profile First</h2>
        <p className="text-brand-text-muted my-4 max-w-md mx-auto">
          Please add a category to your business profile to brainstorm tailored events and promotions.
        </p>
        <button
          onClick={() => setActiveTool(TOOLS.find(t => t.id === 'businessdetails')!)}
          className="bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Go to Business Details
        </button>
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
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg border border-brand-border">
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
            className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-lg flex items-center justify-center gap-2"
          >
            {loading ? 'Brainstorming...' : <><SparklesIcon className="w-5 h-5" /> Generate Ideas</>}
          </button>
        </form>
      </div>
      {loading && (
          <div className="mt-12">
              <Loader />
              <p className="text-center text-brand-text-muted animate-pulse">Our AI is brainstorming creative local events for your business...</p>
          </div>
      )}
      {result && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ResultDisplay markdownText={result} />
          </div>
      )}
    </div>
  );
};