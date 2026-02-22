import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../integrations/supabase/client';
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
  emoji: string;
  tools: ToolKey[];
}

interface ToolInfo {
  name: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  color: string;
  tagline: (businessName: string) => string;
}

const PAIN_POINTS: PainPoint[] = [
  { id: 'google',      label: 'Not showing up on Google',             emoji: '\uD83D\uDD0D', tools: ['jetbiz'] },
  { id: 'website',     label: 'Website not converting visitors',      emoji: '\uD83C\uDF10', tools: ['jetviz'] },
  { id: 'competitors', label: "Don't know what competitors are doing", emoji: '\uD83C\uDFC6', tools: ['jetcompete'] },
  { id: 'keywords',    label: 'Targeting the wrong keywords',         emoji: '\uD83C\uDFAF', tools: ['jetkeywords'] },
  { id: 'social',      label: 'Inconsistent social media',            emoji: '\uD83D\uDCF1', tools: ['jetsocial', 'jetcreate'] },
  { id: 'reviews',     label: 'Not enough good reviews',              emoji: '\u2B50',        tools: ['jetreply', 'jettrust'] },
  { id: 'leads',       label: "Can't find new leads",                 emoji: '\uD83E\uDD1D', tools: ['jetleads'] },
  { id: 'blog',        label: 'No time to write content',             emoji: '\u270D\uFE0F', tools: ['jetcontent'] },
  { id: 'ads',         label: 'Ads not working',                      emoji: '\uD83D\uDCE3', tools: ['jetads'] },
  { id: 'events',      label: 'No local events or promotions',        emoji: '\uD83D\uDCC5', tools: ['jetevents'] },
  { id: 'images',      label: 'Need better marketing images',         emoji: '\uD83D\uDDBC\uFE0F', tools: ['jetimage', 'jetproduct'] },
  { id: 'plan',        label: 'No clear weekly growth plan',          emoji: '\uD83D\uDDD3\uFE0F', tools: ['growthplan'] },
];

const LOCATION_OPTIONS = [
  { id: 'home',     label: 'Home-Based / Online',              emoji: '\uD83C\uDFE0' },
  { id: 'single',   label: 'Single Location',                  emoji: '\uD83D\uDCCD' },
  { id: 'multiple', label: 'Multiple Locations',               emoji: '\uD83D\uDDFA\uFE0F' },
  { id: 'service',  label: 'Service Area (I go to customers)', emoji: '\uD83D\uDE97' },
];

