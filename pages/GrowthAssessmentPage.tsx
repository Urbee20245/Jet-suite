import React, { useState } from 'react';
import {
  JetBizIcon,
  JetVizIcon,
  JetCompeteIcon,
  JetKeywordsIcon,
  JetSocialIcon,
  JetCreateIcon,
  JetReplyIcon,
  JetTrustIcon,
  JetLeadsIcon,
  JetContentIcon,
  JetAdsIcon,
  JetEventsIcon,
  JetImageIcon,
  JetProductIcon,
  GrowthPlanIcon,
} from '../components/icons/ToolIcons';

export interface GrowthAssessmentPageProps {
  navigate: (path: string) => void;
}

type ToolKey =
  | 'jetbiz'
  | 'jetviz'
  | 'jetcompete'
  | 'jetkeywords'
  | 'jetsocial'
  | 'jetcreate'
  | 'jetreply'
  | 'jettrust'
  | 'jetleads'
  | 'jetcontent'
  | 'jetads'
  | 'jetevents'
  | 'jetimage'
  | 'jetproduct'
  | 'growthplan';

interface PainPoint {
  id: string;
  label: string;
  description: string;
  icon: string;
  tools: ToolKey[];
}

interface ToolInfo {
  name: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  color: string;
  tagline: (businessName: string) => string;
}

const PAIN_POINTS: PainPoint[] = [
  {
    id: 'google',
    label: "My business doesn't show up on Google",
    description: 'You're invisible when customers search for what you offer.',
    icon: '🔍',
    tools: ['jetbiz'],
  },
  {
    id: 'website',
    label: "My website isn't bringing in customers",
    description: 'Traffic is low or visitors leave without converting.',
    icon: '🌐',
    tools: ['jetviz'],
  },
  {
    id: 'competitors',
    label: "I don't know what my competitors are doing",
    description: 'You're competing blind while rivals pull ahead.',
    icon: '🏆',
    tools: ['jetcompete'],
  },
  {
    id: 'keywords',
    label: "I'm not ranking for the right search terms",
    description: 'Customers can't find you because you target the wrong keywords.',
    icon: '🎯',
    tools: ['jetkeywords'],
  },
  {
    id: 'social',
    label: "I struggle to create social media content consistently",
    description: 'Your social presence goes dark for weeks at a time.',
    icon: '📱',
    tools: ['jetsocial', 'jetcreate'],
  },
  {
    id: 'reviews',
    label: "I don't have enough customer reviews or they're bad",
    description: 'Poor or missing reviews are costing you trust and customers.',
    icon: '⭐',
    tools: ['jetreply', 'jettrust'],
  },
  {
    id: 'leads',
    label: "I can't find new leads or prospects",
    description: 'Your pipeline is dry and customer acquisition is unpredictable.',
    icon: '🤝',
    tools: ['jetleads'],
  },
  {
    id: 'blog',
    label: "I don't have time to write blog posts or articles",
    description: 'Content marketing goes undone because it takes too long.',
    icon: '✍️',
    tools: ['jetcontent'],
  },
  {
    id: 'ads',
    label: "My ads aren't working or I don't know what to say",
    description: 'Ad spend is wasted on messaging that doesn't convert.',
    icon: '📣',
    tools: ['jetads'],
  },
  {
    id: 'events',
    label: "I can't visualize local events or promotions to run",
    description: 'You miss opportunities to connect with the local community.',
    icon: '📅',
    tools: ['jetevents'],
  },
  {
    id: 'images',
    label: "I need better product or marketing images",
    description: 'Low-quality visuals make your business look unprofessional.',
    icon: '🖼️',
    tools: ['jetimage', 'jetproduct'],
  },
  {
    id: 'plan',
    label: "I have no clear weekly plan to grow my business",
    description: 'You work hard but without direction — progress feels random.',
    icon: '🗓️',
    tools: ['growthplan'],
  },
];

