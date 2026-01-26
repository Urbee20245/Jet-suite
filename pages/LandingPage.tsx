import React, { useEffect, useRef, useState } from 'react';
import { FaqItem } from '../components/marketing/FaqItem';
import { TestimonialCard } from '../components/marketing/TestimonialCard';
import { 
    EyeSlashIcon, 
    ExclamationTriangleIcon, 
    CreditCardIcon, 
    CheckCircleIcon, 
    StarIcon, 
    MapPinIcon, 
    RocketLaunchIcon, 
    BoltIcon,
    ChatBubbleLeftRightIcon
} from '../components/icons/MiniIcons';
import { 
    JetVizIcon, 
    JetBizIcon, 
    JetKeywordsIcon, 
    JetCreateIcon, 
    JetImageIcon, 
    JetReplyIcon, 
    JetTrustIcon, 
    GrowthPlanIcon,
    GrowthScoreIcon
} from '../components/icons/ToolIcons';

interface LandingPageProps {
  navigate: (path: string) => void;
}

const faqs = [
    { q: "How long to see results?", a: "Most businesses see initial ranking improvements within 30 days of completing their first Growth Plan tasks. Significant traffic growth typically accelerates around months 2-3." },
    { q: "Do I need marketing experience?", a: "None at all. JetSuite creates a simple weekly checklist for you. If a task requires technical skill, our system either does it for you or gives you copy-paste instructions." },
    { q: "Can I cancel anytime?", a: "Yes. There are no long-term contracts. You can cancel your subscription with two clicks in your dashboard settings at any time." },
    { q: "How many businesses can I manage?", a: "Your base subscription includes one business profile. You can add additional locations or businesses for just $99/month each from your dashboard." }
];

const testimonials = [
    {
        quote: "JetSuite found issues three other agencies missed. Finally have a clear path forward.",
        author: "Mark P.",
        role: "Plumbing Contractor",
        stars: 5,
        businessType: "Home Services"
    },
    {
        quote: "The weekly tasks keep me focused. My Google ranking has already jumped from page 3 to page 1.",
        author: "Dr. Sarah K.",
        role: "Dentist",
        stars: 5,
        businessType: "Healthcare"
    },
    {
        quote: "Saved me over $2,000/month in agency fees. The AI content generator alone is worth it.",
        author: "Lisa M.",
        role: "Boutique Owner",
        stars: 5,
        businessType: "Retail"
    },
    {
        quote: "I love being able to track my own progress with the Growth Score. It's motivating and simple.",
        author: "David L.",
        role: "Real Estate Agent",
        stars: 5,
        businessType: "Real Estate"
    },
    {
        quote: "My Google reviews went from 3.2 to 4.8 stars in just 3 months. JetReply is a game-changer.",
        author: "James R.",
        role: "Restaurant Owner",
        stars: 5,
        businessType: "Food & Beverage"
    },
    {
        quote: "As a solo lawyer, I don't have time for marketing. JetSuite does it all for me automatically.",
        author: "Robert T.",
        role: "Attorney",
        stars: 5,
        businessType: "Legal Services"
    },
    {
        quote: "Went from 2 to 12 leads per week. The Growth Plan actually tells me what to do each week.",
        author: "Maria S.",
        role: "Fitness Trainer",
        stars: 5,
        businessType: "Fitness"
    },
    {
        quote: "Finally an all-in-one tool that works. Canceled 4 different subscriptions and saved $400/month.",
        author: "Tom W.",
        role: "Contractor",
        stars: 5,
        businessType: "Construction"
    }
];

