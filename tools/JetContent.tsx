import React, { useState, useEffect } from 'react';
import type { Tool, ProfileData, KeywordData } from '../types';
import { generateLocalContent } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { ResultDisplay } from '../components/ResultDisplay';
import { HowToUse } from '../components/HowToUse';
import { InformationCircleIcon } from '../components/icons/MiniIcons';
import { TOOLS } from '../constants';

interface JetContentProps {
  tool: Tool;
  initialProps: { keyword: KeywordData; type: string } | null;
  profileData: ProfileData;
  setActiveTool: (tool: Tool) => void;
}

export const JetContent: React.FC<JetContentProps> = ({ tool, initialProps, profileData, setActiveTool }) => {
  const [businessType] = useState(profileData.business.category || '');
  const [topic, setTopic] = useState(initialProps?.keyword?.keyword || '');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);

  useEffect(() => {
    if (initialProps?.keyword?.keyword) {
      setTopic(initialProps.keyword.keyword);
    }
  }, [initialProps]);

  if (!businessType) {
    return (
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg text-center">
        <InformationCircleIcon className="w-12 h-12 mx-auto text-accent-blue" />
        <h2 className="text-2xl font-bold text-brand-text mt-4">Set Your Business Category</h2>
        <p className="text-brand-text-muted my-4 max-w-md mx-auto">
          Please add a category to your business profile (e.g., "Coffee Shop") to generate relevant content.
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) {
      setError('Please provide a topic for the article.');
      return;
    }
    setError('');
    setLoading(true);
    setResult('');
    try {
      const analysis = await generateLocalContent(businessType, topic);
      setResult(analysis);
    } catch (err) {
      setError('Failed to generate content. Please try again.');
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
                <li>Your business type is automatically used from your active profile.</li>
                <li>Enter a topic you want to write about, or launch from JetKeywords.</li>
                <li>Click 'Generate Content' to create a locally-optimized blog post for your website.</li>
            </ul>
        </HowToUse>
      )}
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <p className="text-brand-text-muted mb-6">{tool.description}</p>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text-muted flex items-center">
                <span className="text-sm font-medium text-brand-text mr-2">Business Type:</span>
                <span className="font-semibold text-brand-text">{businessType}</span>
            </div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Article Topic (e.g., 'Benefits of Sourdough')"
              className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? 'Writing Article...' : 'Generate Content'}
          </button>
        </form>
      </div>
      {loading && <Loader />}
      {result && <ResultDisplay markdownText={result} />}
    </div>
  );
};
