import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, TerminalIcon, ZapIcon, MapPinIcon, TrendingUpIcon } from '../components/icons/MiniIcons';
import { AnalyzerService } from '../services/analyzerService';
import type { AnalysisResult } from '../types';

interface DemoJetBizPageProps {
  navigate: (path: string) => void;
}

export const DemoJetBizPage: React.FC<DemoJetBizPageProps> = ({ navigate }) => {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setIsScanning(true);
    setResult(null);
    setProgress(0);

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 99) return 99;
        return prev + 1;
      });
    }, 100); // 10s to reach 100
    
    try {
      const [data] = await Promise.all([
        AnalyzerService.analyzeWebsite({
          websiteUrl: url,
          industry: 'general'
        }),
        new Promise(resolve => setTimeout(resolve, 10000))
      ]);
      setResult(data);
      setProgress(100);
    } catch (err) {
      console.error("Scan failed", err);
      alert("Scan failed. Please check the URL and try again.");
    } finally {
      clearInterval(timer);
      setIsScanning(false);
    }
  };

  const resetScan = () => {
    setResult(null);
    setUrl('');
    setProgress(0);
  };

  if (isScanning) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-8 relative">
            <div className="w-24 h-24 bg-accent-purple/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <ZapIcon className="w-12 h-12 text-accent-purple" />
            </div>
            <div className="absolute inset-0 border-4 border-accent-purple/30 rounded-full animate-[spin_3s_linear_infinite] border-t-accent-purple"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Analyzing Business Profile...</h2>
          <p className="text-gray-400 mb-8">Scanning Google Maps rankings, reviews, and SEO signals.</p>
          
          <div className="bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700">
            <div 
              className="bg-gradient-to-r from-accent-purple to-accent-pink h-full transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-accent-purple font-mono mt-4">{progress}% Complete</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-brand-dark py-20">
        <div className="max-w-7xl mx-auto px-6">
          <button 
            onClick={resetScan}
            className="flex items-center gap-2 text-gray-400 hover:text-accent-purple transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Scanner
          </button>

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-full font-semibold text-sm mb-4">
              <TerminalIcon className="w-4 h-4" />
              Analysis Complete
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 score-number">
              Results for <span className="text-accent-purple">{new URL(result.websiteUrl).hostname}</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto score-label">
              Here's how your Google Business Profile stacks up. These insights are free—unlock the full suite with JetSuite.
            </p>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-brand-card border border-slate-700 rounded-xl p-6 score-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm font-semibold score-label">Overall Score</span>
                <ZapIcon className="w-5 h-5 text-accent-cyan" />
              </div>
              <div className="text-4xl font-bold text-white mb-2 score-number">{result.overallScore}</div>
              <div className="text-xs text-gray-500 metric-target">Out of 100</div>
            </div>

            <div className="bg-brand-card border border-slate-700 rounded-xl p-6 score-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm font-semibold score-label">SEO Structure</span>
                <TrendingUpIcon className="w-5 h-5 text-accent-purple" />
              </div>
              <div className="text-4xl font-bold text-white mb-2 score-number">{result.seoStructure.score}</div>
              <div className="text-xs text-gray-500 metric-target">Optimization Score</div>
            </div>

            <div className="bg-brand-card border border-slate-700 rounded-xl p-6 score-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm font-semibold score-label">Mobile Score</span>
                <MapPinIcon className="w-5 h-5 text-accent-pink" />
              </div>
              <div className="text-4xl font-bold text-white mb-2 score-number">{result.mobileScore.score}</div>
              <div className="text-xs text-gray-500 metric-target">Mobile Friendly</div>
            </div>

            <div className="bg-brand-card border border-slate-700 rounded-xl p-6 score-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm font-semibold score-label">Local Relevance</span>
                <MapPinIcon className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-4xl font-bold text-white mb-2 score-number">{result.localRelevance.score}</div>
              <div className="text-xs text-gray-500 metric-target">Local SEO</div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-brand-card border border-slate-700 rounded-xl p-8 mb-8 score-card">
            <h2 className="text-2xl font-bold text-white mb-6 score-number">Top Recommendations</h2>
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
            <h2 className="text-3xl font-bold text-white mb-4 score-number">Want the Full Analysis?</h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto score-label">
              This is just a taste. JetSuite gives you complete audits, competitor analysis, automated tasks, and growth tracking—all in one platform.
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-4 px-8 rounded-lg transition-opacity shadow-lg"
            >
              Get Started with JetSuite
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
            Try JetBiz: Google Business Analyzer
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Get a free preview of how JetBiz analyzes your Google Business Profile and local SEO. No signup required.
          </p>
        </div>

        <form onSubmit={handleScan} className="bg-brand-card border border-slate-700 rounded-xl p-8 shadow-2xl score-card">
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
              disabled={isScanning}
              className="bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-lg transition-opacity shadow-lg flex items-center gap-2"
            >
              <ZapIcon className="w-5 h-5" />
              Scan Now
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-3 metric-target">
            This demo shows basic metrics. Full JetSuite includes competitor analysis, task generation, and weekly growth plans.
          </p>
        </form>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-accent-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ZapIcon className="w-6 h-6 text-accent-purple" />
            </div>
            <h3 className="font-semibold text-white mb-2 score-label">Instant Analysis</h3>
            <p className="text-sm text-gray-400 metric-target">Get results in under 30 seconds</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-accent-pink/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <TerminalIcon className="w-6 h-6 text-accent-pink" />
            </div>
            <h3 className="font-semibold text-white mb-2 score-label">Actionable Insights</h3>
            <p className="text-sm text-gray-400 metric-target">Know exactly what to fix first</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-accent-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUpIcon className="w-6 h-6 text-accent-cyan" />
            </div>
            <h3 className="font-semibold text-white mb-2 score-label">No Signup Required</h3>
            <p className="text-sm text-gray-400 metric-target">Try before you buy</p>
          </div>
        </div>
      </div>
    </div>
  );
};
