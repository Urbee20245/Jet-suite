import React, { useState } from 'react';
import type { Tool, ProfileData, AdToAnalyze, AdPerformanceResult, AdPerformanceStatus, FacebookAdLibraryResult, FacebookAdLibraryInsights } from '../types';
import { generateAdCopy, generateImage, analyzeAdPerformance, analyzeFacebookAdLibrary } from '../services/geminiService';
import { HowToUse } from '../components/HowToUse';
import {
  InformationCircleIcon,
  SparklesIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  BoltIcon,
  PhotoIcon,
  ArrowRightIcon,
  CheckIcon,
  GlobeAltIcon,
  RocketLaunchIcon,
  TrendingUpIcon,
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
type JetAdsTab = 'generate' | 'analyze' | 'adlibrary';
type AdType = 'ALL' | 'POLITICAL_AND_ISSUE_ADS' | 'HOUSING_ADS' | 'EMPLOYMENT_ADS' | 'CREDIT_ADS';

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
  roas: string;       // Facebook-specific
  frequency: string;  // Facebook-specific
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

const SCORE_COLOR_MAP: Record<AdPerformanceStatus, string> = {
  good: '#4ade80',
  warning: '#facc15',
  critical: '#f87171',
};

const ScoreRing: React.FC<{ score: number; status: AdPerformanceStatus }> = ({ score, status }) => {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} strokeWidth="8" stroke="#E2E8F0" fill="none" />
        <circle
          cx="48" cy="48" r={r} strokeWidth="8" fill="none"
          stroke={SCORE_COLOR_MAP[status] ?? SCORE_COLOR_MAP.warning}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
      </svg>
      <div className="z-10 text-center">
        <p className="text-2xl font-black text-brand-text leading-none">{score}</p>
        <p className="text-[10px] text-brand-text-muted font-semibold">/100</p>
      </div>
    </div>
  );
};

const PLATFORM_SVGS: Record<Platform, React.ReactNode> = {
  Facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  'Google Ads': (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  ),
  Instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
};

