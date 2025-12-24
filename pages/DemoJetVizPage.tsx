import React, { useState } from 'react';
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
      const data = await AnalyzerService.analyzeWebsite({
        websiteUrl: url,
        industry: 'general'
      });
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

  if (result) {
    const aesthetic = Math.round((100 - (result.coreWebVitals.cls * 100)) * 0.6 + result.mobileScore.score * 0.4);
    const structure = result.seoStructure.score;
    const mobile = result.mobileScore.score;
    const credibility = result.localRelevance.score;
    const overall = Math.round((aesthetic + structure + mobile + credibility) / 4);

    return (
      <div className="min-h-screen bg-brand-dark py-20">
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
            <h1 className="text-4xl font-bold text-white mb-4">
              Visual Analysis for <span className="text-accent-purple">{new URL(result.websiteUrl).hostname}</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Here's how your website looks to visitors. Unlock detailed recommendations with JetSuite.
            </p>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
            <div className="bg-brand-card border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm font-semibold">Overall</span>
                <EyeIcon className="w-5 h-5 text-accent-cyan" />
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(overall)} mb-2`}>{overall}</div>
              <div className="text-xs text-gray-500">Design Score</div>
            </div>

            <div className="bg-brand-card border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm font-semibold">Aesthetic</span>
                <PaletteIcon className="w-5 h-5 text-accent-purple" />
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(aesthetic)} mb-2`}>{aesthetic}</div>
              <div className="text-xs text-gray-500">Visual Appeal</div>
            </div>

            <div className="bg-brand-card border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm font-semibold">Structure</span>
                <LayoutIcon className="w-5 h-5 text-accent-pink" />
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(structure)} mb-2`}>{structure}</div>
              <div className="text-xs text-gray-500">SEO Structure</div>
            </div>

            <div className="bg-brand-card border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm font-semibold">Mobile</span>
                <SmartphoneIcon className="w-5 h-5 text-green-400" />
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(mobile)} mb-2`}>{mobile}</div>
              <div className="text-xs text-gray-500">Mobile Ready</div>
            </div>

            <div className="bg-brand-card border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm font-semibold">Trust</span>
                <EyeIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(credibility)} mb-2`}>{credibility}</div>
              <div className="text-xs text-gray-500">Credibility</div>
            </div>
          </div>

          {/* Core Web Vitals */}
          <div className="bg-brand-card border border-slate-700 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Core Web Vitals</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-2">Largest Contentful Paint</div>
                <div className="text-3xl font-bold text-white">{result.coreWebVitals.lcp.toFixed(2)}s</div>
                <div className="text-xs text-gray-500 mt-1">Target: &lt; 2.5s</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">First Input Delay</div>
                <div className="text-3xl font-bold text-white">{result.coreWebVitals.fid.toFixed(0)}ms</div>
                <div className="text-xs text-gray-500 mt-1">Target: &lt; 100ms</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">Cumulative Layout Shift</div>
                <div className="text-3xl font-bold text-white">{result.coreWebVitals.cls.toFixed(3)}</div>
                <div className="text-xs text-gray-500 mt-1">Target: &lt; 0.1</div>
              </div>
            </div>
          </div>

          {/* Top Issues */}
          <div className="bg-brand-card border border-slate-700 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Top Issues to Fix</h2>
            <div className="space-y-4">
              {result.recommendations.slice(0, 5).map((rec, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-brand-darker rounded-lg border border-slate-700">
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    rec.priority === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {rec.priority}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">{rec.issue}</div>
                    <div className="text-sm text-gray-400">{rec.fix}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-accent-purple/10 via-accent-pink/10 to-accent-cyan/10 border border-accent-purple/30 rounded-xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Get the Complete Picture</h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
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

        <form onSubmit={handleAnalyze} className="bg-brand-card border border-slate-700 rounded-xl p-8 shadow-2xl">
          <label className="block text-sm font-semibold text-gray-300 mb-3">
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
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <EyeIcon className="w-5 h-5" />
                  Analyze Now
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            This demo shows basic design and SEO metrics. Full JetSuite includes detailed recommendations and automated task generation.
          </p>
        </form>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-accent-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <EyeIcon className="w-6 h-6 text-accent-purple" />
            </div>
            <h3 className="font-semibold text-white mb-2">Visual Analysis</h3>
            <p className="text-sm text-gray-400">See your site through visitor eyes</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-accent-pink/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LayoutIcon className="w-6 h-6 text-accent-pink" />
            </div>
            <h3 className="font-semibold text-white mb-2">Technical Metrics</h3>
            <p className="text-sm text-gray-400">Core Web Vitals and SEO scores</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-accent-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <SmartphoneIcon className="w-6 h-6 text-accent-cyan" />
            </div>
            <h3 className="font-semibold text-white mb-2">Mobile Check</h3>
            <p className="text-sm text-gray-400">Ensure mobile-friendliness</p>
          </div>
        </div>
      </div>
    </div>
  );
};
