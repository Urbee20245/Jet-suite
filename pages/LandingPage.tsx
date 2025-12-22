
import React from 'react';
import { FaqItem } from '../components/marketing/FaqItem';
import { TestimonialCard } from '../components/marketing/TestimonialCard';
import { EyeSlashIcon, ExclamationTriangleIcon, CompetitorWinIcon, CheckCircleIcon, StarIcon, MapPinIcon } from '../components/icons/MiniIcons';
import { JetVizIcon, JetBizIcon, GrowthScoreIcon } from '../components/icons/ToolIcons';

interface LandingPageProps {
  navigate: (path: string) => void;
}

const faqs = [
    { q: "What makes JetSuite different from other SEO tools?", a: "Most tools give you data dumps. JetSuite gives you a prioritized action plan. We tell you exactly what to fix this week, track your completion, and adjust your strategy based on results—not vanity metrics." },
    { q: "Do I need technical skills to use JetSuite?", a: "No. Every recommendation comes with clear instructions. If something requires code changes, we flag it and can connect you with implementation help." },
    { q: "How quickly will I see results?", a: "You'll see your Growth Score improve within weeks as you complete tasks. Ranking improvements typically take 2-3 months of consistent execution, which is why we focus on weekly progress." },
    { q: "Can I try it before subscribing?", a: "Yes. JetViz and Jet Local Optimizer are free to try. You'll get a full audit and see exactly what you'd be working with before committing." },
    { q: "What if I already have an SEO agency?", a: "JetSuite works alongside agencies or replaces them. Many customers use our tools to verify what their agency is telling them—or realize they can handle it themselves." },
    { q: "Is this only for Georgia businesses?", a: "We're focused on Walton and Gwinnett County currently, but the tools work for any local business in the US." },
    { q: "How does pricing work for multiple locations?", a: "Your base $149/month includes one business profile with full access to all tools. Each additional business location is just $49/month. Need your team involved? Add team members for $15/month each." }
];

const PainPointCard: React.FC<{ icon: React.FC<any>, title: string, text: string }> = ({ icon: Icon, title, text }) => (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
        <Icon className="w-8 h-8 text-red-400 mb-4" />
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-gray-400 mt-2">{text}</p>
    </div>
);

