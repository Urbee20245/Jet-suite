import React, { useState, useRef, useEffect } from 'react';
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

// Steps: 1=name, 2=business name, 3=location, 4=business type, 5=pain points, 6=results
type Step = 1 | 2 | 3 | 4 | 5 | 6;

const LOCATION_OPTIONS = [
  { id: 'home', label: 'Home-Based / Online' },
  { id: 'single', label: 'Single Location' },
  { id: 'multiple', label: 'Multiple Locations' },
  { id: 'service', label: 'Service Area (I go to customers)' },
];

const BUSINESS_TYPE_OPTIONS = [
  { id: 'restaurant', label: 'Restaurant / Food' },
  { id: 'healthcare', label: 'Healthcare / Medical' },
  { id: 'legal', label: 'Legal Services' },
  { id: 'home_services', label: 'Home Services' },
  { id: 'retail', label: 'Retail / Boutique' },
  { id: 'real_estate', label: 'Real Estate' },
  { id: 'fitness', label: 'Fitness / Wellness' },
  { id: 'professional', label: 'Professional Services' },
  { id: 'other', label: 'Other' },
];

const PAIN_POINTS: PainPoint[] = [
  { id: 'google',      label: 'Not showing up on Google',           emoji: '\u{1F50D}', tools: ['jetbiz'] },
  { id: 'website',     label: 'Website not converting visitors',    emoji: '\u{1F310}', tools: ['jetviz'] },
  { id: 'competitors', label: "Don't know what competitors are doing", emoji: '\u{1F3C6}', tools: ['jetcompete'] },
  { id: 'keywords',    label: 'Targeting the wrong keywords',       emoji: '\u{1F3AF}', tools: ['jetkeywords'] },
  { id: 'social',      label: 'Inconsistent social media',          emoji: '\u{1F4F1}', tools: ['jetsocial', 'jetcreate'] },
  { id: 'reviews',     label: 'Not enough good reviews',            emoji: '\u{2B50}',  tools: ['jetreply', 'jettrust'] },
  { id: 'leads',       label: "Can't find new leads",               emoji: '\u{1F91D}', tools: ['jetleads'] },
  { id: 'blog',        label: 'No time to write content',           emoji: '\u{270D}\uFE0F', tools: ['jetcontent'] },
  { id: 'ads',         label: 'Ads not working',                    emoji: '\u{1F4E3}', tools: ['jetads'] },
  { id: 'events',      label: 'No local events or promotions',      emoji: '\u{1F4C5}', tools: ['jetevents'] },
  { id: 'images',      label: 'Need better marketing images',       emoji: '\u{1F5BC}\uFE0F', tools: ['jetimage', 'jetproduct'] },
  { id: 'plan',        label: 'No clear weekly growth plan',        emoji: '\u{1F4CB}', tools: ['growthplan'] },
];

