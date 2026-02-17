import React, { useState } from 'react';
import type { Tool, ProfileData, AdToAnalyze, AdPerformanceResult, AdPerformanceStatus } from '../types';
import { generateAdCopy, generateImage, analyzeAdPerformance } from '../services/geminiService';
import { HowToUse } from '../components/HowToUse';
import {
  InformationCircleIcon,
  SparklesIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '../components/icons/MiniIcons';
import { TOOLS } from '../constants';
import { AnalysisLoadingState } from '../components/AnalysisLoadingState';

interface JetAdsProps {
  tool: Tool;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null) => void;
}

interface Ad {
  headline: string;
  description: string;
  cta: string;
  visual_suggestion: string;
}

type Platform = 'Facebook' | 'Google Ads' | 'Instagram';
type JetAdsTab = 'generate' | 'analyze';

interface AdAnalyzeFormEntry {
  id: string;
  headline: string;
  description: string;
  cta: string;
  platform: Platform;
  ctr: string;
  conversionRate: string;
  cpc: string;
  impressions: string;
  clicks: string;
  budget: string;
}

const platformDetails: { [key in Platform]: { aspectRatio: '1:1' | '16:9' | '4:3'; postUrl: string } } = {
  Facebook: { aspectRatio: '1:1', postUrl: 'https://www.facebook.com/ads/manager/' },
  'Google Ads': { aspectRatio: '16:9', postUrl: 'https://ads.google.com/home/' },
  Instagram: { aspectRatio: '1:1', postUrl: 'https://www.instagram.com' },
};

const statusConfig: Record<AdPerformanceStatus, { label: string; bgCls: string; textCls: string; borderCls: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> }> = {
  good:     { label: 'Good',     bgCls: 'bg-green-500/10',  textCls: 'text-green-400',  borderCls: 'border-green-500/30',  Icon: CheckCircleIcon },
  warning:  { label: 'Warning',  bgCls: 'bg-yellow-500/10', textCls: 'text-yellow-400', borderCls: 'border-yellow-500/30', Icon: ExclamationTriangleIcon },
  critical: { label: 'Critical', bgCls: 'bg-red-500/10',    textCls: 'text-red-400',    borderCls: 'border-red-500/30',    Icon: ExclamationTriangleIcon },
};

// ── Sub-components ────────────────────────────────────────────────────────────