const SolutionToolCard: React.FC<{ icon: React.FC<any>, title: string, text: string }> = ({ icon: Icon, title, text }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md glow-card glow-card-rounded-xl text-left">
        <Icon className="w-8 h-8 text-accent-purple mb-4" />
        <h3 className="text-lg font-bold text-brand-text">{title}</h3>
        <p className="text-brand-text-muted mt-2">{text}</p>
    </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const faqMidpoint = Math.ceil(faqs.length / 2);
  const leftFaqs = faqs.slice(0, faqMidpoint);
  const rightFaqs = faqs.slice(faqMidpoint);

  return (
    <div className="bg-brand-darker text-gray-300 overflow-x-hidden">
      {/* SECTION 1: HERO (Light) */}
      <section className="relative py-24 sm:py-32 px-4 bg-white text-brand-text">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-brand-text tracking-tighter">
              Most local businesses fail online before SEO even matters.
            </h1>
            <p className="mt-6 max-w-xl mx-auto md:mx-0 text-lg sm:text-xl text-brand-text-muted leading-relaxed">
              JetSuite shows you exactly what's broken, what to fix first, and tracks your progress—so you stop wasting money and start getting customers.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <button onClick={() => navigate('/login')} className="w-full sm:w-auto bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-3 px-8 rounded-lg transition-opacity duration-300 text-lg shadow-lg shadow-accent-purple/20">
                See What's Holding You Back
              </button>
              <button className="w-full sm:w-auto border-2 border-brand-border hover:bg-gray-100 text-brand-text font-bold py-3 px-8 rounded-lg transition-colors duration-300 text-lg">
                Watch How It Works
              </button>
            </div>
          </div>
          {/* Right: Visuals */}
          <div className="space-y-6">
            {/* Google SERP Mockup */}
            <div className="relative bg-white p-4 rounded-xl border border-gray-200 shadow-2xl shadow-gray-300/50">
                <p className="text-xs text-gray-500 mb-2">Search: "plumber in Gwinnett County"</p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-blue-700 text-lg">Gwinnett's Finest Plumbing</h3>
                    <div className="flex items-center text-xs mt-1">
                        <StarIcon className="w-4 h-4 text-yellow-500"/>
                        <StarIcon className="w-4 h-4 text-yellow-500"/>
                        <StarIcon className="w-4 h-4 text-yellow-500"/>
                        <StarIcon className="w-4 h-4 text-yellow-500"/>
                        <StarIcon className="w-4 h-4 text-yellow-500"/>
                        <span className="text-gray-600 ml-2">5.0 (128 reviews)</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-2 flex items-start"><MapPinIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0"/>123 Main St, Lawrenceville, GA</p>
                </div>
                <div className="absolute -top-3 -right-3 bg-accent-pink text-white text-xs font-bold py-1 px-3 rounded-full shadow-lg rotate-6">This could be you</div>
            </div>
            {/* JetViz Dashboard Card */}
            <div className="bg-slate-900 border border-slate-700 p-6 flex items-center justify-between rounded-xl shadow-2xl shadow-accent-purple/10">
                <div>
                    <p className="text-xs font-semibold text-accent-purple mb-1">Powered by JetViz</p>
                    <h3 className="text-white font-bold text-xl">Sunbeam Electric Website Audit</h3>
                    <p className="text-gray-400 text-sm">www.sunbeamelectricga.com</p>
                </div>
                <div className="flex items-center gap-4">
                    <p className="text-gray-400 font-medium text-sm">Growth Score</p>
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
                        <div className="w-[72px] h-[72px] rounded-full bg-slate-900 flex items-center justify-center">
                            <span className="text-white text-2xl font-bold">72</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: PROBLEM AGITATION (Dark) */}
      <section className="py-24 sm:py-32 px-4 bg-[#0a0a0f]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white">Is your website costing you customers?</h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-400">
            You paid for a website. Maybe you're even paying for SEO. But leads aren't coming in. You're not sure if it's your site, your Google listing, or your competition outranking you. Traditional agencies give you reports—not answers.
          </p>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <PainPointCard icon={EyeSlashIcon} title="Invisible Issues" text="Your website has problems you can't see that kill your rankings and turn customers away." />
            <PainPointCard icon={ExclamationTriangleIcon} title="Wasted Ad Spend" text="You're paying for traffic that bounces because your site isn't built to convert visitors into leads." />
            <PainPointCard icon={CompetitorWinIcon} title="Competitors Winning" text="The business down the street is getting your customers because their online presence is stronger." />
          </div>
        </div>
      </section>

      {/* SECTION 3: SOLUTION INTRO (Light) */}
      <section className="py-24 sm:py-32 px-4 bg-white text-brand-text">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold">We don't just audit. We build your action plan.</h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-brand-text-muted">
            JetSuite combines three powerful diagnostic tools into one growth system. You'll know exactly what's wrong, what to fix this week, and how to measure progress.
          </p>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <SolutionToolCard icon={JetVizIcon} title="JetViz" text="Instant website analysis for speed, SEO, clarity, and conversion friction." />
            <SolutionToolCard icon={JetBizIcon} title="Jet Local Optimizer" text="Google Business Profile audit with competitive gap analysis." />
            <SolutionToolCard icon={GrowthScoreIcon} title="Growth Score" text="Track your 0-100 score across Visibility, Trust, and Activity." />
          </div>
        </div>
      </section>

      {/* SECTION 4: JETVIZ DEEP DIVE (Dark) */}
      <section className="py-24 sm:py-32 px-4 bg-[#0a0a0f]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="md:order-2">
            <h2 className="text-3xl sm:text-5xl font-bold text-white">See your website the way Google sees it.</h2>
            <ul className="mt-8 space-y-4 text-lg text-gray-300">
              <li className="flex items-start"><CheckCircleIcon className="w-6 h-6 text-accent-cyan mr-3 mt-1 flex-shrink-0" /><span>Real-time performance analysis</span></li>
              <li className="flex items-start"><CheckCircleIcon className="w-6 h-6 text-accent-cyan mr-3 mt-1 flex-shrink-0" /><span>Local SEO signals check</span></li>
              <li className="flex items-start"><CheckCircleIcon className="w-6 h-6 text-accent-cyan mr-3 mt-1 flex-shrink-0" /><span>Mobile responsiveness scoring</span></li>
              <li className="flex items-start"><CheckCircleIcon className="w-6 h-6 text-accent-cyan mr-3 mt-1 flex-shrink-0" /><span>Trust signal detection</span></li>
              <li className="flex items-start"><CheckCircleIcon className="w-6 h-6 text-accent-cyan mr-3 mt-1 flex-shrink-0" /><span>Actionable fixes—not vague suggestions</span></li>
            </ul>
            <button onClick={() => navigate('/login')} className="mt-8 bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-3 px-8 rounded-lg transition-opacity duration-300 text-lg shadow-lg shadow-accent-purple/20">Try JetViz Free</button>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-2xl">
              <h3 className="text-white font-bold">JetViz Analysis</h3>
              <div className="mt-4 bg-slate-900/80 p-4 rounded-lg">
                  <div className="flex justify-between items-center text-sm"><span>Performance</span><span className="font-bold text-yellow-400">68/100</span></div>
                  <div className="w-full bg-slate-700 h-2 rounded-full mt-1"><div className="w-[68%] bg-yellow-400 h-2 rounded-full"></div></div>
              </div>
              <div className="mt-2 bg-slate-900/80 p-4 rounded-lg">
                  <div className="flex justify-between items-center text-sm"><span>Local SEO</span><span className="font-bold text-green-400">85/100</span></div>
                  <div className="w-full bg-slate-700 h-2 rounded-full mt-1"><div className="w-[85%] bg-green-400 h-2 rounded-full"></div></div>
              </div>
              <div className="mt-2 bg-slate-900/80 p-4 rounded-lg">
                  <div className="flex justify-between items-center text-sm"><span>Trust Signals</span><span className="font-bold text-red-400">42/100</span></div>
                  <div className="w-full bg-slate-700 h-2 rounded-full mt-1"><div className="w-[42%] bg-red-400 h-2 rounded-full"></div></div>
              </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: JET LOCAL OPTIMIZER (Dark) */}
      <section className="py-24 sm:py-32 px-4 bg-brand-darker">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-5xl font-bold text-white">Your Google listing is your first impression. Is it working?</h2>
            <ul className="mt-8 space-y-4 text-lg text-gray-300">
              <li className="flex items-start"><CheckCircleIcon className="w-6 h-6 text-accent-cyan mr-3 mt-1 flex-shrink-0" /><span>Pulls your real Google Business Profile data</span></li>
              <li className="flex items-start"><CheckCircleIcon className="w-6 h-6 text-accent-cyan mr-3 mt-1 flex-shrink-0" /><span>Compares you against top local competitors</span></li>
              <li className="flex items-start"><CheckCircleIcon className="w-6 h-6 text-accent-cyan mr-3 mt-1 flex-shrink-0" /><span>Shows exactly what's missing vs. who's ranking</span></li>
              <li className="flex items-start"><CheckCircleIcon className="w-6 h-6 text-accent-cyan mr-3 mt-1 flex-shrink-0" /><span>Generates fix-it tasks you can complete today</span></li>
            </ul>
            <button onClick={() => navigate('/login')} className="mt-8 bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-3 px-8 rounded-lg transition-opacity duration-300 text-lg shadow-lg shadow-accent-purple/20">Analyze Your Google Listing</button>
          </div>
           <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-2xl">
              <h3 className="text-white font-bold">Local Competitor Gap Analysis</h3>
              <div className="mt-4 space-y-2">
                <div className="bg-slate-900/80 p-3 rounded-lg flex justify-between items-center"><span className="text-white">Your Business</span><span className="text-yellow-400 font-bold">Missing 5 Key Categories</span></div>
                <div className="bg-slate-900/80 p-3 rounded-lg flex justify-between items-center"><span className="text-gray-400">Competitor #1</span><span className="text-green-400 font-bold">Fully Optimized</span></div>
                <div className="bg-slate-900/80 p-3 rounded-lg flex justify-between items-center"><span className="text-gray-400">Competitor #2</span><span className="text-green-400 font-bold">Fully Optimized</span></div>
                <div className="bg-slate-900/80 p-3 rounded-lg flex justify-between items-center"><span className="text-gray-400">Competitor #3</span><span className="text-yellow-400 font-bold">Missing Services List</span></div>
              </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: STATS BAR (Gradient) */}
       <section className="py-20 bg-gradient-to-r from-accent-purple to-accent-pink">
        <div className="max-w-5xl mx-auto text-center px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Built for local businesses. Trusted by local leaders.</h2>
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
                <div><p className="text-4xl font-bold text-white">300+</p><p className="text-white/80 mt-2">Websites Analyzed</p></div>
                <div><p className="text-4xl font-bold text-white">24/7</p><p className="text-white/80 mt-2">Monitoring</p></div>
                <div><p className="text-4xl font-bold text-white">5.0</p><p className="text-white/80 mt-2">Average Rating</p></div>
                <div><p className="text-4xl font-bold text-white">GA</p><p className="text-white/80 mt-2">Walton & Gwinnett Focused</p></div>
            </div>
        </div>
      </section>

      {/* SECTION 7: HOW IT WORKS (Light) */}
      <section className="py-24 sm:py-32 px-4 bg-white text-brand-text">
        <div className="max-w-6xl mx-auto">
            <div className="text-center">
                <h2 className="text-3xl sm:text-5xl font-bold">Your growth plan in 3 steps.</h2>
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="bg-gray-50 p-8 rounded-xl border border-gray-200"><div className="text-4xl font-bold text-accent-purple">1</div><h3 className="text-xl font-bold mt-4">Connect</h3><p className="text-brand-text-muted mt-2">Link your website and Google Business Profile in 60 seconds.</p></div>
                <div className="bg-gray-50 p-8 rounded-xl border border-gray-200"><div className="text-4xl font-bold text-accent-purple">2</div><h3 className="text-xl font-bold mt-4">Diagnose</h3><p className="text-brand-text-muted mt-2">Get your Growth Score and see what's holding you back.</p></div>
                <div className="bg-gray-50 p-8 rounded-xl border border-gray-200"><div className="text-4xl font-bold text-accent-purple">3</div><h3 className="text-xl font-bold mt-4">Execute</h3><p className="text-brand-text-muted mt-2">Follow your weekly action plan and watch your score climb.</p></div>
            </div>
        </div>
      </section>
      
      {/* SECTION 8: GROWTH SCORE (Dark) */}
      <section className="py-24 sm:py-32 px-4 bg-brand-darker">
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-5xl font-bold text-white">Track your progress with one number.</h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-400">
            Your Growth Score (0-100) combines three critical metrics: Visibility (can customers find you?), Trust (do they believe you?), and Activity (are you showing up consistently?). Complete weekly tasks to improve your score and outrank competitors.
            </p>
            <div className="mt-12 inline-block relative">
            <div style={{background: 'conic-gradient(#8B5CF6 0% 33%, #3B82F6 33% 66%, #06B6D4 66% 100%)'}} className="w-48 h-48 rounded-full flex items-center justify-center">
                <div className="w-44 h-44 rounded-full bg-brand-darker flex items-center justify-center flex-col">
                    <span className="text-5xl font-bold text-white">72</span>
                    <span className="text-sm text-gray-400">Growth Score</span>
                </div>
            </div>
            </div>
            <div className="mt-8"><button onClick={() => navigate('/login')} className="bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-3 px-8 rounded-lg transition-opacity duration-300 text-lg shadow-lg shadow-accent-purple/20">Get Your Growth Score</button></div>
        </div>
      </section>
      
      {/* SECTION 9: PRICING (Light) */}
      <section className="py-24 sm:py-32 px-4 bg-white text-brand-text">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold">One plan. Full access. No confusion.</h2>
          <p className="mt-6 text-lg text-brand-text-muted">Everything you need to grow your local business—no feature gates, no tier confusion.</p>
          <div className="mt-16 bg-white p-8 sm:p-12 rounded-2xl border-2 border-accent-purple shadow-2xl shadow-accent-purple/20 glow-card glow-card-rounded-2xl">
            <h3 className="text-2xl font-bold text-brand-text">Full JetSuite Access</h3>
            <p className="mt-4 text-6xl sm:text-7xl font-extrabold text-brand-text">$149<span className="text-2xl font-medium text-brand-text-muted">/month</span></p>
            <ul className="mt-8 space-y-4 max-w-sm mx-auto text-left text-brand-text-muted">
              <li className="flex items-center"><CheckCircleIcon className="w-6 h-6 text-accent-cyan mr-3 flex-shrink-0" /> JetViz website analyzer</li>
              <li className="flex items-center"><CheckCircleIcon className="w-6 h-6 text-accent-cyan mr-3 flex-shrink-0" /> Jet Local Optimizer</li>
              <li className="flex items-center"><CheckCircleIcon className="w-6 h-6 text-accent-cyan mr-3 flex-shrink-0" /> Growth Score tracking</li>
              <li className="flex items-center"><CheckCircleIcon className="w-6 h-6 text-accent-cyan mr-3 flex-shrink-0" /> Weekly action plans</li>
              <li className="flex items-center"><CheckCircleIcon className="w-6 h-6 text-accent-cyan mr-3 flex-shrink-0" /> 1 business profile & 1 team member</li>
            </ul>
            <button onClick={() => navigate('/pricing')} className="mt-10 w-full sm:w-auto bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-4 px-12 rounded-lg transition-opacity duration-300 text-xl shadow-2xl shadow-accent-purple/20">Start Your 1st Business Profile</button>
            <p className="mt-4 text-sm text-gray-500">Free tools available—no credit card required to try</p>
          </div>
          <h3 className="mt-16 text-2xl font-bold text-brand-text">Scale as you grow</h3>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 glow-card glow-card-rounded-xl"><h4 className="text-lg font-bold text-brand-text">Additional Businesses</h4><p className="text-4xl font-bold text-brand-text mt-2">+$49<span className="text-lg font-medium text-brand-text-muted">/mo</span></p><p className="text-brand-text-muted mt-2">Perfect for multi-location or agencies.</p></div>
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 glow-card glow-card-rounded-xl"><h4 className="text-lg font-bold text-brand-text">Additional Team Members</h4><p className="text-4xl font-bold text-brand-text mt-2">+$15<span className="text-lg font-medium text-brand-text-muted">/mo</span></p><p className="text-brand-text-muted mt-2">Give your team access to collaborate.</p></div>
          </div>
        </div>
      </section>

      {/* SECTION 10: TESTIMONIALS (Dark) */}
      <section className="py-24 sm:py-32 px-4 bg-brand-darker">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-bold text-white text-center">What local business owners are saying</h2>
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <TestimonialCard quote="JetSuite found issues three other agencies missed. Finally have a clear path forward." author="Mark P." role="Plumbing Contractor, Loganville, GA" />
            <TestimonialCard quote="The weekly tasks keep me focused. My Google ranking has already jumped from page 3 to page 1." author="Dr. Sarah K." role="Dentist, Monroe, GA" />
            <TestimonialCard quote="I love being able to track my own progress with the Growth Score. It's motivating and simple." author="David L." role="Real Estate Agent, Winder, GA" />
          </div>
        </div>
      </section>
      
      {/* SECTION 11: FAQ (Light) */}
      <section className="py-24 sm:py-32 bg-white text-brand-text">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl sm:text-5xl font-bold text-center">Frequently Asked Questions</h2>
          <div className="mt-16 space-y-4">
            {faqs.map((faq, i) => <FaqItem key={i} question={faq.q} answer={faq.a} />)}
          </div>
        </div>
      </section>

      {/* SECTION 12: FINAL CTA (Dark) */}
      <section className="py-24 sm:py-32 px-4 text-center bg-brand-darker">
          <h2 className="text-4xl sm:text-5xl font-bold text-white">Ready to stop guessing and start growing?</h2>
          <p className="mt-6 max-w-xl mx-auto text-lg text-gray-400">Get your free website and Google listing analysis in under 2 minutes.</p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/login')} className="w-full sm:w-auto bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-3 px-8 rounded-lg transition-opacity duration-300 text-lg shadow-lg shadow-accent-purple/20">
              Start Free Analysis
            </button>
            <button className="w-full sm:w-auto border-2 border-slate-600 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 text-lg">
              Talk to Our Team
            </button>
          </div>
      </section>
    </div>
  );
};