const TOOL_INFO: Record<ToolKey, ToolInfo> = {
  jetbiz: {
    name: 'JetBiz',
    icon: JetBizIcon,
    color: 'from-blue-500 to-blue-600',
    tagline: (biz) => `Get ${biz} found on Google by fully optimizing your Google Business Profile so local customers choose you first.`,
  },
  jetviz: {
    name: 'JetViz',
    icon: JetVizIcon,
    color: 'from-teal-500 to-teal-600',
    tagline: (biz) => `Transform ${biz}'s website into a lead-generating machine with AI-powered conversion recommendations.`,
  },
  jetcompete: {
    name: 'JetCompete',
    icon: JetCompeteIcon,
    color: 'from-orange-500 to-orange-600',
    tagline: (biz) => `Reveal exactly what your top competitors are doing so ${biz} can outmaneuver them on every channel.`,
  },
  jetkeywords: {
    name: 'JetKeywords',
    icon: JetKeywordsIcon,
    color: 'from-yellow-500 to-yellow-600',
    tagline: (biz) => `Discover the exact search terms customers use to find businesses like ${biz} — then rank for them.`,
  },
  jetsocial: {
    name: 'JetSocial',
    icon: JetSocialIcon,
    color: 'from-pink-500 to-pink-600',
    tagline: (biz) => `Keep ${biz} active and top-of-mind on social media with AI-generated posts published on your schedule.`,
  },
  jetcreate: {
    name: 'JetCreate',
    icon: JetCreateIcon,
    color: 'from-purple-500 to-purple-600',
    tagline: (biz) => `Generate on-brand content for ${biz} in seconds — captions, stories, and campaigns that resonate.`,
  },
  jetreply: {
    name: 'JetReply',
    icon: JetReplyIcon,
    color: 'from-cyan-500 to-cyan-600',
    tagline: (biz) => `Respond to every customer review for ${biz} with personalized, professional replies that build trust.`,
  },
  jettrust: {
    name: 'JetTrust',
    icon: JetTrustIcon,
    color: 'from-green-500 to-green-600',
    tagline: (biz) => `Build an automated review funnel that turns ${biz}'s happy customers into 5-star public advocates.`,
  },
  jetleads: {
    name: 'JetLeads',
    icon: JetLeadsIcon,
    color: 'from-indigo-500 to-indigo-600',
    tagline: (biz) => `Fill ${biz}'s pipeline with qualified local prospects who are actively searching for your services.`,
  },
  jetcontent: {
    name: 'JetContent',
    icon: JetContentIcon,
    color: 'from-rose-500 to-rose-600',
    tagline: (biz) => `Publish authority-building blog articles and guides for ${biz} without spending hours writing them.`,
  },
  jetads: {
    name: 'JetAds',
    icon: JetAdsIcon,
    color: 'from-amber-500 to-amber-600',
    tagline: (biz) => `Create high-converting ad copy for ${biz} that speaks directly to your ideal customers and drives action.`,
  },
  jetevents: {
    name: 'JetEvents',
    icon: JetEventsIcon,
    color: 'from-violet-500 to-violet-600',
    tagline: (biz) => `Plan and promote local events and seasonal offers for ${biz} that bring customers through the door.`,
  },
  jetimage: {
    name: 'JetImage',
    icon: JetImageIcon,
    color: 'from-fuchsia-500 to-fuchsia-600',
    tagline: (biz) => `Generate professional marketing visuals for ${biz} that look like they came from an expensive design agency.`,
  },
  jetproduct: {
    name: 'JetProduct',
    icon: JetProductIcon,
    color: 'from-sky-500 to-sky-600',
    tagline: (biz) => `Create stunning product and service showcase images for ${biz} that make customers want to buy.`,
  },
  growthplan: {
    name: 'Growth Plan',
    icon: GrowthPlanIcon,
    color: 'from-emerald-500 to-emerald-600',
    tagline: (biz) => `Get a personalized weekly marketing roadmap for ${biz} — clear tasks, clear priorities, clear results.`,
  },
};

// ── Answer chip shown above answered questions ─────────────────────────────

interface AnswerChipProps {
  label: string;
}

const AnswerChip: React.FC<AnswerChipProps> = ({ label }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-900/30 border border-purple-700/40 text-purple-300 text-sm rounded-full font-medium">
    <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
    {label}
  </span>
);

// ── Animated conversation bubble ──────────────────────────────────────────

interface ConversationBubbleProps {
  children: React.ReactNode;
  visible: boolean;
}

const ConversationBubble: React.FC<ConversationBubbleProps> = ({ children, visible }) => (
  <div
    style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 400ms ease, transform 400ms ease',
    }}
  >
    {children}
  </div>
);

// ── Send / Arrow button ────────────────────────────────────────────────────

