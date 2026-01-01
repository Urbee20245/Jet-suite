import React, { useState } from 'react';
import type { Tool, ProfileData, KeywordAnalysisResult, KeywordSearchResult } from '../types';
import { findKeywords, generateKeywordContentIdeas } from '../services/geminiService';
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

// NEW: Local type for content ideas
interface ContentIdea {
  title: string;
  type: string;
  target_keyword: string;
  search_intent: string;
  url_slug: string;
  content_outline: string;
  notes: string;
}

export const JetKeywords: React.FC<JetKeywordsProps> = ({ tool, profileData, setActiveTool }) => {
  const { category: service, location } = profileData.business;
  const [descriptiveKeywords, setDescriptiveKeywords] = useState('');
  const [result, setResult] = useState<KeywordAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);
  // NEW: blog/page ideas state
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[] | null>(null);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasError, setIdeasError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const keywordArray = descriptiveKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    if (keywordArray.length < 5) {
      setError('Please enter at least 5 descriptive keywords, separated by commas.');
      return;
    }
    
    setError('');
    setIdeasError('');
    setContentIdeas(null);
    setLoading(true);
    setResult(null);
    try {
      const keywords = await findKeywords(service, location, keywordArray.join(', '));
      setResult(keywords);
    } catch (err) {
      setError('Failed to find keywords. The AI may be having trouble with this request. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContentIdeas = async () => {
    if (!result) {
      setIdeasError('Run keyword research first, then generate content ideas.');
      return;
    }
    setIdeasError('');
    setIdeasLoading(true);
    setContentIdeas(null);
    try {
      const response = await generateKeywordContentIdeas(
        service,
        location,
        result,
        descriptiveKeywords
      );
      setContentIdeas(response.ideas || []);
    } catch (err) {
      console.error(err);
      setIdeasError('Failed to generate content ideas. Please try again in a moment.');
    } finally {
      setIdeasLoading(false);
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
                <li>Enter at least 5 keywords that describe your business or services, separated by commas.</li>
                <li>Click 'Find Keywords' to get a categorized list of valuable local search terms.</li>
                <li>Then click 'Generate Blog & Page Ideas' to turn those keywords into SEO-focused content topics for your site.</li>
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
          
          <div className="mb-6">
            <label htmlFor="descriptive-keywords" className="block text-sm font-medium text-brand-text mb-2">
              Your Descriptive Keywords (Min 5, separated by commas)
            </label>
            <textarea
              id="descriptive-keywords"
              rows={3}
              value={descriptiveKeywords}
              onChange={(e) => setDescriptiveKeywords(e.target.value)}
              placeholder="e.g., emergency plumber, water heater repair, drain cleaning, affordable plumbing, 24/7 service"
              className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition resize-none"
            />
            <p className="text-xs text-brand-text-muted mt-1">
              Enter keywords that accurately describe your business and services.
            </p>
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
        <div className="mt-6 bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg space-y-6">
            <div className="flex justify-between items-center mb-2">
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

            {/* Content Ideas CTA */}
            <div className="mt-4 border-t border-brand-border pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-2">
                <InformationCircleIcon className="w-5 h-5 text-accent-purple mt-0.5" />
                <p className="text-sm text-brand-text-muted">
                  Turn these keywords into specific blog posts and service pages your team can publish to improve rankings and drive local growth.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateContentIdeas}
                disabled={ideasLoading}
                className="w-full sm:w-auto bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {ideasLoading ? 'Generating Ideas...' : 'Generate Blog & Page Ideas'}
              </button>
            </div>
            {ideasError && <p className="text-red-500 text-sm">{ideasError}</p>}
        </div>
      )}
      {ideasLoading && !loading && (
        <div className="mt-4">
          <Loader />
        </div>
      )}
      {contentIdeas && contentIdeas.length > 0 && (
        <div className="mt-6 bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold text-brand-text mb-2">Content Ideas for Rankings & Growth</h3>
          <p className="text-sm text-brand-text-muted mb-4">
            Use these as blog posts and core pages on your website. Each idea is tied to a specific keyword and intent.
          </p>
          <div className="space-y-4">
            {contentIdeas.map((idea, idx) => (
              <div
                key={idx}
                className="bg-brand-light border border-brand-border rounded-lg p-4 flex flex-col gap-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold text-brand-text text-base md:text-lg">
                    {idea.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-full font-semibold ${
                      idea.type === 'service_page' || idea.type === 'landing_page'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {idea.type === 'service_page' || idea.type === 'landing_page' ? 'Core Page' : 'Blog Post'}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 font-mono">
                      {idea.search_intent}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-brand-text-muted">
                  Target keyword: <span className="font-semibold">{idea.target_keyword}</span>
                </p>
                <p className="text-xs text-brand-text-muted">
                  URL suggestion: <span className="font-mono text-[11px] break-all">{idea.url_slug}</span>
                </p>
                <div>
                  <p className="text-xs font-semibold text-brand-text mb-1">Outline:</p>
                  <p className="text-xs text-brand-text-muted whitespace-pre-wrap">
                    {idea.content_outline}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-brand-text mb-1">Why this helps:</p>
                  <p className="text-xs text-brand-text-muted">
                    {idea.notes}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};