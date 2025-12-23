import React, { useState } from 'react';
import type { Tool, ProfileData, KeywordAnalysisResult, KeywordSearchResult } from '../types';
import { findKeywords } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { HowToUse } from '../components/HowToUse';
import { InformationCircleIcon } from '../components/icons/MiniIcons';
import { TOOLS } from '../constants';

interface JetKeywordsProps {
  tool: Tool;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null) => void;
}

const difficultyColor = (difficulty: string) => {
  switch (difficulty?.toLowerCase()) {
    case 'low':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const KeywordCategory: React.FC<{ title: string; keywords: KeywordSearchResult[] | undefined }> = ({ title, keywords }) => {
  if (!keywords || keywords.length === 0) return null;
  return (
    <div className="bg-brand-light p-4 rounded-lg border border-brand-border">
      <h4 className="text-lg font-semibold text-accent-purple mb-3">{title}</h4>
      <ul className="space-y-2">
        {keywords.map((kw, index) => (
          <li key={index} className="flex justify-between items-center bg-brand-card p-3 rounded-md shadow-sm">
            <span className="text-brand-text text-sm md:text-base break-all pr-2">{kw.keyword}</span>
            <div className="flex items-center space-x-3 flex-shrink-0">
              <span className="text-xs text-brand-text-muted font-mono hidden sm:inline">{kw.monthly_volume}</span>
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${difficultyColor(kw.difficulty)}`}>
                {kw.difficulty}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const JetKeywords: React.FC<JetKeywordsProps> = ({ tool, profileData, setActiveTool }) => {
  const { category: service, location } = profileData.business;
  const [result, setResult] = useState<KeywordAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const keywords = await findKeywords(service, location);
      setResult(keywords);
    } catch (err) {
      setError('Failed to find keywords. The AI may be having trouble with this request. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  if (!service || !location) {
    return (
        <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg text-center">
            <InformationCircleIcon className="w-12 h-12 mx-auto text-accent-blue" />
            <h2 className="text-2xl font-bold text-brand-text mt-4">Complete Your Profile</h2>
            <p className="text-brand-text-muted my-4 max-w-md mx-auto">
                Please set your business category and location in your profile to find relevant keywords.
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
                <li>Your primary service and location are automatically used from your active profile.</li>
                <li>Click 'Find Keywords' to get a categorized list of valuable local search terms.</li>
            </ul>
        </HowToUse>
      )}
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <p className="text-brand-text-muted mb-2">{tool.description}</p>
        <p className="text-sm text-brand-text-muted mb-6">
          Replaces: <span className="text-accent-purple font-semibold">SEO Tools (Ahrefs, SEMrush) ($99-399/mo)</span>
        </p>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text-muted flex items-center">
                <span className="text-sm font-medium text-brand-text mr-2">Primary Service:</span>
                <span className="font-semibold text-brand-text">{service}</span>
            </div>
            <div className="bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text-muted flex items-center">
                <span className="text-sm font-medium text-brand-text mr-2">Location:</span>
                <span className="font-semibold text-brand-text">{location}</span>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? 'Finding Keywords...' : 'Find Keywords'}
          </button>
        </form>
      </div>
      {loading && <Loader />}
      {result && (
        <div className="mt-6 bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-brand-text">Keyword Ideas</h3>
              <div className="hidden sm:flex items-center space-x-2 text-xs text-brand-text-muted">
                <span>Vol/Mo</span>
                <span>Difficulty</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <KeywordCategory title="Primary Keywords" keywords={result.primary_keywords} />
                <KeywordCategory title="Long-Tail Keywords" keywords={result.long_tail_keywords} />
                <KeywordCategory title="Question-Based Keywords" keywords={result.question_keywords} />
                <KeywordCategory title="Local Modifier Keywords" keywords={result.local_modifier_keywords} />
            </div>
        </div>
      )}
    </div>
  );
};