const VIDEO_URL = "https://medicarefor65.s3.amazonaws.com/2026/01/26125639/Local-Business-optimization-Keyword-Research-Website-Analysis-Social-Poster-Customer-Engagement-Keyword-Analysis-MORE.mp4";
const COVER_IMAGE_URL = "https://medicarefor65.s3.amazonaws.com/2026/01/26165442/Jetcover.png"; // New absolute URL

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const [starsAnimated, setStarsAnimated] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showVideo, setShowVideo] = useState(false); // NEW STATE for video playback

  
  // Handle video placeholder click
  const handleVideoClick = () => {
    setShowVideo(true);
  };

  // Animation for stars in testimonials
  useEffect(() => {
    const timer = setTimeout(() => setStarsAnimated(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll testimonials
  useEffect(() => {
    if (!testimonialsRef.current || isPaused) return;

    const container = testimonialsRef.current;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    let scrollPosition = 0;
    let direction = 1;
    const speed = 0.5; // pixels per frame

    const scroll = () => {
      if (isPaused) return;
      
      scrollPosition += speed * direction;
      
      // Reverse direction at ends
      if (scrollPosition >= scrollWidth - clientWidth) {
        direction = -1;
      } else if (scrollPosition <= 0) {
        direction = 1;
      }
      
      container.scrollLeft = scrollPosition;
      requestAnimationFrame(scroll);
    };

    const animationId = requestAnimationFrame(scroll);
    
    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  // Scroll animation observer
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
        }
      });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('.section-animate').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-brand-darker text-gray-300 overflow-x-hidden font-sans">
      
      {/* 1. HERO SECTION - ENHANCED */}
      <section className="relative pt-20 pb-24 sm:pt-32 sm:pb-32 px-4 overflow-hidden section-animate">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02] bg-grid-pattern"></div>
        
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -z-10 opacity-50 animate-pulse-subtle"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] -z-10 opacity-30"></div>

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12">
            {/* Left Column: Text Content */}
            <div className="lg:w-1/2 w-full text-left">
              {/* Compact Trust Badge with Shield */}
              <div className="relative inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/40 border border-slate-700/50 text-slate-300 text-sm font-medium mb-8 group overflow-hidden">
                
                {/* Subtle Animated Background */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-transparent to-teal-900/10 animate-gradient-background"></div>
                </div>
                
                {/* Shield Icon with Tiny Glow */}
                <div className="relative">
                  <div className="absolute -inset-1 bg-blue-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <svg className="relative w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                </div>
                
                {/* Text */}
                <span className="relative">
                  Trusted by <span className="font-semibold text-white">360+</span> local businesses
                </span>
                
                {/* Live Indicator Dot */}
                <div className="relative ml-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                </div>
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight mb-8">
                  Get Found First on Google.
                  <br className="hidden md:block"/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                      Get More Customers.
                  </span>
              </h1>
              
              <p className="mt-6 max-w-2xl text-lg sm:text-xl md:text-2xl text-gray-400 leading-relaxed">
                  Start your subscription today.
                  JetSuite is the AI platform that helps you improve Google rankings, manage reputation, and power on-brand content and advertising — so customers find you and choose you first.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
                  <button 
                    onClick={() => navigate('/get-started')} 
                    className="glow-card glow-card-rounded-xl w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 text-lg shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 relative"
                    aria-label="Start Subscription"
                  >
                      Start Subscription
                  </button>
                  <button 
                    onClick={handleVideoClick}
                    className="glow-card glow-card-rounded-xl w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 text-lg border border-slate-700"
                    aria-label="Watch 2 minute demo video"
                  >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      Watch 2-Min Demo
                  </button>
              </div>
              
              {/* Trial Disclosure */}
              <p className="text-sm text-gray-500 mt-4">
                Cancel anytime. No long-term contracts.
              </p>

              {/* Trust Badges */}
              <div className="mt-12 flex flex-wrap items-center gap-6 text-sm text-gray-500">
                <span>Featured in:</span>
                <div className="flex items-center gap-4 opacity-70">
                  <span className="font-semibold text-gray-400">Forbes</span>
                  <span className="text-gray-500">•</span>
                  <span className="font-semibold text-gray-400">TechCrunch</span>
                  <span className="text-gray-500">•</span>
                  <span className="font-semibold text-gray-400">Entrepreneur</span>
                </div>
              </div>

              {/* NEW: Client Avatar Trust Bar */}
              <div className="mt-10 pt-8 border-t border-slate-800/50 w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3 flex-shrink-0">
                      {/* Client Avatars - Using your 5 images */}
                      {[
                        '/GJSCLIENT1.png',
                        '/GJSCLIENT2.png', 
                        '/GJSCLIENT3.png',
                        '/GJSCLIENT4.png',
                        '/GJSCLIENT5.png'
                      ].map((avatar, index) => (
                        <img 
                          key={index}
                          src={avatar}
                          alt={`Jet Suite Client ${index + 1}`}
                          className="w-12 h-12 rounded-full border-3 border-slate-900 shadow-lg object-cover hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                          style={{
                            zIndex: 5 - index // Ensures proper stacking
                          }}
                        />
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map((i) => (
                          <svg 
                            key={i} 
                            className="w-4 h-4 fill-yellow-400 text-yellow-400" 
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                          </svg>
                        ))}
                        <span className="ml-2 text-sm font-bold text-white">5.0</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Rated <span className="font-semibold text-white">5.0/5.0</span> by local businesses
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block h-10 w-px bg-slate-700"></div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center border border-blue-500/30">
                      <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">100%</div>
                      <div className="text-sm text-gray-400">Client Satisfaction</div>
                    </div>
                  </div>
                </div>
                
                {/* Industry Breakdown */}
                <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-gray-500">Trusted across industries:</span>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full border border-blue-700/30">Plumbing</span>
                    <span className="px-3 py-1 bg-teal-900/30 text-teal-300 rounded-full border border-teal-700/30">Healthcare</span>
                    <span className="px-3 py-1 bg-purple-900/30 text-purple-300 rounded-full border border-purple-700/30">Retail</span>
                    <span className="px-3 py-1 bg-amber-900/30 text-amber-300 rounded-full border border-amber-700/30">Legal</span>
                    <span className="px-3 py-1 bg-pink-900/30 text-pink-300 rounded-full border border-pink-700/30">Fitness</span>
                    <span className="px-3 py-1 bg-indigo-900/30 text-indigo-300 rounded-full border border-indigo-700/30">Home Based</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Video */}
            <div className="lg:w-1/2 w-full max-w-2xl mx-auto lg:mx-0">
                <div 
                  ref={videoRef}
                  onClick={!showVideo ? handleVideoClick : undefined}
                  className="glow-card glow-card-rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden aspect-video group relative"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleVideoClick()}
                  aria-label="Play demo video: See how JetSuite works"
                >
                    {showVideo ? (
                        <video 
                            src={VIDEO_URL} 
                            controls 
                            autoPlay 
                            loop 
                            muted 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <>
                            {/* Video Cover Image */}
                            <img 
                                src={COVER_IMAGE_URL} 
                                alt="JetSuite Demo Video Cover" 
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            
                            {/* Dark Overlay for contrast */}
                            <div className="absolute inset-0 bg-black/40"></div> 

                            {/* Play Button */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-24 h-24 rounded-full bg-white/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300 relative z-10">
                                    <div className="w-0 h-0 border-t-[16px] border-b-[16px] border-l-[24px] border-transparent border-l-blue-600 ml-2"></div>
                                </div>
                            </div>
                            
                            {/* Video Stats Overlay */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white py-2 px-6 rounded-full text-sm font-medium border border-white/20 group-hover:bg-black/80 transition-colors z-10">
                                See how it works in 2 minutes
                            </div>
                        </>
                    )}
                </div>
                <p className="text-center text-gray-500 text-sm mt-4">See how JetSuite works for businesses like yours</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM SECTION */}
      <section className="section-animate py-24 px-4 bg-[#0B1121]">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Is Your Online Presence Costing You Customers?</h2>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                    JetSuite replaces your entire marketing stack with one intelligent platform.
                </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="glow-card glow-card-rounded-2xl bg-slate-800/30 p-8 rounded-2xl border border-slate-700">
                    <div className="bg-red-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                        <EyeSlashIcon className="w-7 h-7 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Invisible to Searchers</h3>
                    <p className="text-gray-400 leading-relaxed">
                        88% of local searches visit a business within 24 hours. If you're not on page 1, you're missing out on ready-to-buy customers.
                    </p>
                </div>

                <div className="glow-card glow-card-rounded-2xl bg-slate-800/30 p-8 rounded-2xl border border-slate-700">
                    <div className="bg-yellow-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                        <ExclamationTriangleIcon className="w-7 h-7 text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Tool Overload</h3>
                    <p className="text-gray-400 leading-relaxed">
                        Managing 10+ different tools for SEO, reviews, and content is overwhelming. You end up paying for tools you don't have time to use.
                    </p>
                </div>

                <div className="glow-card glow-card-rounded-2xl bg-slate-800/30 p-8 rounded-2xl border border-slate-700">
                    <div className="bg-blue-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                        <CreditCardIcon className="w-7 h-7 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Expensive Agencies</h3>
                    <p className="text-gray-400 leading-relaxed">
                        Hiring agencies costs $5,000+/month with no guaranteed results. You pay whether you grow or not.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* 3. VALUE PROPOSITION GRID */}
      <section className="section-animate py-24 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white">Everything You Need to Dominate Local Search</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                <div className="glow-card glow-card-rounded-xl p-6 bg-brand-darker rounded-xl border-t-4 border-blue-500 shadow-xl">
                    <div className="mb-4"><JetVizIcon className="w-10 h-10 text-blue-500"/></div>
                    <h3 className="text-xl font-bold text-white mb-2">Analyze & Diagnose</h3>
                    <p className="text-gray-400 text-sm">Audit your Google Business Profile, website, and competitors instantly.</p>
                </div>
                <div className="glow-card glow-card-rounded-xl p-6 bg-brand-darker rounded-xl border-t-4 border-teal-400 shadow-xl">
                    <div className="mb-4"><JetCreateIcon className="w-10 h-10 text-teal-400"/></div>
                    <h3 className="text-xl font-bold text-white mb-2">Create & Publish</h3>
                    <p className="text-gray-400 text-sm">AI generates your marketing content, images, and ads in seconds.</p>
                </div>
                <div className="glow-card glow-card-rounded-xl p-6 bg-brand-darker rounded-xl border-t-4 border-purple-500 shadow-xl">
                    <div className="mb-4"><ChatBubbleLeftRightIcon className="w-10 h-10 text-purple-500"/></div>
                    <h3 className="text-xl font-bold text-white mb-2">Engage & Convert</h3>
                    <p className="text-gray-400 text-sm">Manage reviews, capture leads, and build trust automatically.</p>
                </div>
                <div className="glow-card glow-card-rounded-xl p-6 bg-brand-darker rounded-xl border-t-4 border-pink-500 shadow-xl">
                    <div className="mb-4"><RocketLaunchIcon className="w-10 h-10 text-pink-500"/></div>
                    <h3 className="text-xl font-bold text-white mb-2">Execute & Grow</h3>
                    <p className="text-gray-400 text-sm">Weekly prioritized action plan that actually gets done.</p>
                </div>
            </div>
        </div>
      </section>
    
      {/* "VIEW ALL TOOLS" BUTTON SECTION */}
      <section className="section-animate py-12 px-4 bg-slate-900 border-y border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-300 text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Complete Marketing Platform
          </div>
          
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            See Everything JetSuite Can Do
          </h3>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Get instant access to all 20+ AI-powered tools that handle your entire online presence.
          </p>
          
          <button 
            onClick={() => navigate('/features')}
            className="glow-card glow-card-rounded-xl group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 text-lg shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40"
            aria-label="View all 20+ tools available in JetSuite"
          >
            <span>View All 20+ Tools</span>
            <span className="group-hover:translate-x-2 transition-transform">→</span>
          </button>
          
          <p className="text-gray-500 text-sm mt-4">
           See complete tool breakdowns • Learn what each feature does
          </p>
        </div>
      </section>
    
      {/* 4. FEATURES SHOWCASE - WITH YOUR ANIMATIONS */}
      <section className="section-animate py-24 px-4 bg-[#0B1121]">
        <div className="max-w-6xl mx-auto space-y-20">
            {/* Foundation Tools */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <span className="text-blue-500 font-bold uppercase tracking-wider text-sm">Foundation</span>
                    <h3 className="text-3xl font-bold text-white mt-2 mb-6">Build a Rock-Solid Presence</h3>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="bg-slate-800 p-3 rounded-lg h-fit"><JetBizIcon className="w-6 h-6 text-white"/></div>
                            <div>
                                <h4 className="font-bold text-white">JetBiz</h4>
                                <p className="text-gray-400 text-sm">Optimize your Google Business Profile for higher ranking.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-slate-800 p-3 rounded-lg h-fit"><JetVizIcon className="w-6 h-6 text-white"/></div>
                            <div>
                                <h4 className="font-bold text-white">JetViz</h4>
                                <p className="text-gray-400 text-sm">Deep-dive AI website audit with specific technical fixes.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-slate-800 p-3 rounded-lg h-fit"><JetKeywordsIcon className="w-6 h-6 text-white"/></div>
                            <div>
                                <h4 className="font-bold text-white">JetKeywords</h4>
                                <p className="text-gray-400 text-sm">Find profitable local search terms your competitors missed.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="glow-card glow-card-rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border border-slate-700 relative">
                     <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full"></div>
                     <div className="relative z-10 space-y-4">
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center hover:border-blue-500/50 transition-colors">
                            <span className="text-white font-medium">Google Profile Health</span>
                            <div className="flex items-center gap-2">
                                <span className="text-green-400 font-bold">94/100</span>
                                <div className="h-2 w-16 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full w-[94%] bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                         <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center hover:border-yellow-500/50 transition-colors">
                            <span className="text-white font-medium">Website Performance</span>
                            <div className="flex items-center gap-2">
                                <span className="text-yellow-400 font-bold">72/100</span>
                                <div className="h-2 w-16 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full w-[72%] bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                         <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center hover:border-blue-400/50 transition-colors">
                            <span className="text-white font-medium">Keyword Opportunities</span>
                            <div className="flex items-center gap-3">
                                <span className="text-blue-400 font-bold">12 Found</span>
                                <div className="relative">
                                    <div className="w-6 h-6 bg-blue-900/50 rounded-full flex items-center justify-center">
                                        <span className="text-xs text-blue-300">+3</span>
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                     </div>
                </div>
            </div>

            {/* Creation Tools - ENHANCED with your animations */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="glow-card glow-card-rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border border-slate-700 relative overflow-hidden">
                    <div className="absolute -right-20 -top-20 bg-teal-500/20 w-64 h-64 blur-3xl rounded-full"></div>
                    
                    {/* Animated AI Content Generator */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg flex items-center justify-center ai-thinking">
                                    <BoltIcon className="w-6 h-6 text-white" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-400 rounded-full">
                                    <div className="absolute inset-0 animate-ping bg-teal-400 rounded-full"></div>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-white font-bold">JetCreate AI</h4>
                                <p className="text-xs text-teal-300">Generating content...</p>
                            </div>
                        </div>
                        
                        {/* AI Thinking Animation */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse"></div>
                                <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse delay-150"></div>
                                <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse delay-300"></div>
                                <span className="text-xs text-teal-300 ml-2">AI is thinking</span>
                            </div>
                            
                            {/* Typing Animation Container */}
                            <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-700 min-h-[120px]">
                                <div className="typing-demo">
                                    <span className="text-teal-300 font-mono text-sm">Creating social post about:</span>
                                    <div className="text-white font-medium mt-2 flex items-center">
                                        <span className="typing-text">"Summer plumbing special - 20% off water heater installs"</span>
                                        <span className="typing-cursor animate-pulse">|</span>
                                    </div>
                                    <div className="mt-4 text-gray-400 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1 w-16 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full w-3/4 bg-teal-500 rounded-full animate-progress"></div>
                                            </div>
                                            <span>Optimizing for local SEO...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Generated Content Preview Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="ai-content-card bg-slate-950 p-3 rounded-lg border border-slate-700 group">
                                <div className="flex items-center justify-between mb-2">
                                    <JetCreateIcon className="w-5 h-5 text-teal-400" />
                                    <span className="ai-status-ready text-xs bg-teal-500/20 text-teal-300 px-2 py-1 rounded">Ready</span>
                                </div>
                                <div className="text-center">
                                    <span className="text-xs text-gray-400 block">Social Post</span>
                                    <div className="mt-1 h-6 w-full bg-slate-800 rounded animate-pulse group-hover:bg-slate-700"></div>
                                </div>
                            </div>
                            
                            <div className="ai-content-card bg-slate-950 p-3 rounded-lg border border-slate-700 group">
                                <div className="flex items-center justify-between mb-2">
                                    <JetImageIcon className="w-5 h-5 text-purple-400" />
                                    <span className="ai-status-ready text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">Ready</span>
                                </div>
                                <div className="text-center">
                                    <span className="text-xs text-gray-400 block">Ad Creative</span>
                                    <div className="mt-1 h-6 w-full bg-slate-800 rounded animate-pulse group-hover:bg-slate-700"></div>
                                </div>
                            </div>
                            
                            <div className="col-span-2 bg-gradient-to-r from-slate-900 to-slate-950 p-3 rounded-lg border border-slate-700 mt-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Next up:</span>
                                    <span className="text-xs text-blue-300">Email newsletter</span>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full w-1/3 bg-blue-500 rounded-full"></div>
                                    </div>
                                    <span className="text-xs text-gray-500">33%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <span className="text-teal-400 font-bold uppercase tracking-wider text-sm">Creation</span>
                    <h3 className="text-3xl font-bold text-white mt-2 mb-6">Never Run Out of Content</h3>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="bg-gradient-to-br from-teal-500/20 to-teal-600/10 p-3 rounded-lg h-fit border border-teal-500/30">
                                <JetCreateIcon className="w-6 h-6 text-teal-400"/>
                            </div>
                            <div>
                                <h4 className="font-bold text-white">JetCreate ⭐</h4>
                                <p className="text-gray-400 text-sm">Your AI creative director that writes posts, emails, and ads in seconds.</p>
                                <div className="mt-2 flex items-center gap-2 text-xs">
                                    <span className="text-teal-300">• Auto-optimizes for SEO</span>
                                    <span className="text-teal-300">• Writes in your brand voice</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 p-3 rounded-lg h-fit border border-purple-500/30">
                                <JetImageIcon className="w-6 h-6 text-purple-400"/>
                            </div>
                            <div>
                                <h4 className="font-bold text-white">JetImage</h4>
                                <p className="text-gray-400 text-sm">Generate custom, on-brand images instantly. No design skills needed.</p>
                                <div className="mt-2 flex items-center gap-2 text-xs">
                                    <span className="text-purple-300">• Creates social media graphics</span>
                                    <span className="text-purple-300">• Generates ad visuals</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Engagement Tools - ENHANCED with your animations */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <span className="text-purple-500 font-bold uppercase tracking-wider text-sm">Engagement</span>
                    <h3 className="text-3xl font-bold text-white mt-2 mb-6">Turn Visitors into Loyal Customers</h3>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/10 p-3 rounded-lg h-fit border border-purple-500/30">
                                <JetReplyIcon className="w-6 h-6 text-purple-400"/>
                            </div>
                            <div>
                                <h4 className="font-bold text-white">JetReply</h4>
                                <p className="text-gray-400 text-sm">AI-crafted responses to all your reviews in one click.</p>
                                <div className="mt-2 flex items-center gap-2 text-xs">
                                    <span className="text-purple-300">• Maintains brand voice</span>
                                    <span className="text-purple-300">• Saves 10+ hours/week</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-gradient-to-br from-pink-500/20 to-rose-600/10 p-3 rounded-lg h-fit border border-pink-500/30">
                                <JetTrustIcon className="w-6 h-6 text-pink-400"/>
                            </div>
                            <div>
                                <h4 className="font-bold text-white">JetTrust</h4>
                                <p className="text-gray-400 text-sm">Showcase your best reviews on your website to build trust.</p>
                                <div className="mt-2 flex items-center gap-2 text-xs">
                                    <span className="text-pink-300">• Increases conversion by 45%</span>
                                    <span className="text-pink-300">• Updates automatically</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="glow-card glow-card-rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border border-slate-700 relative">
                  <div className="space-y-6">
                    {/* Animated Review Stream */}
                    <div className="relative review-pulse">
                      <div className="absolute -top-3 -left-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <ChatBubbleLeftRightIcon className="w-3 h-3 text-white" />
                      </div>
                      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-700 sentiment-glow">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon 
                                key={i} 
                                className={`w-4 h-4 text-yellow-400 fill-yellow-400 ${starsAnimated ? 'star-pop' : ''}`}
                                style={{ animationDelay: `${i * 0.1}s` }}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">New review • Just now</span>
                        </div>
                        <p className="text-sm text-white">"The service was incredible. Highly recommend to everyone in the area!"</p>
                        <div className="mt-3 flex items-center gap-2 text-xs">
                          <span className="text-gray-500">Sentiment:</span>
                          <span className="text-green-400 font-medium">Very Positive</span>
                          <div className="h-1 w-16 bg-slate-700 rounded-full overflow-hidden ml-auto">
                            <div className="h-full w-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Response Animation */}
                    <div className="relative">
                      <div className="absolute -top-3 -left-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-900/30 to-slate-900/30 p-4 rounded-xl border border-blue-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-blue-300 font-medium">AI Suggested Reply</span>
                          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">Generating...</span>
                        </div>
                        
                        {/* AI Typing Response - using your typing-wave animation */}
                        <div className="typing-wave space-y-2">
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                            <div className="h-2 w-12 bg-blue-400/30 rounded-full"></div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                            <div className="h-2 w-20 bg-blue-400/30 rounded-full"></div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                            <div className="h-2 w-16 bg-blue-400/30 rounded-full"></div>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-blue-500/20">
                          <div className="text-xs text-blue-200 opacity-70 flex items-center justify-between">
                            <span className="brand-pulse">Personalized for: Plumbing business</span>
                            <span className="text-blue-300">✓ Brand voice matched</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Trust Score Visualization with Animation - COMPLETE FIX */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-green-500/30 transition-colors duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-white font-medium">Trust Score Impact</span>
                        <span className="trust-percent-badge text-xs font-bold bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-300 px-3 py-1 rounded-full border border-green-500/30">
                          +45% Increase
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Before JetTrust: <span 
                          className="text-red-300">2.8%</span></span>
                          <span className="text-gray-400">After JetTrust: <span className="text-green-300 font-medium">4.1%</span></span>
                        </div>
                        
                        {/* Animated Progress Bar */}
                        <div className="relative">
                          <div className="h-10 rounded-lg bg-slate-800 overflow-hidden relative">
                            {/* Background bar showing full width */}
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-700/50 to-slate-800/50"></div>
                            
                            {/* Animated fill bar */}
                            <div className="h-full trust-increase-animated rounded-lg"></div>
                            
                            {/* Animated percentage text - BOTH BEFORE AND AFTER */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="relative h-5 w-12">
                                <span className="trust-number-animated text-xs font-bold text-white"></span>
                              </div>
                            </div>
                            
                            {/* Marker points */}
                            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-green-500/30 z-0">
                              <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                              <div className="absolute bottom-0 -left-1 w-2 h-2 rounded-full bg-green-500"></div>
                            </div>
                          </div>
                          
                          {/* Labels */}
                          <div className="flex justify-between mt-2 text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              <span className="text-red-300">Low Trust</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                              <span className="text-green-300 font-medium">High Conversion</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Color Legend */}
                        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-red-300">2.8% Start</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-green-500"></div>
                            <span className="text-yellow-300">Transition</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-green-300">4.1% Target</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="section-animate py-24 px-4 bg-slate-900">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-16">Your Path to More Customers in 10 Minutes/Day</h2>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-1 bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 -z-10"></div>
            
            <div className="glow-card glow-card-rounded-2xl bg-brand-darker p-8 rounded-2xl border border-slate-800 relative group">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-blue-600/30 text-2xl font-bold ring-8 ring-brand-darker">
                <BoltIcon className="w-8 h-8"/>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">1. Connect & Analyze</h3>
              <p className="text-gray-400">Connect your business. Our AI audits everything in minutes.</p>
            </div>
            
            <div className="glow-card glow-card-rounded-2xl bg-brand-darker p-8 rounded-2xl border border-slate-800 relative group">
              <div className="bg-teal-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-teal-500/30 text-2xl font-bold ring-8 ring-brand-darker">
                <CheckCircleIcon className="w-8 h-8"/>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">2. Execute Tasks</h3>
              <p className="text-gray-400">Complete 3-5 simple weekly actions from your Growth Plan.</p>
            </div>
            
            <div className="glow-card glow-card-rounded-2xl bg-brand-darker p-8 rounded-2xl border border-slate-800 relative group">
              <div className="bg-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-purple-500/30 text-2xl font-bold ring-8 ring-brand-darker">
                <GrowthScoreIcon className="w-8 h-8"/>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">3. Track Growth</h3>
              <p className="text-gray-400">Watch your Google ranking, reviews, and leads increase.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PRICING & VALUE SHOCK */}
      <section className="section-animate py-24 px-4 bg-[#0B1121]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Replace $15,000/Month in Services</h2>
            <p className="text-xl text-gray-400">Get the power of an entire agency for less than the cost of lunch.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Comparison Table */}
            <div className="glow-card glow-card-rounded-2xl bg-slate-800/20 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                <h3 className="text-lg font-bold text-white">The Old Way (Hiring Pros)</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-gray-400">Web Design Agency</span>
                  <span className="text-white font-mono">$2,000-5,000/mo</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-gray-400">Graphic Designer</span>
                  <span className="text-white font-mono">$1,000-3,000/mo</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-gray-400">SEO Consultant</span>
                  <span className="text-white font-mono">$1,000-3,000/mo</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-gray-400">Content Writer</span>
                  <span className="text-white font-mono">$500-2,000/mo</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">Review Management</span>
                  <span className="text-white font-mono">$200-800/mo</span>
                </div>
                <div className="bg-red-900/20 p-4 rounded-lg flex justify-between items-center mt-4">
                  <span className="text-red-200 font-bold">Total Cost</span>
                  <span className="text-red-300 font-bold font-mono text-xl">$5,000 - $16,000/mo</span>
                </div>
              </div>
            </div>

            {/* JetSuite Pricing Card */}
            <div className="relative glow-card glow-card-rounded-2xl bg-gradient-to-b from-blue-900 to-slate-900 rounded-2xl border border-blue-500 shadow-2xl shadow-blue-900/50 p-8 text-center overflow-hidden transform md:scale-105">
              <div className="absolute top-0 left-0 w-full h-2 gradient-border-animated"></div>
              <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/30 brand-pulse">
                BEST VALUE
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Complete Platform</h3>
              <div className="flex items-baseline justify-center my-8">
                <span className="text-6xl font-extrabold text-white">$149</span>
                <span className="text-xl text-gray-400 ml-2">/month</span>
              </div>
              
              <ul className="text-left space-y-4 mb-8 max-w-xs mx-auto text-gray-300">
                <li className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-teal-400 mr-3 shrink-0"/> All 20+ Tools Included</li>
                <li className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-teal-400 mr-3 shrink-0"/> Unlimited Usage</li>
                <li className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-teal-400 mr-3 shrink-0"/> No Contracts</li>
                <li className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-teal-400 mr-3 shrink-0"/> Transparent Pricing</li>
              </ul>
              
              <button onClick={() => navigate('/get-started')} 
                className="glow-card glow-card-rounded-xl w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 text-lg shadow-lg mb-4 relative"
                aria-label="Start Subscription">
                Start Subscription
              </button>
              <p className="text-xs text-gray-500">Cancel anytime. No long-term contracts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SOCIAL PROOF - SCROLLING TESTIMONIALS */}
      <section className="section-animate py-24 px-4 bg-brand-darker">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-bold text-white text-center mb-16">What Local Business Owners Are Saying</h2>
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-slate-800/30 p-4 rounded-xl text-center">
              <div className="text-3xl font-bold text-white">360+</div>
              <div className="text-sm text-gray-400">Businesses</div>
            </div>
            <div className="bg-slate-800/30 p-4 rounded-xl text-center">
              <div className="text-3xl font-bold text-white">4.9★</div>
              <div className="text-sm text-gray-400">Avg Rating</div>
            </div>
            <div className="bg-slate-800/30 p-4 rounded-xl text-center">
              <div className="text-3xl font-bold text-white">94%</div>
              <div className="text-sm text-gray-400">Satisfaction</div>
            </div>
            <div className="bg-slate-800/30 p-4 rounded-xl text-center">
              <div className="text-3xl font-bold text-white">$5K+</div>
              <div className="text-sm text-gray-400">Monthly Savings</div>
            </div>
          </div>

          {/* Scrolling Testimonials Container */}
          <div className="relative">
            {/* Gradient Overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-brand-darker to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-brand-darker to-transparent z-10 pointer-events-none"></div>
            
            {/* Scrolling Testimonials */}
            <div 
              ref={testimonialsRef}
              className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Duplicate testimonials for seamless scrolling */}
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <div 
                  key={index} 
                  className="flex-shrink-0 w-80 md:w-96 bg-slate-800/30 p-6 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-colors duration-300"
                >
                  {/* Stars */}
                  <div className="flex mb-4">
                    {[...Array(testimonial.stars)].map((_, i) => (
                      <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <p className="text-gray-300 text-lg italic mb-6">"{testimonial.quote}"</p>
                  
                  {/* Author Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white">{testimonial.author}</div>
                      <div className="text-sm text-gray-400">{testimonial.role}</div>
                      <div className="text-xs text-blue-400 mt-1">{testimonial.businessType}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Scroll Indicator */}
            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <div className="text-sm text-gray-500">Scroll horizontally to see more reviews</div>
              </div>
            </div>
          </div>

          {/* Static Testimonials Grid (Fallback for mobile) */}
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 md:hidden">
            <TestimonialCard 
              quote="JetSuite found issues three other agencies missed. Finally have a clear path forward." 
              author="Mark P." 
              role="Plumbing Contractor" 
            />
            <TestimonialCard 
              quote="The weekly tasks keep me focused. My Google ranking has already jumped from page 3 to page 1." 
              author="Dr. Sarah K." 
              role="Dentist" 
            />
            <TestimonialCard 
              quote="I love being able to track my own progress with the Growth Score. It's motivating and simple." 
              author="David L." 
              role="Real Estate Agent" 
            />
          </div>
        </div>
      </section>

      {/* 8. GROWTH SCORE */}
      <section className="section-animate py-24 px-4 bg-slate-900 border-y border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Track Your Progress With One Number</h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Your Growth Score (0-99) measures your online presence strength and shows exactly what to improve next.
          </p>
          
          <div className="relative inline-block">
            <div className="glow-card w-64 h-64 rounded-full border-[12px] border-slate-800 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border-[12px] border-blue-500 border-l-transparent rotate-45 animate-spin-slow"></div>
              <div className="text-center">
                <span className="block text-7xl font-bold text-white">82</span>
                <span className="block text-sm text-gray-400 uppercase tracking-widest mt-2">Excellent</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="section-animate py-24 px-4 bg-brand-darker">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-bold text-center text-white mb-16">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => <FaqItem key={i} question={faq.q} answer={faq.a} />)}
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="section-animate py-24 sm:py-32 px-4 text-center bg-gradient-to-br from-blue-900 via-slate-900 to-brand-darker relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-4xl sm:text-6xl font-extrabold text-white mb-6">Start Getting Found Today</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join 360+ local businesses growing with JetSuite. Start your subscription now.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/get-started')} 
              className="glow-card glow-card-rounded-xl w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 text-lg shadow-xl shadow-blue-600/30 relative"
              aria-label="Start Subscription">
              Start Subscription
            </button>
            <button 
              onClick={() => window.open("https://tidycal.com/team/jetsuit/jetsuite-demo", "_blank")}
              className="glow-card glow-card-rounded-xl w-full sm:w-auto bg-transparent border-2 border-slate-600 hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-xl transition-colors duration-300 text-lg"
              aria-label="Schedule a personalized demo with our team">
              Schedule a Personalized Demo
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Cancel anytime. No long-term contracts.
          </p>
        </div>
      </section>
      
    </div>
  );
};