const TOOL_INFO: Record<ToolKey, ToolInfo> = {
  jetbiz: {
    name: 'JetBiz',
    icon: JetBizIcon,
    color: 'from-blue-500 to-blue-600',
    tagline: (biz) =>
      `Get ${biz} found on Google by fully optimizing your Google Business Profile so local customers choose you first.`,
  },
  jetviz: {
    name: 'JetViz',
    icon: JetVizIcon,
    color: 'from-teal-500 to-teal-600',
    tagline: (biz) =>
      `Transform ${biz}'s website into a lead-generating machine with AI-powered conversion recommendations.`,
  },
  jetcompete: {
    name: 'JetCompete',
    icon: JetCompeteIcon,
    color: 'from-orange-500 to-orange-600',
    tagline: (biz) =>
      `Reveal exactly what your top competitors are doing so ${biz} can outmaneuver them on every channel.`,
  },
  jetkeywords: {
    name: 'JetKeywords',
    icon: JetKeywordsIcon,
    color: 'from-yellow-500 to-yellow-600',
    tagline: (biz) =>
      `Discover the exact search terms customers use to find businesses like ${biz} — then rank for them.`,
  },
  jetsocial: {
    name: 'JetSocial',
    icon: JetSocialIcon,
    color: 'from-pink-500 to-pink-600',
    tagline: (biz) =>
      `Keep ${biz} active and top-of-mind on social media with AI-generated posts published on your schedule.`,
  },
  jetcreate: {
    name: 'JetCreate',
    icon: JetCreateIcon,
    color: 'from-purple-500 to-purple-600',
    tagline: (biz) =>
      `Generate on-brand content for ${biz} in seconds — captions, stories, and campaigns that resonate.`,
  },
  jetreply: {
    name: 'JetReply',
    icon: JetReplyIcon,
    color: 'from-cyan-500 to-cyan-600',
    tagline: (biz) =>
      `Respond to every customer review for ${biz} with personalized, professional replies that build trust.`,
  },
  jettrust: {
    name: 'JetTrust',
    icon: JetTrustIcon,
    color: 'from-green-500 to-green-600',
    tagline: (biz) =>
      `Build an automated review funnel that turns ${biz}'s happy customers into 5-star public advocates.`,
  },
  jetleads: {
    name: 'JetLeads',
    icon: JetLeadsIcon,
    color: 'from-indigo-500 to-indigo-600',
    tagline: (biz) =>
      `Fill ${biz}'s pipeline with qualified local prospects who are actively searching for your services.`,
  },
  jetcontent: {
    name: 'JetContent',
    icon: JetContentIcon,
    color: 'from-rose-500 to-rose-600',
    tagline: (biz) =>
      `Publish authority-building blog articles and guides for ${biz} without spending hours writing them.`,
  },
  jetads: {
    name: 'JetAds',
    icon: JetAdsIcon,
    color: 'from-amber-500 to-amber-600',
    tagline: (biz) =>
      `Create high-converting ad copy for ${biz} that speaks directly to your ideal customers and drives action.`,
  },
  jetevents: {
    name: 'JetEvents',
    icon: JetEventsIcon,
    color: 'from-violet-500 to-violet-600',
    tagline: (biz) =>
      `Plan and promote local events and seasonal offers for ${biz} that bring customers through the door.`,
  },
  jetimage: {
    name: 'JetImage',
    icon: JetImageIcon,
    color: 'from-fuchsia-500 to-fuchsia-600',
    tagline: (biz) =>
      `Generate professional marketing visuals for ${biz} that look like they came from an expensive design agency.`,
  },
  jetproduct: {
    name: 'JetProduct',
    icon: JetProductIcon,
    color: 'from-sky-500 to-sky-600',
    tagline: (biz) =>
      `Create stunning product and service showcase images for ${biz} that make customers want to buy.`,
  },
  growthplan: {
    name: 'Growth Plan',
    icon: GrowthPlanIcon,
    color: 'from-emerald-500 to-emerald-600',
    tagline: (biz) =>
      `Get a personalized weekly marketing roadmap for ${biz} — clear tasks, clear priorities, clear results.`,
  },
};