const AdResultCard: React.FC<{ result: AdPerformanceResult; index: number }> = ({ result, index }) => {
  const cfg = statusConfig[result.status] ?? statusConfig.warning;
  const StatusIcon = cfg.Icon;
  const ctrCfg = statusConfig[result.benchmarkComparison.ctrStatus] ?? statusConfig.warning;
  const convCfg = statusConfig[result.benchmarkComparison.conversionStatus] ?? statusConfig.warning;

  const scoreColor =
    result.performanceScore >= 70 ? 'text-green-400' :
    result.performanceScore >= 40 ? 'text-yellow-400' : 'text-red-400';

  const [copied, setCopied] = useState<'headline' | 'description' | null>(null);
  const handleCopy = (type: 'headline' | 'description', text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className={`bg-brand-card rounded-xl shadow-lg border ${cfg.borderCls} overflow-hidden`}>
      {/* Header */}
      <div className={`p-4 ${cfg.bgCls} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-2 min-w-0">
          <StatusIcon className={`w-5 h-5 flex-shrink-0 ${cfg.textCls}`} />
          <h3 className="font-bold text-brand-text truncate">Ad #{index + 1}: {result.headline}</h3>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.bgCls} ${cfg.textCls} border ${cfg.borderCls}`}>
            {cfg.label}
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-brand-text-muted">Score</p>
          <p className={`text-2xl font-black ${scoreColor}`}>
            {result.performanceScore}<span className="text-sm font-normal">/100</span>
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Benchmark comparison */}
        <div>
          <p className="text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-3">Benchmark Comparison</p>
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg border ${ctrCfg.borderCls} ${ctrCfg.bgCls}`}>
              <p className="text-xs text-brand-text-muted mb-1">Click-Through Rate</p>
              <p className={`text-lg font-bold ${ctrCfg.textCls}`}>{result.benchmarkComparison.yourCtr}</p>
              <p className="text-xs text-brand-text-muted">Benchmark: {result.benchmarkComparison.ctrBenchmark}</p>
            </div>
            <div className={`p-3 rounded-lg border ${convCfg.borderCls} ${convCfg.bgCls}`}>
              <p className="text-xs text-brand-text-muted mb-1">Conversion Rate</p>
              <p className={`text-lg font-bold ${convCfg.textCls}`}>{result.benchmarkComparison.yourConversion}</p>
              <p className="text-xs text-brand-text-muted">Benchmark: {result.benchmarkComparison.conversionBenchmark}</p>
            </div>
          </div>
        </div>

        {/* Issues */}
        {result.issues.length > 0 && (
          <div>
            <p className="text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-3">Issues Detected</p>
            <ul className="space-y-2">
              {result.issues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-brand-text">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        {result.suggestions.length > 0 && (
          <div>
            <p className="text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-3">What to Change</p>
            <ul className="space-y-2">
              {result.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-brand-text">
                  <SparklesIcon className="w-4 h-4 text-accent-purple flex-shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI-suggested new copy */}
        <div className="bg-brand-light p-4 rounded-lg border border-accent-purple/20">
          <p className="text-xs font-bold text-accent-purple uppercase tracking-widest mb-3">AI-Suggested New Copy</p>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-brand-text-muted">Headline</p>
                <p className="text-sm font-bold text-brand-text">{result.suggestedNewHeadline}</p>
              </div>
              <button
                onClick={() => handleCopy('headline', result.suggestedNewHeadline)}
                className="flex-shrink-0 text-xs text-accent-purple hover:text-accent-purple/70 font-semibold transition"
              >
                {copied === 'headline' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-brand-text-muted">Description</p>
                <p className="text-sm text-brand-text">{result.suggestedNewDescription}</p>
              </div>
              <button
                onClick={() => handleCopy('description', result.suggestedNewDescription)}
                className="flex-shrink-0 text-xs text-accent-purple hover:text-accent-purple/70 font-semibold transition"
              >
                {copied === 'description' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

export const JetAds: React.FC<JetAdsProps> = ({ tool, profileData, setActiveTool }) => {
  const businessType = profileData.business.industry;

  // ── Generate tab state ──
  const [product, setProduct] = useState('');
  const [platform, setPlatform] = useState<Platform>('Facebook');
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);
  const [generatedImages, setGeneratedImages] = useState<{ [index: number]: string }>({});
  const [imageLoading, setImageLoading] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState('');

  // ── Analyze tab state ──
  const [activeTab, setActiveTab] = useState<JetAdsTab>('generate');
  const [analyzeEntries, setAnalyzeEntries] = useState<AdAnalyzeFormEntry[]>([createEmptyEntry()]);
  const [analyzeResults, setAnalyzeResults] = useState<AdPerformanceResult[]>([]);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');

  function createEmptyEntry(): AdAnalyzeFormEntry {
    return {
      id: crypto.randomUUID(),
      headline: '', description: '', cta: '',
      platform: 'Facebook',
      ctr: '', conversionRate: '', cpc: '',
      impressions: '', clicks: '', budget: '',
    };
  }

  // ── Generate tab handlers ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) { setError('Please describe the product or offer.'); return; }
    setError('');
    setLoading(true);
    setAds([]);
    setGeneratedImages({});
    setCopySuccess('');
    try {
      const result = await generateAdCopy(product, platform);
      setAds(result.ads);
    } catch (err: any) {
      if (err.message?.includes('AI_KEY_MISSING')) {
        setError('AI features are disabled due to missing API key.');
      } else {
        setError('Failed to generate ad copy. Please try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async (index: number, prompt: string) => {
    setImageLoading(index);
    setError('');
    try {
      const aspectRatio = platformDetails[platform].aspectRatio;
      const base64Data = await generateImage(prompt, '1K', aspectRatio);
      setGeneratedImages(prev => ({ ...prev, [index]: `data:image/png;base64,${base64Data}` }));
    } catch (err: any) {
      console.error(err);
      setError(`Failed to generate image for Ad #${index + 1}. Please try again.`);
    } finally {
      setImageLoading(null);
    }
  };

  const handleCopyAndPost = (index: number, ad: Ad) => {
    const fullText = `Headline: ${ad.headline}\n\nDescription: ${ad.description}`;
    navigator.clipboard.writeText(fullText);
    setCopySuccess(`Ad #${index + 1} content copied!`);
    setTimeout(() => setCopySuccess(''), 2000);
    window.open(platformDetails[platform].postUrl, '_blank');
  };

  // ── Analyze tab handlers ──
  const handleAddEntry = () => setAnalyzeEntries(prev => [...prev, createEmptyEntry()]);

  const handleRemoveEntry = (id: string) =>
    setAnalyzeEntries(prev => prev.filter(e => e.id !== id));

  const handleEntryChange = (id: string, field: keyof AdAnalyzeFormEntry, value: string) =>
    setAnalyzeEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));

  const handleAnalyzeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzeError('');

    for (const entry of analyzeEntries) {
      if (!entry.headline.trim()) {
        setAnalyzeError('Each ad must have a headline.');
        return;
      }
      if (!entry.ctr || isNaN(parseFloat(entry.ctr))) {
        setAnalyzeError(`Please enter a valid CTR for "${entry.headline}".`);
        return;
      }
    }

    const adsToAnalyze: AdToAnalyze[] = analyzeEntries.map(e => ({
      id: e.id,
      headline: e.headline,
      description: e.description,
      cta: e.cta,
      metrics: {
        platform: e.platform,
        ctr: parseFloat(e.ctr) || 0,
        conversionRate: parseFloat(e.conversionRate) || 0,
        cpc: parseFloat(e.cpc) || 0,
        impressions: parseInt(e.impressions, 10) || 0,
        clicks: parseInt(e.clicks, 10) || 0,
        budget: parseFloat(e.budget) || 0,
      },
    }));

    setAnalyzeLoading(true);
    setAnalyzeResults([]);
    try {
      const results = await analyzeAdPerformance(adsToAnalyze, businessType || 'local business');
      setAnalyzeResults(results);
    } catch (err: any) {
      if (err.message?.includes('AI_KEY_MISSING')) {
        setAnalyzeError('AI features are disabled due to missing API key.');
      } else {
        setAnalyzeError('Analysis failed. Please check your inputs and try again.');
      }
      console.error(err);
    } finally {
      setAnalyzeLoading(false);
    }
  };

  // ── Business type guard ──
  if (!businessType) {
    return (
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg text-center">
        <InformationCircleIcon className="w-12 h-12 mx-auto text-accent-blue" />
        <h2 className="text-2xl font-bold text-brand-text mt-4">Set Your Business Category</h2>
        <p className="text-brand-text-muted my-4 max-w-md mx-auto">
          Please add a category to your business profile (e.g., "Coffee Shop") to use JetAds.
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

  const inputCls = 'w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition text-sm';
  const labelCls = 'block text-xs font-semibold text-brand-text-muted mb-1 uppercase tracking-wide';

  return (
    <div>
      {showHowTo && activeTab === 'generate' && (
        <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Describe the product, service, or offer you want to advertise.</li>
            <li>Select the ad platform (e.g., Facebook).</li>
            <li>Click "Generate Ad Copy" to get multiple ad variations.</li>
          </ul>
        </HowToUse>
      )}

      {/* Tab bar */}
      <div className="bg-brand-card p-2 rounded-xl shadow-lg mb-6">
        <div className="flex space-x-2">
          {(['generate', 'analyze'] as JetAdsTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition capitalize ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white shadow'
                  : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-light'
              }`}
            >
              {tab === 'generate' ? 'Generate' : 'Analyze Performance'}
            </button>
          ))}
        </div>
      </div>

      {/* ── GENERATE TAB ── */}
      {activeTab === 'generate' && (
        <div>
          <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
            <p className="text-brand-text-muted mb-6">{tool.description}</p>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <input
                  type="text"
                  value={product}
                  onChange={e => setProduct(e.target.value)}
                  placeholder="Product/Service/Offer"
                  className={inputCls}
                />
                <select
                  value={platform}
                  onChange={e => setPlatform(e.target.value as Platform)}
                  className={inputCls}
                >
                  <option>Facebook</option>
                  <option>Google Ads</option>
                  <option>Instagram</option>
                </select>
              </div>
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {loading ? 'Generating Ads...' : 'Generate Ad Copy'}
              </button>
            </form>
          </div>

          {loading && (
            <AnalysisLoadingState
              title="Generating High-Converting Ad Copy"
              message="Our AI is drafting multiple ad variations optimized for your selected platform. This can take up to 5 minutes."
              durationEstimateSeconds={300}
            />
          )}

          {ads.length > 0 && (
            <div className="mt-6 space-y-6">
              {copySuccess && (
                <div className="bg-green-100 text-green-800 text-sm font-semibold p-3 rounded-lg text-center shadow">
                  {copySuccess}
                </div>
              )}
              {ads.map((ad, index) => (
                <div key={index} className="bg-brand-card p-6 rounded-xl shadow-lg">
                  <div className="border-l-4 border-accent-purple pl-4">
                    <h3 className="text-lg font-bold text-brand-text">{ad.headline}</h3>
                    <p className="text-brand-text-muted my-2">{ad.description}</p>
                    <p className="text-accent-purple mt-2 font-semibold">{ad.cta}</p>
                  </div>
                  <div className="mt-4 bg-brand-light p-4 rounded-lg border border-brand-border">
                    <h4 className="text-sm font-semibold text-brand-text mb-2">Visual Suggestion</h4>
                    <p className="text-brand-text-muted text-sm italic mb-3">📷 {ad.visual_suggestion}</p>
                    {generatedImages[index] ? (
                      <img src={generatedImages[index]} alt={ad.visual_suggestion} className="rounded-md w-full h-auto mt-2" />
                    ) : (
                      <button
                        onClick={() => handleGenerateImage(index, ad.visual_suggestion)}
                        disabled={imageLoading === index}
                        className="w-full text-sm bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50 shadow hover:shadow-md"
                      >
                        {imageLoading === index ? 'Generating...' : `Generate Image for Ad #${index + 1}`}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleCopyAndPost(index, ad)}
                    className="mt-4 w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                  >
                    Copy & Post to {platform}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ANALYZE TAB ── */}
      {activeTab === 'analyze' && (
        <div>
          <div className="bg-accent-blue/5 border-l-4 border-accent-blue p-4 rounded-r-xl mb-6">
            <p className="text-sm font-semibold text-accent-blue mb-2">How to use Ad Performance Analysis</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-accent-blue/80">
              <li>Enter the copy and metrics from your existing ad campaigns.</li>
              <li>Add multiple ads to compare campaigns side by side.</li>
              <li>Find your metrics in Google Ads or Facebook Ads Manager.</li>
              <li>Click "Analyze Ads" to get scores, issue detection, and rewritten copy.</li>
            </ul>
          </div>

          <form onSubmit={handleAnalyzeSubmit} className="space-y-6">
            {analyzeEntries.map((entry, index) => (
              <div key={entry.id} className="bg-brand-card p-6 rounded-xl shadow-lg border border-brand-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-brand-text">Ad #{index + 1}</h3>
                  {analyzeEntries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEntry(entry.id)}
                      className="p-1.5 text-brand-text-muted hover:text-red-400 transition"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Ad copy */}
                <p className="text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-3">Ad Copy</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  <div>
                    <label className={labelCls}>Headline *</label>
                    <input
                      type="text"
                      value={entry.headline}
                      onChange={e => handleEntryChange(entry.id, 'headline', e.target.value)}
                      placeholder="Your ad headline"
                      className={inputCls}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <input
                      type="text"
                      value={entry.description}
                      onChange={e => handleEntryChange(entry.id, 'description', e.target.value)}
                      placeholder="Ad body text"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Call to Action</label>
                    <input
                      type="text"
                      value={entry.cta}
                      onChange={e => handleEntryChange(entry.id, 'cta', e.target.value)}
                      placeholder="e.g., Shop Now"
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Metrics */}
                <p className="text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-3">Performance Metrics</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className={labelCls}>Platform</label>
                    <select
                      value={entry.platform}
                      onChange={e => handleEntryChange(entry.id, 'platform', e.target.value)}
                      className={inputCls}
                    >
                      <option>Facebook</option>
                      <option>Google Ads</option>
                      <option>Instagram</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>CTR % *</label>
                    <input
                      type="number" step="0.01" min="0"
                      value={entry.ctr}
                      onChange={e => handleEntryChange(entry.id, 'ctr', e.target.value)}
                      placeholder="e.g., 1.4"
                      className={inputCls}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Conversion Rate %</label>
                    <input
                      type="number" step="0.01" min="0"
                      value={entry.conversionRate}
                      onChange={e => handleEntryChange(entry.id, 'conversionRate', e.target.value)}
                      placeholder="e.g., 2.1"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>CPC ($)</label>
                    <input
                      type="number" step="0.01" min="0"
                      value={entry.cpc}
                      onChange={e => handleEntryChange(entry.id, 'cpc', e.target.value)}
                      placeholder="e.g., 1.25"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Impressions</label>
                    <input
                      type="number" min="0"
                      value={entry.impressions}
                      onChange={e => handleEntryChange(entry.id, 'impressions', e.target.value)}
                      placeholder="e.g., 10000"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Clicks</label>
                    <input
                      type="number" min="0"
                      value={entry.clicks}
                      onChange={e => handleEntryChange(entry.id, 'clicks', e.target.value)}
                      placeholder="e.g., 140"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Budget Spent ($)</label>
                    <input
                      type="number" step="0.01" min="0"
                      value={entry.budget}
                      onChange={e => handleEntryChange(entry.id, 'budget', e.target.value)}
                      placeholder="e.g., 175.00"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddEntry}
              className="w-full py-3 border-2 border-dashed border-brand-border text-brand-text-muted hover:border-accent-purple hover:text-accent-purple rounded-xl font-semibold transition flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Another Ad
            </button>

            {analyzeError && <p className="text-red-500 text-sm">{analyzeError}</p>}

            <button
              type="submit"
              disabled={analyzeLoading}
              className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {analyzeLoading ? 'Analyzing...' : 'Analyze Ads'}
            </button>
          </form>

          {analyzeLoading && (
            <AnalysisLoadingState
              title="Analyzing Ad Performance"
              message="AI is comparing your metrics against industry benchmarks and generating improvement recommendations."
              durationEstimateSeconds={60}
            />
          )}

          {analyzeResults.length > 0 && !analyzeLoading && (
            <div className="mt-8 space-y-6">
              <h2 className="text-xl font-bold text-brand-text">Analysis Results</h2>
              {analyzeResults.map((result, index) => (
                <AdResultCard key={result.id} result={result} index={index} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
