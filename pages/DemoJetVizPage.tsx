import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, EyeIcon, LayoutIcon, SmartphoneIcon, PaletteIcon } from '../components/icons/MiniIcons';
import { AnalyzerService } from '../services/analyzerService';
import type { AnalysisResult } from '../types';

interface DemoJetVizPageProps {
  navigate: (path: string) => void;
}

export const DemoJetVizPage: React.FC<DemoJetVizPageProps> = ({ navigate }) => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setIsAnalyzing(true);
    setResult(null);
    
    try {
      const [data] = await Promise.all([
        AnalyzerService.analyzeWebsite({
          websiteUrl: url,
          industry: 'general'
        }),
        new Promise(resolve => setTimeout(resolve, 10000))
      ]);
      setResult(data);
    } catch (err) {
      console.error("Analysis failed", err);
      alert("Analysis failed. Please check the URL and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setUrl('');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6">
        <div className="w-full text-center py-12 px-4">
          <div className="w-[60px] h-[60px] border-4 border-slate-700 border-t-blue-600 rounded-full mx-auto mb-8 animate-spin"></div>
          <h3 className="text-white mb-4 text-xl font-bold">Analyzing Your Website...</h3>
          <p className="text-slate-300 mb-8">Scanning performance, SEO, and design elements</p>
          <div className="w-full max-w-[300px] h-1 bg-slate-700 rounded-sm mx-auto">
            <div className="h-full bg-blue-600 rounded-sm animate-[fill_10s_linear_forwards]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    const aesthetic = Math.round((100 - (result.coreWebVitals.cls * 100)) * 0.6 + result.mobileScore.score * 0.4);
    const structure = result.seoStructure.score;
    const mobile = result.mobileScore.score;
    const credibility = result.localRelevance.score;
    const overall = Math.round((aesthetic + structure + mobile + credibility) / 4);

    return (
      <div className="min-h-screen bg-brand-dark py-20 audit-result">
        <div className="max-w-7xl mx-auto px-6">
          <button 
            onClick={resetAnalysis}
            className="flex items-center gap-2 text-gray-400 hover:text-accent-purple transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Analyzer
          </button>

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-full font-semibold text-sm mb-4">
              <EyeIcon className="w-4 h-4" />
              Analysis Complete
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 score-number">
              Visual Analysis for <span className="text-accent-purple">{new URL(result.websiteUrl).hostname}</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto score-label">
              Here's how your website looks to visitors. Unlock detailed recommendations with JetSuite.
            </p>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
            <div className="bg-brand-card border border-slate-700 rounded-xl p-6 score-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm font-semibold score-label">Overall</span>
                <EyeIcon className="w-5 h-5 text-accent-cyan" />
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(overall)} mb-2 score-number`}>{overall}</div>
              <div className="text-xs text-gray-500 metric-target">Design Score</div>
            </div>

            <div className="bg-brand-card border border-slate-700 rounded-xl p-6 score-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm font-semibold score-label">Aesthetic</span>
                <PaletteIcon className="w-5 h-5 text-accent-purple" />
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(aesthetic)} mb-2 score-number`}>{aesthetic}</div>
              <div className="text-xs text-gray-500 metric-target">Visual Appeal</div>
            </div>

            <div className="bg-brand-card border border-slate-700 rounded-xl p-6 score-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm font-semibold score-label">Structure</span>
                <LayoutIcon className="w-5 h-5 text-accent-pink" />
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(structure)} mb-2 score-number`}>{structure}</div>
              <div className="text-xs text-gray-500 metric-target">SEO Structure</div>
            </div>

            <div className="bg-brand-card border border-slate-700 rounded-xl p-6 score-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm font-semibold score-label">Mobile</span>
                <SmartphoneIcon className="w-5 h-5 text-green-400" />
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(mobile)} mb-2 score-number`}>{mobile}</div>
              <div className="text-xs text-gray-500 metric-target">Mobile Ready</div>
            </div>

            <div className="bg-brand-card border border-slate-700 rounded-xl p-6 score-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm font-semibold score-label">Trust</span>
                <EyeIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(credibility)} mb-2 score-number`}>{credibility}</div>
              <div className="text-xs text-gray-500 metric-target">Credibility</div>
            </div>
          </div>

          {/* Core Web Vitals */}
          <div className="bg-brand-card border border-slate-700 rounded-xl p-8 mb-8 score-card">
            <h2 className="text-2xl font-bold text-white mb-6 score-number">Core Web Vitals</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="vital-item">
                <div className="text-sm text-gray-400 mb-2 score-label">Largest Contentful Paint</div>
                <div className="text-3xl font-bold text-white metric-value">{result.coreWebVitals.lcp.toFixed(2)}s</div>
                <div className="text-xs text-gray-500 mt-1 metric-target">Target: &lt; 2.5s</div>
              </div>
              <div className="vital-item">
                <div className="text-sm text-gray-400 mb-2 score-label">First Input Delay</div>
                <div className="text-3xl font-bold text-white metric-value">{result.coreWebVitals.fid.toFixed(0)}ms</div>
                <div className="text-xs text-gray-500 mt-1 metric-target">Target: &lt; 100ms</div>
              </div>
              <div className="vital-item">
                <div className="text-sm text-gray-400 mb-2 score-label">Cumulative Layout Shift</div>
                <div className="text-3xl font-bold text-white metric-value">{result.coreWebVitals.cls.toFixed(3)}</div>
                <div className="text-xs text-gray-500 mt-1 metric-target">Target: &lt; 0.1</div>
              </div>
            </div>
          </div>

          {/* Top Issues */}
          <div className="bg-brand-card border border-slate-700 rounded-xl p-8 mb-8 score-card">
            <h2 className="text-2xl font-bold text-white mb-6 score-number">Top Issues to Fix</h2>
            <div className="space-y-4">
              {result.recommendations.slice(0, 5).map((rec, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-brand-darker rounded-lg border border-slate-700 issue-item">
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    rec.priority === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {rec.priority}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1 analysis-text">{rec.issue}</div>
                    <div className="text-sm text-gray-400 analysis-text">{rec.fix}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-accent-purple/10 via-accent-pink/10 to-accent-cyan/10 border border-accent-purple/30 rounded-xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4 score-number">Get the Complete Picture</h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto score-label">
              This free tool shows you what's wrong. JetSuite shows you what's wrong AND generates weekly tasks to fix it—automatically.
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-4 px-8 rounded-lg transition-opacity shadow-lg"
            >
              Start Your Growth Journey
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-accent-purple/10 text-accent-purple rounded-full font-semibold text-sm mb-4">
            Free Demo Tool
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            Try JetViz: Website Visual Analyzer
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            See how your website looks to visitors and search engines. Get instant visual and technical feedback—no signup required.
          </p>
        </div>

        <form onSubmit={handleAnalyze} className="bg-brand-card border border-slate-700 rounded-xl p-8 shadow-2xl score-card">
          <label className="block text-sm font-semibold text-gray-300 mb-3 score-label">
            Enter Your Website URL
          </label>
          <div className="flex gap-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourbusiness.com"
              required
              className="flex-1 bg-brand-darker border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-accent-purple focus:border-transparent"
            />
            <button
              type="submit"
              disabled={isAnalyzing}
              className="bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-lg transition-opacity shadow-lg flex items-center gap-2"
            >
              <EyeIcon className="w-5 h-5" />
              Analyze Now
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-3 metric-target">
            This demo shows basic design and SEO metrics. Full JetSuite includes detailed recommendations and automated task generation.
          </p>
        </form>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-accent-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <EyeIcon className="w-6 h-6 text-accent-purple" />
            </div>
            <h3 className="font-semibold text-white mb-2 score-label">Visual Analysis</h3>
            <p className="text-sm text-gray-400 metric-target">See your site through visitor eyes</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-accent-pink/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LayoutIcon className="w-6 h-6 text-accent-pink" />
            </div>
            <h3 className="font-semibold text-white mb-2 score-label">Technical Metrics</h3>
            <p className="text-sm text-gray-400 metric-target">Core Web Vitals and SEO scores</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-accent-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <SmartphoneIcon className="w-6 h-6 text-accent-cyan" />
            </div>
            <h3 className="font-semibold text-white mb-2 score-label">Mobile Check</h3>
            <p className="text-sm text-gray-400 metric-target">Ensure mobile-friendliness</p>
          </div>
        </div>
      </div>
    </div>
  );
};