const BUSINESS_TYPE_OPTIONS = [
  { id: 'restaurant',   label: 'Restaurant / Food',       emoji: '\uD83C\uDF7D\uFE0F' },
  { id: 'healthcare',   label: 'Healthcare / Medical',    emoji: '\uD83C\uDFE5' },
  { id: 'legal',        label: 'Legal Services',          emoji: '\u2696\uFE0F' },
  { id: 'home',         label: 'Home Services',           emoji: '\uD83D\uDD27' },
  { id: 'retail',       label: 'Retail / Boutique',       emoji: '\uD83D\uDECD\uFE0F' },
  { id: 'realestate',   label: 'Real Estate',             emoji: '\uD83C\uDFD8\uFE0F' },
  { id: 'fitness',      label: 'Fitness / Wellness',      emoji: '\uD83D\uDCAA' },
  { id: 'professional', label: 'Professional Services',   emoji: '\uD83D\uDCBC' },
  { id: 'other',        label: 'Other',                   emoji: '\u2728' },
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

// ── Answered bubble ────────────────────────────────────────────────────────────
const AnsweredBubble: React.FC<{ text: string }> = ({ text }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/30 border border-purple-700/40 text-purple-300 text-sm font-medium">
    <svg className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
    {text}
  </span>
);

// ── Arrow send button ──────────────────────────────────────────────────────────
const SendButton: React.FC<{ onClick: () => void; disabled: boolean }> = ({ onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed flex items-center justify-center transition-all"
    aria-label="Continue"
  >
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  </button>
);

// ── Main Component ─────────────────────────────────────────────────────────────
export const GrowthAssessmentPage: React.FC<GrowthAssessmentPageProps> = ({ navigate }) => {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [selectedPainPoints, setSelectedPainPoints] = useState<string[]>([]);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const bizInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-focus text inputs
  useEffect(() => {
    if (step === 1) nameInputRef.current?.focus();
    else if (step === 2) bizInputRef.current?.focus();
  }, [step]);

  // Scroll to bottom when step advances
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [step]);

  const firstName = fullName.trim().split(' ')[0] || fullName.trim();

  const matchedToolKeys: ToolKey[] = Array.from(
    new Set(
      selectedPainPoints.flatMap(
        (id) => PAIN_POINTS.find((p) => p.id === id)?.tools ?? []
      )
    )
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleNameSubmit = useCallback(() => {
    if (fullName.trim()) setStep(2);
  }, [fullName]);

  const handleBizSubmit = useCallback(() => {
    if (businessName.trim()) setStep(3);
  }, [businessName]);

  const handleLocationSelect = (label: string) => {
    setLocation(label);
    setStep(4);
  };

  const handleBusinessTypeSelect = (label: string) => {
    setBusinessType(label);
    setStep(5);
  };

  const togglePainPoint = (id: string) => {
    setSelectedPainPoints((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const saveAssessment = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const { data, error } = await supabase
        .from('growth_assessments')
        .insert({
          full_name: fullName,
          business_name: businessName,
          city: location,
          business_type: businessType,
          selected_pain_points: selectedPainPoints,
          matched_tools: matchedToolKeys,
          referrer_url: typeof window !== 'undefined' ? window.document.referrer : null,
        })
        .select('id')
        .single();
      if (!error && data?.id) setAssessmentId(data.id);
    } catch (err) {
      console.error('Assessment save error:', err);
    }
  };

  const handleShowResults = () => {
    if (selectedPainPoints.length === 0) return;
    saveAssessment();
    setStep(6);
    setTimeout(() => setResultsVisible(true), 80);
  };

  // Progress: steps 1–6, bar fills as steps complete
  const progressPct = Math.round(((step - 1) / 5) * 100);

  // Shared fade-in style (applied once per step block on first render)
  const fadeIn: React.CSSProperties = {
    animation: 'convFadeIn 400ms ease forwards',
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes convFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="min-h-screen bg-brand-darker text-gray-300">
        {/* Background blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-purple-600/8 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-indigo-600/6 rounded-full blur-[120px]" />
        </div>

        {/* Thin progress bar pinned at top */}
        <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800 z-50">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-16 pb-32">

          {/* ── STEP 1 — Name ─────────────────────────────────────────── */}
          {step >= 1 && (
            <div style={fadeIn} className="mb-12">
              {step > 1 ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-gray-500 text-sm">Hi there! What&#x27;s your name?</p>
                  <AnsweredBubble text={fullName} />
                </div>
              ) : (
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    Hi there! <span aria-hidden="true">&#x2728;</span> What&#x27;s your name?
                  </p>
                  <p className="text-gray-500 text-sm mb-6">
                    I&#x27;ll personalize your growth plan just for you.
                  </p>
                  <div className="flex items-end gap-3">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleNameSubmit(); }}
                      placeholder="Your name..."
                      className="bg-transparent border-b-2 border-slate-600 focus:border-purple-500 text-white text-xl w-full outline-none py-3 transition-all placeholder-gray-600"
                    />
                    <SendButton onClick={handleNameSubmit} disabled={!fullName.trim()} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2 — Business Name ────────────────────────────────── */}
          {step >= 2 && (
            <div style={fadeIn} className="mb-12">
              {step > 2 ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-gray-500 text-sm">What&#x27;s your business called?</p>
                  <AnsweredBubble text={businessName} />
                </div>
              ) : (
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    Nice to meet you, {firstName}! <span aria-hidden="true">&#x1F44B;</span> What&#x27;s your business called?
                  </p>
                  <p className="text-gray-500 text-sm mb-6">
                    Tell me the name your customers know you by.
                  </p>
                  <div className="flex items-end gap-3">
                    <input
                      ref={bizInputRef}
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleBizSubmit(); }}
                      placeholder="Your business name..."
                      className="bg-transparent border-b-2 border-slate-600 focus:border-purple-500 text-white text-xl w-full outline-none py-3 transition-all placeholder-gray-600"
                    />
                    <SendButton onClick={handleBizSubmit} disabled={!businessName.trim()} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3 — Location ────────────────────────────────────── */}
          {step >= 3 && (
            <div style={fadeIn} className="mb-12">
              {step > 3 ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-gray-500 text-sm">Where is {businessName} based?</p>
                  <AnsweredBubble text={location} />
                </div>
              ) : (
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    Great! Where is {businessName} based?
                  </p>
                  <p className="text-gray-500 text-sm mb-6">
                    This helps us tailor local growth strategies.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {LOCATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleLocationSelect(opt.label)}
                        className="flex items-center gap-2 px-5 py-3 rounded-full bg-slate-800 border border-slate-700 hover:border-purple-500 hover:bg-purple-900/20 text-gray-200 transition-all cursor-pointer"
                      >
                        <span aria-hidden="true">{opt.emoji}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4 — Business Type ───────────────────────────────── */}
          {step >= 4 && (
            <div style={fadeIn} className="mb-12">
              {step > 4 ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-gray-500 text-sm">What type of business is {businessName}?</p>
                  <AnsweredBubble text={businessType} />
                </div>
              ) : (
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-white mb-6">
                    What type of business is {businessName}?
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {BUSINESS_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleBusinessTypeSelect(opt.label)}
                        className="flex items-center gap-2 px-4 py-3 rounded-full bg-slate-800 border border-slate-700 hover:border-purple-500 hover:bg-purple-900/20 text-gray-200 transition-all cursor-pointer text-left text-sm"
                      >
                        <span aria-hidden="true">{opt.emoji}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 5 — Pain Points ─────────────────────────────────── */}
          {step >= 5 && step < 6 && (
            <div style={fadeIn} className="mb-12">
              <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
                What&#x27;s {businessName} struggling with most? Pick everything that applies.
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Select as many as you like — I&#x27;ll map each one to a specific solution.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {PAIN_POINTS.map((pp) => {
                  const selected = selectedPainPoints.includes(pp.id);
                  return (
                    <button
                      key={pp.id}
                      onClick={() => togglePainPoint(pp.id)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                        selected
                          ? 'border-purple-500 bg-purple-900/30 text-white'
                          : 'border-slate-700 bg-slate-800/40 text-gray-200 hover:border-slate-600 hover:bg-slate-800/70'
                      }`}
                    >
                      <span className="text-xl flex-shrink-0" aria-hidden="true">{pp.emoji}</span>
                      <span className="text-sm font-medium leading-snug flex-1">{pp.label}</span>
                      {selected && (
                        <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedPainPoints.length > 0 && (
                <p className="text-sm text-purple-400 mb-4">
                  {selectedPainPoints.length} challenge{selectedPainPoints.length > 1 ? 's' : ''} selected
                </p>
              )}

              {selectedPainPoints.length > 0 && (
                <button
                  onClick={handleShowResults}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:scale-[1.02] text-lg"
                >
                  Show Me My Plan &#x2192;
                </button>
              )}
            </div>
          )}

          {/* ── STEP 6 — Results ─────────────────────────────────────── */}
          {step === 6 && (
            <div
              className={`transition-all duration-700 ${
                resultsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              {/* Results headline */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-green-900/30 border border-green-700/40 text-green-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-5">
                  <span aria-hidden="true">&#x2705;</span> Your Personalized Growth Plan is Ready
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">
                  Here&#x27;s what&#x27;s holding{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                    {businessName || 'Your Business'}
                  </span>{' '}
                  back — and exactly how to fix it, {firstName}.
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Based on your answers, these JetSuite tools will have the biggest impact on your growth.
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
                      className="bg-brand-dark/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-purple-900/10"
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

              {/* Summary bar */}
              <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-800/40 rounded-2xl p-5 mb-8 text-center">
                <p className="text-gray-300 text-sm mb-1">
                  We identified{' '}
                  <span className="font-bold text-white">{matchedToolKeys.length} key growth tools</span>{' '}
                  for {businessName || 'your business'}.
                </p>
                <p className="text-gray-500 text-xs">
                  JetSuite brings all of them together in one platform — no juggling multiple tools or agencies.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    if (assessmentId) {
                      const supabase = getSupabaseClient();
                      if (supabase) {
                        supabase
                          .from('growth_assessments')
                          .update({ clicked_get_started: true })
                          .eq('id', assessmentId)
                          .then(() => {});
                      }
                    }
                    navigate('/get-started');
                  }}
                  className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:scale-105 text-lg"
                >
                  Start Growing {businessName || 'Your Business'} Today &#x2192;
                </button>

                <button
                  onClick={() => {
                    if (assessmentId) {
                      const supabase = getSupabaseClient();
                      if (supabase) {
                        supabase
                          .from('growth_assessments')
                          .update({ clicked_schedule_demo: true })
                          .eq('id', assessmentId)
                          .then(() => {});
                      }
                    }
                    navigate('/schedule-demo');
                  }}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-slate-700 hover:border-slate-500 hover:bg-slate-800/50 text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-200 text-lg"
                >
                  Schedule a Demo
                </button>
              </div>

              <p className="text-center text-gray-600 text-xs mt-5">
                No commitment required &middot; Cancel anytime &middot; Setup in minutes
              </p>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      </div>
    </>
  );
};