interface SendButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const SendButton: React.FC<SendButtonProps> = ({ onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200 shadow-lg shadow-purple-900/40"
    aria-label="Continue"
  >
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  </button>
);

// ── Main Component ─────────────────────────────────────────────────────────

export const GrowthAssessmentPage: React.FC<GrowthAssessmentPageProps> = ({ navigate }) => {
  const [step, setStep] = useState<Step>(1);

  // Field values
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [selectedPainPoints, setSelectedPainPoints] = useState<string[]>([]);

  // Results state
  const [resultsVisible, setResultsVisible] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  // Refs for auto-scroll
  const bottomRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const bizInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on step 1 name input
  useEffect(() => {
    if (step === 1 && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [step]);

  // Auto-focus biz name input on step 2
  useEffect(() => {
    if (step === 2 && bizInputRef.current) {
      bizInputRef.current.focus();
    }
  }, [step]);

  // Scroll to bottom when new step appears
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [step]);

  // Animate new step in
  const advanceTo = (nextStep: Step) => {
    setStep(nextStep);
  };

  // Per-step visibility map (each step is "visible" once it's the current step + small delay)
  const [stepVisible, setStepVisible] = useState<Record<number, boolean>>({ 1: false });

  useEffect(() => {
    const timer = setTimeout(() => {
      setStepVisible((prev) => ({ ...prev, [step]: true }));
    }, 50);
    return () => clearTimeout(timer);
  }, [step]);

  // ── Supabase save ──────────────────────────────────────────────────────

  const matchedToolKeys: ToolKey[] = Array.from(
    new Set(
      selectedPainPoints.flatMap(
        (id) => PAIN_POINTS.find((p) => p.id === id)?.tools ?? []
      )
    )
  );

  const saveAssessment = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const { data, error } = await supabase
        .from('growth_assessments')
        .insert({
          full_name: name,
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

  // ── Step advance handlers ──────────────────────────────────────────────

  const handleNameSubmit = () => {
    if (name.trim()) {
      advanceTo(2);
    }
  };

  const handleBizSubmit = () => {
    if (businessName.trim()) {
      advanceTo(3);
    }
  };

  const handleLocationSelect = (label: string) => {
    setLocation(label);
    advanceTo(4);
  };

  const handleBusinessTypeSelect = (label: string) => {
    setBusinessType(label);
    advanceTo(5);
  };

  const togglePainPoint = (id: string) => {
    setSelectedPainPoints((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleShowPlan = () => {
    if (selectedPainPoints.length > 0) {
      saveAssessment();
      advanceTo(6);
      setTimeout(() => setResultsVisible(true), 80);
    }
  };

  // ── Progress fraction (steps 1-6) ─────────────────────────────────────
  const progressPct = ((step - 1) / 5) * 100;

  // ── Shared input class ─────────────────────────────────────────────────
  const inputClass =
    'bg-transparent border-b-2 border-slate-600 focus:border-purple-500 text-white text-xl w-full outline-none py-3 transition-all duration-200 placeholder-gray-600';

  // ── Pill button classes ─────────────────────────────────────────────────
  const pillBase =
    'px-5 py-3 rounded-full border border-slate-700 bg-slate-800 text-gray-200 hover:border-purple-500 hover:bg-purple-900/20 transition-all duration-200 cursor-pointer text-sm font-medium';
  const pillSelected =
    'border-purple-500 bg-purple-900/30 text-white';

  return (
    <div className="min-h-screen bg-brand-darker text-gray-300 overflow-x-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none -z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-purple-600/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-indigo-600/6 rounded-full blur-[120px]" />
      </div>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-16 pb-32">
        {/* ── Conversation history ─────────────────────────────────────────── */}

        {/* STEP 1 — Name */}
        <ConversationBubble visible={!!stepVisible[1]}>
          <div className="mb-10">
            <p className="text-2xl sm:text-3xl font-bold text-white mb-1">
              Hi there! <span>&#x2728;</span> What&#39;s your name?
            </p>
            <p className="text-gray-500 text-sm mb-6">I&#39;ll personalize your growth plan just for you.</p>

            {step > 1 ? (
              <AnswerChip label={name} />
            ) : (
              <div className="flex items-end gap-3">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                  placeholder="Your name..."
                  className={inputClass}
                  autoComplete="given-name"
                />
                <SendButton onClick={handleNameSubmit} disabled={!name.trim()} />
              </div>
            )}
          </div>
        </ConversationBubble>

        {/* STEP 2 — Business Name */}
        {step >= 2 && (
          <ConversationBubble visible={!!stepVisible[2]}>
            <div className="mb-10">
              <p className="text-2xl sm:text-3xl font-bold text-white mb-1">
                Nice to meet you, {name}! <span>&#x1F44B;</span> What&#39;s your business called?
              </p>
              <p className="text-gray-500 text-sm mb-6">Tell me the name your customers know you by.</p>

              {step > 2 ? (
                <AnswerChip label={businessName} />
              ) : (
                <div className="flex items-end gap-3">
                  <input
                    ref={bizInputRef}
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleBizSubmit()}
                    placeholder="Business name..."
                    className={inputClass}
                    autoComplete="organization"
                  />
                  <SendButton onClick={handleBizSubmit} disabled={!businessName.trim()} />
                </div>
              )}
            </div>
          </ConversationBubble>
        )}

        {/* STEP 3 — Location */}
        {step >= 3 && (
          <ConversationBubble visible={!!stepVisible[3]}>
            <div className="mb-10">
              <p className="text-2xl sm:text-3xl font-bold text-white mb-1">
                Great! Where is {businessName} based?
              </p>
              <p className="text-gray-500 text-sm mb-6">This helps us tailor local growth strategies.</p>

              {step > 3 ? (
                <AnswerChip label={'\u{1F4CD} ' + location} />
              ) : (
                <div className="flex flex-wrap gap-3">
                  {LOCATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleLocationSelect(opt.label)}
                      className={pillBase}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ConversationBubble>
        )}

        {/* STEP 4 — Business Type */}
        {step >= 4 && (
          <ConversationBubble visible={!!stepVisible[4]}>
            <div className="mb-10">
              <p className="text-2xl sm:text-3xl font-bold text-white mb-1">
                What type of business is {businessName}?
              </p>
              <p className="text-gray-500 text-sm mb-6">We&#39;ll tailor everything to your industry.</p>

              {step > 4 ? (
                <AnswerChip label={businessType} />
              ) : (
                <div className="flex flex-wrap gap-3">
                  {BUSINESS_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleBusinessTypeSelect(opt.label)}
                      className={pillBase}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ConversationBubble>
        )}

        {/* STEP 5 — Pain Points */}
        {step >= 5 && (
          <ConversationBubble visible={!!stepVisible[5]}>
            <div className="mb-10">
              <p className="text-2xl sm:text-3xl font-bold text-white mb-1">
                What&#39;s {businessName} struggling with most? Pick everything that applies.
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Select as many as you like — I&#39;ll map each one to a specific solution.
              </p>

              {step > 5 ? (
                <AnswerChip label={selectedPainPoints.length + ' challenge' + (selectedPainPoints.length !== 1 ? 's' : '') + ' selected'} />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {PAIN_POINTS.map((pp) => {
                      const selected = selectedPainPoints.includes(pp.id);
                      return (
                        <button
                          key={pp.id}
                          onClick={() => togglePainPoint(pp.id)}
                          className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-3 ${
                            selected
                              ? 'border-purple-500 bg-purple-900/30 text-white'
                              : 'border-slate-700 bg-slate-800/40 hover:border-purple-500 hover:bg-purple-900/20 text-gray-200'
                          }`}
                        >
                          <span className="text-xl flex-shrink-0">{pp.emoji}</span>
                          <span className="text-sm font-medium leading-snug">{pp.label}</span>
                          {selected && (
                            <span className="ml-auto flex-shrink-0">
                              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedPainPoints.length > 0 && (
                    <p className="text-sm text-purple-400 mb-4 text-center">
                      {selectedPainPoints.length} challenge{selectedPainPoints.length !== 1 ? 's' : ''} selected
                    </p>
                  )}

                  <button
                    onClick={handleShowPlan}
                    disabled={selectedPainPoints.length === 0}
                    className="w-full py-4 px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:scale-[1.02] disabled:scale-100 text-lg"
                  >
                    Show Me My Plan &#x2192;
                  </button>
                </>
              )}
            </div>
          </ConversationBubble>
        )}

        {/* STEP 6 — Results */}
        {step >= 6 && (
          <ConversationBubble visible={!!stepVisible[6]}>
            <div
              style={{
                opacity: resultsVisible ? 1 : 0,
                transform: resultsVisible ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 700ms ease, transform 700ms ease',
              }}
            >
              {/* Results headline */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-green-900/30 border border-green-700/40 text-green-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Your Personalized Growth Plan is Ready
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 leading-tight">
                  Here&#39;s what&#39;s holding{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                    {businessName || 'Your Business'}
                  </span>{' '}
                  back — and exactly how to fix it, {name}.
                </h2>
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
                              Recommended
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
          </ConversationBubble>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
