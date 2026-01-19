import React, { useState, useEffect } from 'react';
import type { Tool, ProfileData, KeywordData } from '../types';
import { generateLocalContent, suggestBlogTitles } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { ResultDisplay } from '../components/ResultDisplay';
import { HowToUse } from '../components/HowToUse';
import { InformationCircleIcon, SparklesIcon, CheckCircleIcon, ArrowRightIcon } from '../components/icons/MiniIcons';
import { TOOLS } from '../constants';

interface JetContentProps {
  tool: Tool;
  initialProps: { keyword: KeywordData; type: string } | null;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null) => void;
}

export const JetContent: React.FC<JetContentProps> = ({ tool, initialProps, profileData, setActiveTool }) => {
  const [businessType] = useState(profileData.business.industry || '');
  const [topic, setTopic] = useState(initialProps?.keyword?.keyword || '');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestingTitles, setSuggestingTitles] = useState(false);
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
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

  const handleSuggestTitles = async () => {
    setSuggestingTitles(true);
    setError('');
    try {
        const titles = await suggestBlogTitles(profileData);
        setSuggestedTitles(titles);
    } catch (err) {
        setError('Failed to brainstorm titles. Please try again.');
    } finally {
        setSuggestingTitles(false);
    }
  };

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
      const brandStyle = profileData.brandDnaProfile?.visual_identity.layout_style || 'professional';
      const location = profileData.business.location || profileData.googleBusiness.address || 'Local Area';
      
      const analysis = await generateLocalContent(businessType, topic, location, brandStyle);
      setResult(analysis);
    } catch (err) {
      setError('Failed to generate content. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {showHowTo && (
        <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
            <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Use **Brainstorm Titles** to get AI-powered, SEO-optimized topic ideas.</li>
                <li>Your business details and location are automatically used for maximum local SEO impact.</li>
                <li>Each article includes a Meta Description and SEO-optimized heading structure.</li>
            </ul>
        </HowToUse>
      )}
      
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg border border-brand-border">
        <p className="text-brand-text-muted mb-2">{tool.description}</p>
        <p className="text-sm text-brand-text-muted mb-6">
          Replaces: <span className="text-accent-purple font-semibold">Blog/Content Writer ($400-1,200/mo)</span>
        </p>

        {/* Title Brainstorming Section */}
        <div className="mb-8 p-6 bg-accent-blue/5 rounded-xl border border-accent-blue/20">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-bold text-brand-text flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-accent-blue" />
                        Brainstorm SEO Blog Titles
                    </h3>
                    <p className="text-xs text-brand-text-muted mt-1">Get custom ideas based on your Business DNA and local area.</p>
                </div>
                <button
                    type="button"
                    onClick={handleSuggestTitles}
                    disabled={suggestingTitles}
                    className="bg-white border border-accent-blue text-accent-blue hover:bg-accent-blue hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                >
                    {suggestingTitles ? 'Thinking...' : 'Suggest Titles'}
                </button>
            </div>

            {suggestedTitles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {suggestedTitles.map((title, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setTopic(title)}
                            className={`text-left p-3 rounded-lg border text-sm transition-all flex justify-between items-center group ${
                                topic === title 
                                    ? 'bg-accent-blue border-accent-blue text-white' 
                                    : 'bg-white border-brand-border text-brand-text hover:border-accent-blue'
                            }`}
                        >
                            <span className="line-clamp-2">{title}</span>
                            {topic === title ? (
                                <CheckCircleIcon className="w-4 h-4 shrink-0" />
                            ) : (
                                <ArrowRightIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-brand-text-muted uppercase mb-2 ml-1">Business Category</label>
                    <div className="bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text font-semibold flex items-center">
                        {businessType}
                    </div>
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-brand-text-muted uppercase mb-2 ml-1">Target Location</label>
                    <div className="bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text font-semibold flex items-center">
                        {profileData.business.location || profileData.googleBusiness.address || 'Local Area'}
                    </div>
                </div>
            </div>
            
            <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-2 ml-1">Article Topic or Title</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Select a suggestion above or enter your own topic..."
                  className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition font-medium"
                />
            </div>
          </div>
          
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          
          <button
            type="submit"
            disabled={loading || !topic}
            className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:opacity-90 text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-lg"
          >
            {loading ? 'Writing SEO-Optimized Article...' : 'Generate Blog Post'}
          </button>
        </form>
      </div>
      
      {loading && (
          <div className="mt-8">
              <Loader />
              <p className="text-center text-brand-text-muted animate-pulse">Our AI is researching and drafting your local SEO article...</p>
          </div>
      )}
      
      {result && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <ResultDisplay markdownText={result} />
              
              <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => {
                        navigator.clipboard.writeText(result);
                        alert('Article copied to clipboard!');
                    }}
                    className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-700 transition-colors"
                  >
                      Copy Entire Article
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};