const BUSINESS_TYPES = [
  'Restaurant/Food & Beverage',
  'Healthcare/Medical',
  'Legal Services',
  'Home Services/Contractor',
  'Retail/Boutique',
  'Real Estate',
  'Fitness/Wellness',
  'Professional Services',
  'Other',
];

// ── Progress Bar ──────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ step: number }> = ({ step }) => (
  <div className="w-full max-w-md mx-auto mb-10">
    <div className="flex items-center justify-between mb-3">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              step >= s
                ? 'bg-accent-purple text-white shadow-lg shadow-purple-900/40'
                : 'bg-slate-800 text-gray-500'
            }`}
          >
            {step > s ? '✓' : s}
          </div>
          {s < 3 && (
            <div className="flex-1 h-0.5 mx-1">
              <div
                className={`h-full transition-all duration-500 ${
                  step > s ? 'bg-accent-purple' : 'bg-slate-800'
                }`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
    <p className="text-center text-sm text-gray-500">
      Step {step} of 3 —{' '}
      {step === 1
        ? 'Your Information'
        : step === 2
        ? 'Select Your Challenges'
        : 'Your Growth Plan'}
    </p>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export const GrowthAssessmentPage: React.FC<GrowthAssessmentPageProps> = ({ navigate }) => {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [selectedPainPoints, setSelectedPainPoints] = useState<string[]>([]);
  const [resultsVisible, setResultsVisible] = useState(false);

  // ── Validation helpers ───────────────────────────────────────────────────

  const step1Valid = fullName.trim() && businessName.trim() && city.trim() && businessType;
  const step2Valid = selectedPainPoints.length > 0;

  // ── Derived — matched tools ──────────────────────────────────────────────

  const matchedToolKeys: ToolKey[] = Array.from(
    new Set(
      selectedPainPoints.flatMap(
        (id) => PAIN_POINTS.find((p) => p.id === id)?.tools ?? []
      )
    )
  );

  // ── Handlers ────────────────────────────────────────────────────────────

  const togglePainPoint = (id: string) => {
    setSelectedPainPoints((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleStep1Next = () => {
    if (step1Valid) setStep(2);
  };

  const handleStep2Next = () => {
    if (step2Valid) {
      setStep(3);
      // Trigger entrance animation shortly after mount
      setTimeout(() => setResultsVisible(true), 80);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) {
      setResultsVisible(false);
      setStep(2);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-brand-darker text-gray-300">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-purple-600/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-indigo-600/6 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-16 sm:py-24">
        {/* Header badge */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 bg-purple-900/40 border border-purple-700/50 text-purple-300 text-sm font-semibold px-4 py-2 rounded-full">
            🚀 Free 2-Minute Business Assessment
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white text-center leading-tight mb-4">
          What's Holding Your Business Back?
        </h1>
        <p className="text-center text-gray-400 text-lg mb-12 max-w-xl mx-auto">
          Answer 3 quick questions and we'll show you exactly which JetSuite tools will move the
          needle for your growth.
        </p>

        <ProgressBar step={step} />

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="bg-brand-dark/70 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-2">Tell us about yourself</h2>
            <p className="text-gray-400 mb-8">
              We'll personalize your growth recommendations based on your business.
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Full Name <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jane Smith"
                  className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-gray-500 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Business Name <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Smith Plumbing Co."
                  className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-gray-500 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  City / Location <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Austin, TX"
                  className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-gray-500 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Business Type <span className="text-purple-400">*</span>
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled className="text-gray-500">
                    Select your business type...
                  </option>
                  {BUSINESS_TYPES.map((bt) => (
                    <option key={bt} value={bt} className="bg-slate-800">
                      {bt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleStep1Next}
              disabled={!step1Valid}
              className="mt-8 w-full py-4 px-8 bg-gradient-to-r from-accent-purple to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:scale-[1.02] disabled:scale-100 disabled:shadow-none"
            >
              Continue → Select Your Challenges
            </button>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div>
            <div className="mb-6">
              <button
                onClick={handleBack}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
              >
                ← Back
              </button>
            </div>

            <div className="bg-brand-dark/70 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-2">
                What's challenging for {businessName || 'your business'}?
              </h2>
              <p className="text-gray-400 mb-8">
                Pick every challenge that applies. We'll map each one to the exact JetSuite tool
                that solves it.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PAIN_POINTS.map((pp) => {
                  const selected = selectedPainPoints.includes(pp.id);
                  return (
                    <button
                      key={pp.id}
                      onClick={() => togglePainPoint(pp.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all duration-200 group ${
                        selected
                          ? 'border-accent-purple bg-purple-900/30 shadow-md shadow-purple-900/20'
                          : 'border-slate-700 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0 mt-0.5">{pp.icon}</span>
                        <div>
                          <p
                            className={`font-semibold text-sm leading-snug ${
                              selected ? 'text-white' : 'text-gray-200'
                            }`}
                          >
                            {pp.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{pp.description}</p>
                        </div>
                        <div
                          className={`ml-auto flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            selected
                              ? 'border-accent-purple bg-accent-purple'
                              : 'border-slate-600'
                          }`}
                        >
                          {selected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedPainPoints.length > 0 && (
                <p className="text-center text-sm text-purple-400 mt-4">
                  {selectedPainPoints.length} challenge{selectedPainPoints.length > 1 ? 's' : ''}{' '}
                  selected
                </p>
              )}

              <button
                onClick={handleStep2Next}
                disabled={!step2Valid}
                className="mt-8 w-full py-4 px-8 bg-gradient-to-r from-accent-purple to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:scale-[1.02] disabled:scale-100 disabled:shadow-none"
              >
                See My Growth Plan →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 — Results ── */}
        {step === 3 && (
          <div
            className={`transition-all duration-700 ${
              resultsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="mb-6">
              <button
                onClick={handleBack}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
              >
                ← Back
              </button>
            </div>

            {/* Results headline */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-green-900/30 border border-green-700/40 text-green-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-5">
                ✅ Your Personalized Growth Plan is Ready
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">
                Here's What's Holding{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                  {businessName || 'Your Business'}
                </span>{' '}
                Back — And How to Fix It
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Based on your answers, these JetSuite tools will have the biggest impact on your
                growth in {city || 'your area'}.
              </p>
            </div>

            {/* Tool cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {matchedToolKeys.map((toolKey, idx) => {
                const tool = TOOL_INFO[toolKey];
                const Icon = tool.icon;
                return (
                  <div
                    key={toolKey}
                    className="bg-brand-dark/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-purple-900/10 group"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0 shadow-lg`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-white text-base">{tool.name}</h3>
                          <span className="text-xs bg-purple-900/50 border border-purple-700/40 text-purple-300 px-2 py-0.5 rounded-full font-semibold">
                            Learn More
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {tool.tagline(businessName || 'your business')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary score bar */}
            <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-800/40 rounded-2xl p-5 mb-8 text-center">
              <p className="text-gray-300 text-sm mb-1">
                We identified{' '}
                <span className="font-bold text-white">{matchedToolKeys.length} key growth tools</span>{' '}
                for {businessName || 'your business'} in {city || 'your market'}.
              </p>
              <p className="text-gray-500 text-xs">
                JetSuite brings all of them together in one platform — no juggling multiple tools or
                agencies.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/get-started')}
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:scale-105 text-lg"
              >
                Start Growing {businessName || 'Your Business'} Today
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>

              <button
                onClick={() => navigate('/schedule-demo')}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-slate-700 hover:border-slate-500 hover:bg-slate-800/50 text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-200 text-lg"
              >
                Schedule a Demo
              </button>
            </div>

            <p className="text-center text-gray-600 text-xs mt-5">
              No commitment required · Cancel anytime · Setup in minutes
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
