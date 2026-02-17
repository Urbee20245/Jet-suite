import React, { useState } from 'react';
import type { Tool, ProfileData, KeywordData } from '../types';
import { HowToUse } from '../components/HowToUse';
import { InformationCircleIcon, SparklesIcon, BoltIcon, ArrowRightIcon } from '../components/icons/MiniIcons';
import { TOOLS } from '../constants';
import { ContentTypeSelector } from './jetcontent/ContentTypeSelector';
import { BlogPostCreator } from './jetcontent/BlogPostCreator';
import { ArticleCreator } from './jetcontent/ArticleCreator';
import { PressReleaseCreator } from './jetcontent/PressReleaseCreator';
import { generateArticleContent, generatePressRelease } from '../services/geminiService';
import { ResultDisplay } from '../components/ResultDisplay';
import { AnalysisLoadingState } from '../components/AnalysisLoadingState';

interface JetContentProps {
  tool: Tool;
  initialProps: { keyword: KeywordData; type: string } | null;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null) => void;
}

export const JetContent: React.FC<JetContentProps> = ({ tool, initialProps, profileData, setActiveTool }) => {
  const [selectedType, setSelectedType] = useState<'blog_post' | 'article' | 'press_release' | null>(null);
  const [showHowTo, setShowHowTo] = useState(true);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const businessType = profileData.business.industry || '';

  // Check if business category is set
  if (!businessType) {
    return (
      <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden text-center">
        <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center shrink-0">
            <InformationCircleIcon className="w-5 h-5 text-accent-blue" />
          </div>
          <h2 className="text-base font-bold text-brand-text tracking-tight">Set Your Business Category</h2>
        </div>
        <div className="p-8 sm:p-10">
          <p className="text-sm text-brand-text-muted my-4 max-w-sm mx-auto leading-relaxed">
            Please add a category to your business profile (e.g., "Coffee Shop") to generate relevant content.
          </p>
          <button
            onClick={() => setActiveTool(TOOLS.find(t => t.id === 'businessdetails')!)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-2.5 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-accent-purple/20 active:scale-[0.99] text-sm"
          >
            <ArrowRightIcon className="w-4 h-4" />
            Go to Business Details
          </button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    setSelectedType(null);
    setResult('');
    setError('');
  };

  const handleArticleGenerate = async (formData: any) => {
    try {
      setLoading(true);
      setError('');
      setResult('');

      const content = await generateArticleContent(profileData, formData);
      setResult(content);
    } catch (err: any) {
      console.error('Error generating article:', err);
      setError(err.message || 'Failed to generate article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePressReleaseGenerate = async (formData: any) => {
    try {
      setLoading(true);
      setError('');
      setResult('');

      const content = await generatePressRelease(profileData, formData);
      setResult(content);
    } catch (err: any) {
      console.error('Error generating press release:', err);
      setError(err.message || 'Failed to generate press release. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (contentType: string, formData: any) => {
    // TODO: Implement draft saving to Supabase
    console.log('Saving draft:', contentType, formData);
    alert('Draft saving coming soon!');
  };

  // Show content type selector first
  if (!selectedType) {
    return (
      <div className="max-w-7xl mx-auto">
        {showHowTo && (
          <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Choose between <strong>Blog Posts</strong> for SEO content, <strong>Articles</strong> for thought leadership, or <strong>Press Releases</strong> for announcements.</li>
              <li>Each content type is optimized for specific business goals and audiences.</li>
              <li>Your business details and brand profile are automatically applied to all content.</li>
            </ul>
          </HowToUse>
        )}

        <ContentTypeSelector onSelect={setSelectedType} />
      </div>
    );
  }

  // Show appropriate creator based on selection
  return (
    <div className="max-w-7xl mx-auto">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors duration-200 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to content types
        </button>
      </div>

      {/* Render appropriate creator */}
      {selectedType === 'blog_post' && (
        <BlogPostCreator
          profileData={profileData}
          initialKeyword={initialProps?.keyword}
        />
      )}

      {selectedType === 'article' && !result && (
        <ArticleCreator
          profileData={profileData}
          onGenerate={handleArticleGenerate}
          onSaveDraft={(data) => handleSaveDraft('article', data)}
        />
      )}

      {selectedType === 'press_release' && !result && (
        <PressReleaseCreator
          profileData={profileData}
          onGenerate={handlePressReleaseGenerate}
          onSaveDraft={(data) => handleSaveDraft('press_release', data)}
        />
      )}

      {/* Loading state for Articles and Press Releases */}
      {loading && (selectedType === 'article' || selectedType === 'press_release') && (
        <AnalysisLoadingState
          title={selectedType === 'article' ? 'Generating In-Depth Article' : 'Generating Press Release'}
          message={
            selectedType === 'article'
              ? 'Our AI is researching industry trends and crafting your authoritative article. This can take up to 5 minutes.'
              : 'Our AI is formatting your announcement in AP Style. This should take about 2 minutes.'
          }
          durationEstimateSeconds={selectedType === 'article' ? 300 : 120}
        />
      )}

      {/* Result display for Articles and Press Releases */}
      {result && (selectedType === 'article' || selectedType === 'press_release') && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center shrink-0">
                <SparklesIcon className="w-4.5 h-4.5 text-accent-purple" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-brand-text">
                  {selectedType === 'article' ? 'Your Article is Ready' : 'Your Press Release is Ready'}
                </h3>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  {selectedType === 'article'
                    ? 'Review your thought leadership content below'
                    : 'Review your AP Style formatted press release below'}
                </p>
              </div>
              <button
                onClick={() => {
                  setResult('');
                  setError('');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold rounded-xl text-sm hover:shadow-lg hover:shadow-accent-purple/20 active:scale-[0.99] transition-all duration-200"
              >
                <BoltIcon className="w-4 h-4" />
                Create Another
              </button>
            </div>
          </div>

          <ResultDisplay markdownText={result} />

          {error && (
            <div className="mt-5 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm font-medium border border-red-200/60 flex items-start gap-2.5">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              <span>{error}</span>
            </div>
          )}

          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => {
                navigator.clipboard.writeText(result);
                alert('Content copied to clipboard!');
              }}
              className="bg-brand-text text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-brand-text/90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              Copy to Clipboard
            </button>
            {/* TODO: Add scheduling/publishing options for articles and press releases */}
          </div>
        </div>
      )}
    </div>
  );
};