const PlatformToggle: React.FC<{ value: Platform; onChange: (p: Platform) => void }> = ({ value, onChange }) => (
  <div className="grid grid-cols-3 gap-3">
    {(['Facebook', 'Google Ads', 'Instagram'] as Platform[]).map(p => (
      <button
        key={p}
        type="button"
        onClick={() => onChange(p)}
        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 font-semibold text-sm transition-all duration-200 ${
          value === p
            ? 'border-accent-purple bg-accent-purple/5 text-accent-purple shadow-sm'
            : 'border-brand-border bg-white text-brand-text-muted hover:border-accent-blue/40 hover:text-brand-text'
        }`}
      >
        <span className={value === p ? 'text-accent-purple' : 'text-brand-text-muted'}>
          {PLATFORM_SVGS[p]}
        </span>
        <span className="text-xs font-bold">{p}</span>
      </button>
    ))}
  </div>
);

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
    <div className={`bg-brand-card rounded-2xl shadow-lg border ${cfg.borderCls} overflow-hidden`}>
      {/* Header with score ring */}
      <div className={`${cfg.bgCls} flex items-center gap-5 p-5`}>
        <ScoreRing score={result.performanceScore} status={result.status} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.bgCls} ${cfg.textCls} ${cfg.borderCls}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {cfg.label}
            </span>
            <span className="text-xs text-brand-text-muted font-medium">Ad #{index + 1}</span>
          </div>
          <h3 className="font-black text-brand-text text-base leading-snug">{result.headline}</h3>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Benchmark comparison */}
        <div>
          <p className="text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-3">Benchmark Comparison</p>
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-4 rounded-xl border ${ctrCfg.borderCls} ${ctrCfg.bgCls}`}>
              <p className="text-[11px] text-brand-text-muted mb-1 font-medium uppercase tracking-wide">Click-Through Rate</p>
              <p className={`text-2xl font-black ${ctrCfg.textCls}`}>{result.benchmarkComparison.yourCtr}</p>
              <p className="text-xs text-brand-text-muted mt-0.5">Benchmark: <span className="font-semibold">{result.benchmarkComparison.ctrBenchmark}</span></p>
            </div>
            <div className={`p-4 rounded-xl border ${convCfg.borderCls} ${convCfg.bgCls}`}>
              <p className="text-[11px] text-brand-text-muted mb-1 font-medium uppercase tracking-wide">Conversion Rate</p>
              <p className={`text-2xl font-black ${convCfg.textCls}`}>{result.benchmarkComparison.yourConversion}</p>
              <p className="text-xs text-brand-text-muted mt-0.5">Benchmark: <span className="font-semibold">{result.benchmarkComparison.conversionBenchmark}</span></p>
            </div>
          </div>
        </div>

        {/* Issues */}
        {result.issues.length > 0 && (
          <div>
            <p className="text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-3">Issues Detected</p>
            <ul className="space-y-2">
              {result.issues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2.5 bg-red-500/5 border border-red-500/15 rounded-xl px-3 py-2.5 text-sm text-brand-text">
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
            <p className="text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-3">Recommendations</p>
            <ul className="space-y-2">
              {result.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 bg-accent-purple/5 border border-accent-purple/15 rounded-xl px-3 py-2.5 text-sm text-brand-text">
                  <SparklesIcon className="w-4 h-4 text-accent-purple flex-shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI-suggested new copy */}
        <div className="rounded-xl overflow-hidden border border-accent-purple/20">
          <div className="bg-gradient-to-r from-accent-purple to-accent-blue px-4 py-2.5 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-white/90 flex-shrink-0" />
            <p className="text-xs font-bold text-white uppercase tracking-widest">AI-Rewritten Copy</p>
          </div>
          <div className="bg-brand-light/50 p-4 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] text-brand-text-muted uppercase tracking-wide font-semibold mb-1">Headline</p>
                <p className="text-sm font-bold text-brand-text leading-snug">{result.suggestedNewHeadline}</p>
              </div>
              <button
                onClick={() => handleCopy('headline', result.suggestedNewHeadline)}
                className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${copied === 'headline' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-white border-brand-border text-accent-purple hover:border-accent-purple/40'}`}
              >
                {copied === 'headline' ? <><CheckIcon className="w-3 h-3" /> Copied</> : 'Copy'}
              </button>
            </div>
            <div className="h-px bg-brand-border" />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] text-brand-text-muted uppercase tracking-wide font-semibold mb-1">Description</p>
                <p className="text-sm text-brand-text leading-relaxed">{result.suggestedNewDescription}</p>
              </div>
              <button
                onClick={() => handleCopy('description', result.suggestedNewDescription)}
                className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${copied === 'description' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-white border-brand-border text-accent-purple hover:border-accent-purple/40'}`}
              >
                {copied === 'description' ? <><CheckIcon className="w-3 h-3" /> Copied</> : 'Copy'}
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

  // ── Ad Library tab state ──
  const [libraryKeyword, setLibraryKeyword] = useState('');
  const [libraryCountry, setLibraryCountry] = useState('US');
  const [libraryAdType, setLibraryAdType] = useState<AdType>('ALL');
  const [libraryResults, setLibraryResults] = useState<FacebookAdLibraryResult[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState('');
  const [libraryInsights, setLibraryInsights] = useState<FacebookAdLibraryInsights | null>(null);
  const [libraryInsightsLoading, setLibraryInsightsLoading] = useState(false);
  const [libraryInsightsError, setLibraryInsightsError] = useState('');

  function createEmptyEntry(): AdAnalyzeFormEntry {
    return {
      id: crypto.randomUUID(),
      headline: '', description: '', cta: '',
      platform: 'Facebook',
      ctr: '', conversionRate: '', cpc: '',
      impressions: '', clicks: '', budget: '',
      roas: '', frequency: '',
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

  // ── Ad Library handlers ──
  const handleLibrarySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!libraryKeyword.trim()) {
      setLibraryError('Please enter a keyword to search the Ad Library.');
      return;
    }
    setLibraryError('');
    setLibraryResults([]);
    setLibraryInsights(null);
    setLibraryInsightsError('');
    setLibraryLoading(true);
    try {
      const params = new URLSearchParams({
        search_terms: libraryKeyword.trim(),
        ad_reached_countries: libraryCountry,
        ad_type: libraryAdType,
      });
      const response = await fetch(`/api/facebook/ad-library?${params.toString()}`);
      const data = await response.json();
      if (!response.ok || data.error) {
        setLibraryError(data.error ?? 'Failed to fetch ads. Please try again.');
      } else {
        setLibraryResults(data.ads ?? []);
        if ((data.ads ?? []).length === 0) {
          setLibraryError('No ads found for that search. Try different keywords or a broader ad type.');
        }
      }
    } catch {
      setLibraryError('Network error. Please check your connection and try again.');
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleAnalyzeLibrary = async () => {
    if (libraryResults.length === 0) return;
    setLibraryInsightsError('');
    setLibraryInsights(null);
    setLibraryInsightsLoading(true);
    try {
      const insights = await analyzeFacebookAdLibrary(libraryResults, businessType || 'local business');
      setLibraryInsights(insights);
    } catch (err: any) {
      if (err.message?.includes('AI_KEY_MISSING')) {
        setLibraryInsightsError('AI features are disabled due to missing API key.');
      } else {
        setLibraryInsightsError('Analysis failed. Please try again.');
      }
    } finally {
      setLibraryInsightsLoading(false);
    }
  };

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
        ...(e.platform === 'Facebook' && e.roas ? { roas: parseFloat(e.roas) } : {}),
        ...(e.platform === 'Facebook' && e.frequency ? { frequency: parseFloat(e.frequency) } : {}),
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
      <div className="bg-brand-card p-8 sm:p-12 rounded-2xl shadow-lg text-center border border-brand-border">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent-blue/10 to-accent-purple/10 flex items-center justify-center mb-4 border border-accent-purple/10">
          <InformationCircleIcon className="w-8 h-8 text-accent-purple" />
        </div>
        <h2 className="text-2xl font-black text-brand-text mb-2">Set Your Business Category</h2>
        <p className="text-brand-text-muted mb-6 max-w-md mx-auto leading-relaxed">
          Please add a category to your business profile (e.g., "Coffee Shop") so JetAds can tailor ad copy and benchmarks for your industry.
        </p>
        <button
          onClick={() => setActiveTool(TOOLS.find(t => t.id === 'businessdetails')!)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-accent-purple/20"
        >
          Go to Business Details
          <ArrowRightIcon className="w-4 h-4" />
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

      {/* Tab bar — segmented control */}
      <div className="flex bg-brand-light p-1.5 rounded-2xl gap-1 mb-6" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)' }}>
        {([
          { id: 'generate', label: 'Generate', Icon: SparklesIcon },
          { id: 'analyze', label: 'Analyze Performance', Icon: ChartBarIcon },
          { id: 'adlibrary', label: 'FB Ad Library', Icon: GlobeAltIcon },
        ] as { id: JetAdsTab; label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> }[]).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
              activeTab === id
                ? 'bg-white shadow-md text-brand-text'
                : 'text-brand-text-muted hover:text-brand-text'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{id === 'generate' ? 'Generate' : id === 'analyze' ? 'Analyze' : 'Library'}</span>
          </button>
        ))}
      </div>

      {/* ── GENERATE TAB ── */}
      {activeTab === 'generate' && (
        <div>
          <div className="bg-brand-card rounded-2xl shadow-lg overflow-hidden">
            {/* Card header */}
            <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-sm flex-shrink-0">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-black text-brand-text text-base">Create Your Ad</h2>
                <p className="text-xs text-brand-text-muted">AI generates 3 high-converting variations</p>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className={labelCls}>What are you promoting?</label>
                  <input
                    type="text"
                    value={product}
                    onChange={e => setProduct(e.target.value)}
                    placeholder="e.g., 20% off coffee this weekend, new HVAC installation service..."
                    className={`${inputCls} py-3.5 text-base`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Select Platform</label>
                  <PlatformToggle value={platform} onChange={setPlatform} />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:shadow-accent-purple/20"
                >
                  <BoltIcon className="w-4 h-4" />
                  {loading ? 'Generating Ads...' : 'Generate Ad Copy'}
                </button>
              </form>
            </div>
          </div>

          {loading && (
            <AnalysisLoadingState
              title="Generating High-Converting Ad Copy"
              message="Our AI is drafting multiple ad variations optimized for your selected platform. This can take up to 5 minutes."
              durationEstimateSeconds={300}
            />
          )}

          {ads.length > 0 && (
            <div className="mt-6 space-y-5">
              {copySuccess && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-600 text-sm font-semibold p-3 rounded-xl">
                  <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                  {copySuccess}
                </div>
              )}
              {ads.map((ad, index) => (
                <div key={index} className="bg-brand-card rounded-2xl shadow-lg overflow-hidden border border-brand-border">
                  {/* Ad card header */}
                  <div className="bg-gradient-to-r from-accent-blue/6 to-accent-purple/6 border-b border-brand-border px-6 py-3 flex items-center gap-3">
                    <span className="bg-gradient-to-r from-accent-blue to-accent-purple text-white text-xs font-black px-3 py-1 rounded-full tracking-wide">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-bold text-brand-text-muted uppercase tracking-widest">Ad Variation</span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-black text-brand-text mb-2 leading-snug">{ad.headline}</h3>
                    <p className="text-brand-text-muted leading-relaxed mb-4">{ad.description}</p>
                    <span className="inline-flex items-center gap-1.5 bg-accent-purple/10 text-accent-purple text-sm font-bold px-4 py-1.5 rounded-full border border-accent-purple/20">
                      {ad.cta}
                    </span>

                    {/* Visual suggestion */}
                    <div className="mt-5 bg-brand-light/60 rounded-xl border border-dashed border-brand-border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <PhotoIcon className="w-4 h-4 text-brand-text-muted" />
                        <h4 className="text-xs font-bold text-brand-text-muted uppercase tracking-widest">Visual Suggestion</h4>
                      </div>
                      <p className="text-brand-text-muted text-sm italic mb-3">{ad.visual_suggestion}</p>
                      {generatedImages[index] ? (
                        <img src={generatedImages[index]} alt={ad.visual_suggestion} className="rounded-xl w-full h-auto" />
                      ) : (
                        <button
                          onClick={() => handleGenerateImage(index, ad.visual_suggestion)}
                          disabled={imageLoading === index}
                          className="w-full flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-accent-purple to-accent-blue text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 shadow hover:shadow-md"
                        >
                          <PhotoIcon className="w-4 h-4" />
                          {imageLoading === index ? 'Generating...' : `Generate Image`}
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleCopyAndPost(index, ad)}
                      className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-accent-purple/20"
                    >
                      Open in {platform} Ads Manager
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ANALYZE TAB ── */}
      {activeTab === 'analyze' && (
        <div>
          {/* 3-step guide */}
          <div className="bg-brand-card rounded-2xl border border-brand-border shadow-sm p-5 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {[
                { n: '01', title: 'Enter ad copy', desc: 'Paste your headline, description & CTA from any campaign', Icon: SparklesIcon },
                { n: '02', title: 'Add metrics', desc: 'CTR, CPC & conversions from your Ads Manager', Icon: ChartBarIcon },
                { n: '03', title: 'Get AI analysis', desc: 'Performance score, issue detection & rewritten copy', Icon: RocketLaunchIcon },
              ].map(step => (
                <div key={step.n} className="flex items-start gap-3 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple text-white text-xs font-black flex items-center justify-center flex-shrink-0 shadow-sm">
                    {step.n}
                  </div>
                  <div>
                    <p className="font-bold text-brand-text text-sm">{step.title}</p>
                    <p className="text-xs text-brand-text-muted mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleAnalyzeSubmit} className="space-y-5">
            {analyzeEntries.map((entry, index) => (
              <div key={entry.id} className="bg-brand-card rounded-2xl shadow-lg border border-brand-border overflow-hidden">
                {/* Card header */}
                <div className="bg-gradient-to-r from-brand-light to-white border-b border-brand-border px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-gradient-to-r from-accent-blue to-accent-purple text-white text-[11px] font-black px-2.5 py-1 rounded-full tracking-wide">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-bold text-brand-text text-sm">Ad #{index + 1}</span>
                    {entry.platform && (
                      <span className="text-xs bg-brand-light border border-brand-border text-brand-text-muted px-2 py-0.5 rounded-full font-medium">{entry.platform}</span>
                    )}
                  </div>
                  {analyzeEntries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEntry(entry.id)}
                      className="p-1.5 text-brand-text-muted hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="p-6 space-y-5">
                  {/* Ad copy */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-4 bg-accent-purple rounded-full" />
                      <p className="text-xs font-bold text-brand-text-muted uppercase tracking-widest">Ad Copy</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  </div>

                  {/* Metrics */}
                  <div className="bg-brand-light/50 rounded-xl p-4 border border-brand-border/60">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-4 bg-accent-blue rounded-full" />
                      <p className="text-xs font-bold text-brand-text-muted uppercase tracking-widest">Performance Metrics</p>
                    </div>
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
                    {entry.platform === 'Facebook' && (
                      <div className="mt-4 bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-3">
                        <p className="text-[11px] font-bold text-accent-blue uppercase tracking-widest mb-3">Facebook-Specific Metrics</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelCls}>ROAS</label>
                            <input
                              type="number" step="0.1" min="0"
                              value={entry.roas}
                              onChange={e => handleEntryChange(entry.id, 'roas', e.target.value)}
                              placeholder="e.g., 3.2"
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Frequency</label>
                            <input
                              type="number" step="0.1" min="0"
                              value={entry.frequency}
                              onChange={e => handleEntryChange(entry.id, 'frequency', e.target.value)}
                              placeholder="e.g., 2.4"
                              className={inputCls}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddEntry}
              className="w-full py-3 border-2 border-dashed border-brand-border text-brand-text-muted hover:border-accent-purple hover:text-accent-purple hover:bg-accent-purple/3 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Another Ad to Compare
            </button>

            {analyzeError && (
              <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 text-red-500 text-sm font-medium p-3 rounded-xl">
                <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                {analyzeError}
              </div>
            )}

            <button
              type="submit"
              disabled={analyzeLoading}
              className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:shadow-accent-purple/20"
            >
              <ChartBarIcon className="w-4 h-4" />
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
            <div className="mt-8 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-sm flex-shrink-0">
                  <ChartBarIcon className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-black text-brand-text">Analysis Results</h2>
              </div>
              {analyzeResults.map((result, index) => (
                <AdResultCard key={result.id} result={result} index={index} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── AD LIBRARY TAB ── */}
      {activeTab === 'adlibrary' && (
        <div>
          {/* Feature highlight card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-accent-blue/5 via-white to-accent-purple/5 border border-brand-border rounded-2xl p-6 mb-6">
            <div className="absolute top-0 right-0 w-52 h-52 bg-gradient-to-bl from-accent-purple/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-sm flex-shrink-0">
                  <GlobeAltIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-black text-brand-text text-base">Facebook Ad Library</h2>
                  <p className="text-xs text-brand-text-muted">Real competitor ads · AI pattern analysis · Tailored recommendations</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { Icon: GlobeAltIcon, title: 'Live Ad Data', desc: "Meta's public library" },
                  { Icon: TrendingUpIcon, title: 'Competitor Ads', desc: 'Real campaigns running now' },
                  { Icon: SparklesIcon, title: 'AI Analysis', desc: 'Patterns & angles extracted' },
                  { Icon: RocketLaunchIcon, title: 'Recommendations', desc: 'Tailored to your business' },
                ].map(f => (
                  <div key={f.title} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white border border-brand-border flex items-center justify-center flex-shrink-0 shadow-sm">
                      <f.Icon className="w-3.5 h-3.5 text-accent-purple" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-text">{f.title}</p>
                      <p className="text-[11px] text-brand-text-muted">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-start gap-2 bg-white/60 border border-brand-border rounded-xl px-4 py-3">
                <InformationCircleIcon className="w-4 h-4 text-accent-blue flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-brand-text-muted leading-relaxed">
                  <span className="font-semibold text-brand-text">Pro tip:</span> Meta's Ad Library shows all ad categories for US searches. For the widest selection of competitor ads, try switching the country to a European option (e.g., Germany or France) — EU regulations require Meta to make all ad types publicly available there.
                </p>
              </div>
            </div>
          </div>

          {/* Search form */}
          <div className="bg-brand-card rounded-2xl shadow-lg mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-3">
              <svg className="w-4 h-4 text-brand-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <div>
                <p className="font-bold text-brand-text text-sm">Search Ad Library</p>
                <p className="text-xs text-brand-text-muted">Find what competitors in your space are running</p>
              </div>
            </div>
            <form onSubmit={handleLibrarySearch} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Keyword / Competitor / Industry</label>
                <input
                  type="text"
                  value={libraryKeyword}
                  onChange={e => setLibraryKeyword(e.target.value)}
                  placeholder="e.g., coffee shop, HVAC installation, dentist offers..."
                  className={`${inputCls} py-3.5 text-base`}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Country</label>
                  <select value={libraryCountry} onChange={e => setLibraryCountry(e.target.value)} className={inputCls}>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="IE">Ireland</option>
                    <option value="NZ">New Zealand</option>
                    <option disabled>── EU (broader results) ──</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="ES">Spain</option>
                    <option value="IT">Italy</option>
                    <option value="NL">Netherlands</option>
                    <option value="SE">Sweden</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Ad Type</label>
                  <select value={libraryAdType} onChange={e => setLibraryAdType(e.target.value as AdType)} className={inputCls}>
                    <option value="ALL">All Ads</option>
                    <option value="POLITICAL_AND_ISSUE_ADS">Political &amp; Issue</option>
                    <option value="HOUSING_ADS">Housing</option>
                    <option value="EMPLOYMENT_ADS">Employment</option>
                    <option value="CREDIT_ADS">Credit</option>
                  </select>
                </div>
              </div>
              {libraryError && (
                <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 text-red-500 text-sm font-medium p-3 rounded-xl">
                  <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                  {libraryError}
                </div>
              )}
              <button
                type="submit"
                disabled={libraryLoading}
                className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:shadow-accent-purple/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                {libraryLoading ? 'Searching Ad Library...' : 'Search Facebook Ad Library'}
              </button>
            </form>
          </div>

          {libraryLoading && (
            <AnalysisLoadingState
              title="Searching Facebook Ad Library"
              message="Fetching live ads from Meta's Ad Library. This usually takes just a few seconds."
              durationEstimateSeconds={10}
            />
          )}

          {/* Results */}
          {libraryResults.length > 0 && !libraryLoading && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-sm flex-shrink-0">
                    <TrendingUpIcon className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-xl font-black text-brand-text">
                    {libraryResults.length} Ad{libraryResults.length !== 1 ? 's' : ''} Found
                  </h2>
                </div>
                <button
                  onClick={handleAnalyzeLibrary}
                  disabled={libraryInsightsLoading}
                  className="flex items-center gap-2 bg-gradient-to-r from-accent-purple to-accent-blue text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all disabled:opacity-50 shadow-md hover:shadow-lg hover:shadow-accent-purple/20"
                >
                  <SparklesIcon className="w-4 h-4" />
                  {libraryInsightsLoading ? 'Analyzing...' : 'Analyze with AI'}
                </button>
              </div>

              {libraryInsightsError && (
                <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 text-red-500 text-sm font-medium p-3 rounded-xl mb-4">
                  <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                  {libraryInsightsError}
                </div>
              )}

              {/* AI Insights Loading */}
              {libraryInsightsLoading && (
                <AnalysisLoadingState
                  title="Extracting Competitive Insights"
                  message="AI is analyzing ad patterns, hooks, and CTAs to generate tailored recommendations for your business."
                  durationEstimateSeconds={30}
                />
              )}

              {/* AI Insights Panel */}
              {libraryInsights && !libraryInsightsLoading && (
                <div className="rounded-2xl overflow-hidden border border-accent-purple/20 shadow-lg mb-8">
                  {/* Panel header */}
                  <div className="bg-gradient-to-r from-accent-purple to-accent-blue p-5 flex items-start gap-3">
                    <SparklesIcon className="w-5 h-5 text-white/90 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">AI Competitive Intelligence</p>
                      <p className="text-sm text-white leading-relaxed">{libraryInsights.summary}</p>
                    </div>
                  </div>
                  {/* Panel body */}
                  <div className="bg-gradient-to-br from-accent-purple/5 to-accent-blue/5 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-accent-purple/15 text-accent-purple text-[11px] font-bold px-2.5 py-1 rounded-full">Patterns</span>
                      </div>
                      <ul className="space-y-2">
                        {libraryInsights.topPatterns.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-brand-text">
                            <SparklesIcon className="w-3.5 h-3.5 text-accent-purple flex-shrink-0 mt-0.5" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-green-500/10 text-green-600 text-[11px] font-bold px-2.5 py-1 rounded-full">Winning Angles</span>
                      </div>
                      <ul className="space-y-2">
                        {libraryInsights.winningAngles.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-brand-text">
                            <CheckCircleIcon className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-accent-blue/10 text-accent-blue text-[11px] font-bold px-2.5 py-1 rounded-full">Top CTAs</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {libraryInsights.topCTAs.map((cta, i) => (
                          <span key={i} className="bg-gradient-to-r from-accent-blue to-accent-cyan text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                            {cta}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-yellow-500/10 text-yellow-600 text-[11px] font-bold px-2.5 py-1 rounded-full">For Your Business</span>
                      </div>
                      <ul className="space-y-2">
                        {libraryInsights.recommendedApproaches.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-brand-text">
                            <RocketLaunchIcon className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Ad cards — sponsored post preview style */}
              <div className="space-y-4">
                {libraryResults.map((ad, index) => {
                  const body = ad.ad_creative_bodies?.[0] ?? '';
                  const title = ad.ad_creative_link_titles?.[0] ?? '';
                  const description = ad.ad_creative_link_descriptions?.[0] ?? '';
                  const impressionText = ad.impressions
                    ? `${parseInt(ad.impressions.lower_bound, 10).toLocaleString()}–${parseInt(ad.impressions.upper_bound, 10).toLocaleString()} impressions`
                    : null;
                  const spendText = ad.spend
                    ? `${ad.spend.currency} ${parseInt(ad.spend.lower_bound, 10).toLocaleString()}–${parseInt(ad.spend.upper_bound, 10).toLocaleString()} spent`
                    : null;

                  return (
                    <div key={ad.id ?? index} className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
                      {/* Top strip — advertiser + platforms */}
                      <div className="bg-brand-light border-b border-brand-border px-4 py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-brand-text text-sm truncate">{ad.page_name}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {(ad.publisher_platforms ?? []).map((p) => (
                            <span key={p} className="text-xs bg-white border border-brand-border px-2 py-0.5 rounded-full text-brand-text-muted capitalize font-medium shadow-sm">
                              {p}
                            </span>
                          ))}
                          <span className="text-[10px] border border-brand-border text-brand-text-muted font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white">
                            Sponsored
                          </span>
                        </div>
                      </div>

                      {/* Ad content */}
                      {(body || title) && (
                        <div className="p-5">
                          {title && <p className="font-bold text-brand-text text-base leading-snug mb-1">{title}</p>}
                          {body && <p className="text-brand-text text-sm leading-relaxed mt-1">{body}</p>}
                          {description && <p className="text-brand-text-muted text-xs mt-2 italic">{description}</p>}
                        </div>
                      )}

                      {/* Footer — stats + link */}
                      <div className="bg-brand-light/60 border-t border-brand-border px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-3">
                          {impressionText && (
                            <span className="inline-flex items-center gap-1 text-xs bg-white border border-brand-border text-brand-text-muted px-2 py-1 rounded-lg font-medium">
                              <TrendingUpIcon className="w-3 h-3" />
                              {impressionText}
                            </span>
                          )}
                          {spendText && (
                            <span className="inline-flex items-center gap-1 text-xs bg-white border border-brand-border text-brand-text-muted px-2 py-1 rounded-lg font-medium">
                              {spendText}
                            </span>
                          )}
                        </div>
                        {ad.ad_snapshot_url && (
                          <a
                            href={ad.ad_snapshot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-accent-purple font-bold hover:text-accent-purple/70 transition"
                          >
                            View Full Ad
                            <ArrowRightIcon className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
