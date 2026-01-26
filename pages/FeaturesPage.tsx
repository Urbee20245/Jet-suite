import React, { useState } from 'react';
import { 
    MagnifyingGlassIcon, 
    PaintBrushIcon, 
    ChatBubbleLeftRightIcon, 
    ChartBarIcon, 
    Squares2X2Icon,
    ArrowRightIcon,
    CheckCircleIcon,
    CheckIcon,
    XMarkIcon,
    LockClosedIcon,
    LockOpenIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from '@heroicons/react/24/outline';
import { 
    JetBizIcon, 
    JetVizIcon, 
    JetKeywordsIcon, 
    JetCreateIcon, 
    JetImageIcon, 
    JetReplyIcon, 
    JetTrustIcon,
    GrowthScoreIcon,
    JetAdsIcon,
    JetCompeteIcon,
    JetSocialIcon,
    JetContentIcon,
    JetLeadsIcon,
    JetEventsIcon,
    GrowthPlanIcon,
    AdminPanelIcon,
    ProfileIcon,
    JetProductIcon // Import the new icon
} from '../components/icons/ToolIcons';
import { FaqItem } from '../components/marketing/FaqItem';

interface FeaturesPageProps {
  navigate: (path: string) => void;
}

const ToolCard = ({ tool, onClick }: { tool: any, onClick: () => void }) => (
    <div onClick={onClick} className="group bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer h-full flex flex-col">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-lg ${tool.iconBg} text-white`}>
                <tool.icon className="w-6 h-6" />
            </div>
            {tool.featured && (
                <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-1 rounded-full border border-yellow-500/30">FEATURED</span>
            )}
        </div>
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{tool.name}</h3>
        <p className="text-sm font-semibold text-blue-400 mb-3">{tool.tagline}</p>
        <p className="text-gray-400 text-sm mb-4 flex-grow">{tool.brief}</p>
        
        <div className="mt-auto pt-4 border-t border-slate-700">
            <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Replaces:</span>
                <span className="text-gray-300 font-medium">{tool.replaces}</span>
            </div>
        </div>
    </div>
);

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ navigate }) => {
  const [activeCategory, setActiveCategory] = useState('foundation');

  const categories = [
    { id: 'foundation', name: 'Foundation', icon: MagnifyingGlassIcon },
    { id: 'create', name: 'Create & Publish', icon: PaintBrushIcon },
    { id: 'engage', name: 'Engage & Convert', icon: ChatBubbleLeftRightIcon },
    { id: 'growth', name: 'Growth & Strategy', icon: ChartBarIcon },
    { id: 'dashboard', name: 'Dashboard', icon: Squares2X2Icon },
  ];

  const tools = {
    foundation: [
        { 
            name: "JetBiz", 
            tagline: "Optimize Your Google Business Profile", 
            brief: "Audits your Google Business Profile, compares you to competitors, and finds specific ranking opportunities.", 
            replaces: "Local SEO Consultant ($1k/mo)",
            icon: JetBizIcon,
            iconBg: "bg-blue-600"
        },
        { 
            name: "JetViz", 
            tagline: "AI Website Audit & Fixes", 
            brief: "Analyzes homepage design, SEO, speed, mobile responsiveness, and trust signals in real-time.", 
            replaces: "SEO Audit Tools ($200/mo)",
            icon: JetVizIcon,
            iconBg: "bg-indigo-600"
        },
        { 
            name: "JetKeywords", 
            tagline: "Discover Profitable Local Search Terms", 
            brief: "Find high-intent keywords customers are searching for in your specific area right now.", 
            replaces: "Keyword Research Tools ($99/mo)",
            icon: JetKeywordsIcon,
            iconBg: "bg-cyan-600"
        },
        { 
            name: "JetCompete", 
            tagline: "Analyze & Beat Local Competitors", 
            brief: "Identify competitor strengths, find gaps you can exploit, and create counter-strategies.", 
            replaces: "Competitive Analysis Services",
            icon: JetCompeteIcon,
            iconBg: "bg-teal-600"
        }
    ],
    create: [
        { 
            name: "JetCreate", 
            tagline: "AI Creative Director", 
            brief: "Generates social posts, images, ad copy, headlines—everything for a campaign in one click.", 
            replaces: "Graphic Designer ($2k/mo)",
            icon: JetCreateIcon,
            iconBg: "bg-pink-600",
            featured: true
        },
        { 
            name: "JetSocial", 
            tagline: "Social Media Content Generator", 
            brief: "Creates platform-specific posts (Facebook, Instagram, LinkedIn) tailored to your brand voice.", 
            replaces: "Social Media Manager",
            icon: JetSocialIcon,
            iconBg: "bg-purple-600"
        },
        { 
            name: "JetContent", 
            tagline: "SEO-Optimized Blog Articles", 
            brief: "Writes long-form content for your website, optimized for your target local keywords.", 
            replaces: "Content Writers ($0.20/word)",
            icon: JetContentIcon,
            iconBg: "bg-fuchsia-600"
        },
        { 
            name: "JetImage", 
            tagline: "AI-Generated Marketing Images", 
            brief: "Creates custom visuals that match your brand colors and style instantly.", 
            replaces: "Stock Photos + Designer",
            icon: JetImageIcon,
            iconBg: "bg-rose-600"
        },
        { 
            name: "JetProduct", 
            tagline: "AI Product Mockup Generator", 
            brief: "Upload a product photo and generate professional, branded mockups for e-commerce and ads.", 
            replaces: "Product Photography & Designer",
            icon: JetProductIcon,
            iconBg: "bg-orange-600"
        }
    ],
    engage: [
        { 
            name: "JetReply", 
            tagline: "AI-Powered Review Responses", 
            brief: "Automatically fetches Google reviews, detects sentiment, and crafts professional responses.", 
            replaces: "Reputation Management ($500/mo)",
            icon: JetReplyIcon,
            iconBg: "bg-green-600"
        },
        { 
            name: "JetTrust", 
            tagline: "Review Widgets for Your Website", 
            brief: "Create embeddable review displays to build instant trust with website visitors.", 
            replaces: "Review Widget Tools ($50/mo)",
            icon: JetTrustIcon,
            iconBg: "bg-emerald-600"
        },
        { 
            name: "JetLeads", 
            tagline: "Find Customers Actively Searching", 
            brief: "Discovers public posts from people looking for your services in your area.", 
            replaces: "Lead Gen Services ($1k/mo)",
            icon: JetLeadsIcon,
            iconBg: "bg-lime-600"
        },
        { 
            name: "JetEvents", 
            tagline: "Local Event & Promotion Ideas", 
            brief: "Brainstorms creative events, seasonal promotions, and community engagement strategies.", 
            replaces: "Marketing Consultant",
            icon: JetEventsIcon,
            iconBg: "bg-amber-600"
        },
         { 
            name: "JetAds", 
            tagline: "High-Converting Ad Copy", 
            brief: "Generates Google/Facebook ad headlines, descriptions, and CTAs that convert.", 
            replaces: "Ad Copywriter",
            icon: JetAdsIcon,
            iconBg: "bg-orange-600"
        }
    ],
    growth: [
        { 
            name: "Growth Plan", 
            tagline: "Your Weekly Action Plan", 
            brief: "Takes tasks from all tools, prioritizes them, and gives you 3-5 simple weekly actions.", 
            replaces: "Project Manager",
            icon: GrowthPlanIcon,
            iconBg: "bg-red-600",
            featured: true
        }
    ],
    dashboard: [
        { 
            name: "Growth Score", 
            tagline: "Marketing Effectiveness Score", 
            brief: "0-99 score tracking your setup completion and task execution effectiveness.", 
            replaces: "Analytics Dashboards",
            icon: GrowthScoreIcon,
            iconBg: "bg-blue-500"
        },
         { 
            name: "Home Dashboard", 
            tagline: "Weekly Growth Command Center", 
            brief: "Shows current week's tasks, Growth Score, and priority actions at a glance.", 
            replaces: "Spreadsheets",
            icon: AdminPanelIcon,
            iconBg: "bg-slate-600"
        },
         { 
            name: "Business Details", 
            tagline: "Central Business Profile", 
            brief: "Store and update business info once that powers all other tools automatically.", 
            replaces: "Brand Guidelines Doc",
            icon: ProfileIcon,
            iconBg: "bg-gray-600"
        }
    ]
  };

  const scrollToSection = (id: string) => {
    setActiveCategory(id);
    const element = document.getElementById(id);
    if (element) {
        // Offset for sticky header
        const offset = 180; 
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
  };

  return (
    <div className="bg-brand-darker text-gray-300 font-sans overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -z-10"></div>

        <div className="max-w-4xl mx-auto relative z-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-8">
                20 Powerful Tools. <br className="hidden sm:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                    One Growth Platform.
                </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-400 leading-relaxed">
                Start your subscription today. Everything you need to dominate local search and grow your business.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => navigate('/get-started')} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 text-lg shadow-lg shadow-blue-600/25 relative">
                    Start Subscription
                </button>
                <button onClick={() => navigate('/pricing')} className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 text-lg border border-slate-700">
                    See Pricing & Value
                </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
                Cancel anytime. No long-term contracts.
            </p>
        </div>

        {/* Visual Collage Background (Subtle) */}
        <div className="mt-16 relative h-48 md:h-64 max-w-6xl mx-auto opacity-30 mask-image-b-0 pointer-events-none">
             <div className="grid grid-cols-4 gap-4 transform rotate-6 scale-110">
                 {[...Array(8)].map((_, i) => (
                     <div key={i} className="bg-slate-800 border border-slate-700 rounded-lg h-32 md:h-48 w-full"></div>
                 ))}
             </div>
             <div className="absolute inset-0 bg-gradient-to-t from-brand-darker via-transparent to-transparent"></div>
        </div>
      </section>

      {/* 2. STICKY CATEGORY NAV */}
      <div className="sticky top-20 z-40 bg-brand-darker/90 backdrop-blur-md border-y border-slate-800 shadow-xl overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-2 md:space-x-8 py-4 min-w-max">
                {categories.map((cat) => (
                    <button 
                        key={cat.id}
                        onClick={() => scrollToSection(cat.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${activeCategory === cat.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <cat.icon className="w-4 h-4" />
                        <span className="font-medium whitespace-nowrap">{cat.name}</span>
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* 3. FOUNDATION TOOLS */}
      <section id="foundation" className="py-24 px-4 bg-gradient-to-b from-brand-darker to-slate-900/50">
          <div className="max-w-7xl mx-auto">
              <div className="mb-12">
                  <span className="text-blue-500 font-bold uppercase tracking-wider text-sm">Foundation</span>
                  <h2 className="text-3xl font-bold text-white mt-2">Analyze & Diagnose Your Starting Point</h2>
                  <p className="text-gray-400 mt-2 max-w-2xl">Know exactly where you stand and what needs fixing. Our foundation tools perform complete audits of your online presence.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {tools.foundation.map((tool, i) => <ToolCard key={i} tool={tool} onClick={() => {}} />)}
              </div>
          </div>
      </section>

      {/* 4. CREATE TOOLS */}
      <section id="create" className="py-24 px-4 bg-slate-900 border-t border-slate-800">
          <div className="max-w-7xl mx-auto">
              <div className="mb-12">
                  <span className="text-teal-400 font-bold uppercase tracking-wider text-sm">Create & Publish</span>
                  <h2 className="text-3xl font-bold text-white mt-2">Generate On-Brand Content Instantly</h2>
                  <p className="text-gray-400 mt-2 max-w-2xl">AI creates your marketing assets, you review and publish. No design skills needed.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {tools.create.map((tool, i) => <ToolCard key={i} tool={tool} onClick={() => {}} />)}
              </div>
          </div>
      </section>

      {/* 5. ENGAGE TOOLS */}
      <section id="engage" className="py-24 px-4 bg-gradient-to-b from-slate-900 to-brand-darker border-t border-slate-800">
          <div className="max-w-7xl mx-auto">
              <div className="mb-12">
                  <span className="text-purple-500 font-bold uppercase tracking-wider text-sm">Engage & Convert</span>
                  <h2 className="text-3xl font-bold text-white mt-2">Build Trust & Capture More Leads</h2>
                  <p className="text-gray-400 mt-2 max-w-2xl">Turn viewers into customers with review management and lead generation.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {tools.engage.map((tool, i) => <ToolCard key={i} tool={tool} onClick={() => {}} />)}
              </div>
          </div>
      </section>

      {/* 6. GROWTH TOOLS */}
      <section id="growth" className="py-24 px-4 bg-brand-darker border-t border-slate-800">
          <div className="max-w-7xl mx-auto">
              <div className="mb-12">
                  <span className="text-pink-500 font-bold uppercase tracking-wider text-sm">Growth & Strategy</span>
                  <h2 className="text-3xl font-bold text-white mt-2">Execute & Track Your Progress</h2>
                  <p className="text-gray-400 mt-2 max-w-2xl">The system that ties everything together and keeps you moving forward.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                      <ToolCard tool={tools.growth[0]} onClick={() => {}} />
                  </div>
                  <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700">
                      <h3 className="text-xl font-bold text-white mb-4">How Growth Plan Works</h3>
                      <ul className="space-y-4">
                          <li className="flex items-start"><CheckCircleIcon className="w-6 h-6 text-green-400 mr-3 shrink-0"/><span>Takes findings from JetBiz, JetViz, and more</span></li>
                          <li className="flex items-start"><CheckCircleIcon className="w-6 h-6 text-green-400 mr-3 shrink-0"/><span>Deduplicates and prioritizes tasks automatically</span></li>
                          <li className="flex items-start"><CheckCircleIcon className="w-6 h-6 text-green-400 mr-3 shrink-0"/><span>Gives you 3-5 high-impact tasks per week</span></li>
                          <li className="flex items-start"><CheckCircleIcon className="w-6 h-6 text-green-400 mr-3 shrink-0"/><span>Tracks completion and updates your Growth Score</span></li>
                      </ul>
                  </div>
              </div>
          </div>
      </section>

      {/* 7. DASHBOARD TOOLS */}
      <section id="dashboard" className="py-24 px-4 bg-slate-900 border-t border-slate-800">
           <div className="max-w-7xl mx-auto">
              <div className="mb-12">
                  <span className="text-blue-400 font-bold uppercase tracking-wider text-sm">Dashboard</span>
                  <h2 className="text-3xl font-bold text-white mt-2">Monitor Everything in One Place</h2>
                  <p className="text-gray-400 mt-2 max-w-2xl">Your command center for tracking progress and managing your business.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                  {tools.dashboard.map((tool, i) => <ToolCard key={i} tool={tool} onClick={() => {}} />)}
              </div>
          </div>
      </section>

      {/* 8. SYSTEM VISUALIZATION */}
      <section className="py-24 px-4 bg-brand-darker border-t border-slate-800">
          <div className="max-w-5xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-12">How All 20 Tools Work Together</h2>
              
              <div className="relative">
                  {/* Central Hub */}
                  <div className="inline-block bg-slate-800 p-8 rounded-full border-4 border-blue-600 shadow-2xl relative z-10">
                      <ProfileIcon className="w-16 h-16 text-white" />
                      <span className="block text-sm font-bold text-white mt-2">Your Business</span>
                  </div>

                  {/* Connecting Lines (Simulated) */}
                  <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-slate-700 -z-0"></div>
                  <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-700 -z-0"></div>

                  {/* Orbiting Nodes */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 relative z-10">
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                          <MagnifyingGlassIcon className="w-8 h-8 text-blue-500 mx-auto mb-2"/>
                          <h4 className="font-bold text-white">Audit</h4>
                          <p className="text-xs text-gray-500">Finds Issues</p>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                           <ChartBarIcon className="w-8 h-8 text-red-500 mx-auto mb-2"/>
                          <h4 className="font-bold text-white">Prioritize</h4>
                          <p className="text-xs text-gray-500">Growth Plan</p>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                           <PaintBrushIcon className="w-8 h-8 text-pink-500 mx-auto mb-2"/>
                          <h4 className="font-bold text-white">Create</h4>
                          <p className="text-xs text-gray-500">Fix Issues</p>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                           <GrowthScoreIcon className="w-8 h-8 text-green-500 mx-auto mb-2"/>
                          <h4 className="font-bold text-white">Track</h4>
                          <p className="text-xs text-gray-500">Update Score</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* 9. VALUE COMPARISON */}
      <section className="py-24 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-12">Replace $15,000/Month in Services</h2>
             <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="grid grid-cols-2 bg-slate-800 border-b border-slate-700 p-4 font-bold text-white">
                    <div>Service Replaced</div>
                    <div className="text-right">Est. Monthly Cost</div>
                </div>
                {[
                    { name: "Web Design Agency", cost: "$2,000 - $5,000", tool: "JetViz" },
                    { name: "Graphic Designer", cost: "$1,000 - $3,000", tool: "JetCreate + JetImage" },
                    { name: "SEO Consultant", cost: "$1,000 - $3,000", tool: "JetBiz + JetKeywords" },
                    { name: "Content Writer", cost: "$500 - $2,000", tool: "JetContent" },
                    { name: "Review Management", cost: "$200 - $800", tool: "JetReply" },
                ].map((item, i) => (
                    <div key={i} className="grid grid-cols-2 p-4 border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                        <div>
                            <span className="text-gray-300 block">{item.name}</span>
                            <span className="text-xs text-blue-400 font-medium">Replaced by {item.tool}</span>
                        </div>
                        <div className="text-right text-gray-400 font-mono">{item.cost}</div>
                    </div>
                ))}
                 <div className="grid grid-cols-2 p-4 bg-blue-900/20">
                    <div className="text-white font-bold text-lg">Total Value</div>
                    <div className="text-right text-white font-bold text-lg">$4,700 - $13,800/mo</div>
                </div>
            </div>
            <div className="text-center mt-8">
                <p className="text-xl text-white font-bold">Your Price: <span className="text-blue-400 text-3xl">$149/mo</span></p>
                <p className="text-sm text-gray-500">Start your subscription today.</p>
            </div>
        </div>
      </section>

      {/* 10. TOOL ACCESS PHILOSOPHY */}
      <section className="py-24 px-4 bg-brand-darker border-t border-slate-800">
          <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-8">No Tool Lockouts. No "Leveling Up."</h2>
              <div className="flex justify-center items-center gap-12 mb-8">
                  <div className="opacity-50 grayscale">
                      <LockClosedIcon className="w-16 h-16 text-red-500 mx-auto mb-2"/>
                      <p className="text-gray-500 font-bold">Other Platforms</p>
                      <p className="text-xs text-gray-600">"Upgrade to unlock"</p>
                  </div>
                  <div className="scale-110">
                      <LockOpenIcon className="w-20 h-20 text-green-500 mx-auto mb-2 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]"/>
                      <p className="text-white font-bold text-xl">JetSuite</p>
                      <p className="text-xs text-green-400">Everything Unlocked</p>
                  </div>
              </div>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  Unlike platforms that lock tools until you "prove yourself," JetSuite gives you everything from day one. Your Growth Plan suggests the optimal sequence, but you can use any tool anytime.
              </p>
          </div>
      </section>

      {/* 11. CTA SECTION */}
      <section className="py-24 px-4 text-center bg-gradient-to-br from-blue-900 via-slate-900 to-brand-darker text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="relative z-10 max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">Ready to Access All 20 Growth Tools?</h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Join 360+ local businesses growing with JetSuite. Start your subscription now.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button onClick={() => navigate('/get-started')} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 text-lg shadow-xl shadow-blue-600/30 relative">
                    Start Subscription
                </button>
                <button className="w-full sm:w-auto bg-transparent border-2 border-slate-600 hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-xl transition-colors duration-300 text-lg">
                    Schedule a Demo
                    <span className="block text-xs font-normal opacity-80 mt-1">See all tools live</span>
                </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
                Cancel anytime. No long-term contracts.
            </p>
          </div>
      </section>
      
      {/* 12. FAQ SECTION */}
      <section className="py-24 px-4 bg-brand-darker border-t border-slate-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <FaqItem question="Do I get access to all tools immediately?" answer="Yes! All 20 tools are available from day one. We don't believe in 'unlocking' features." />
            <FaqItem question="How many businesses can I manage?" answer="One business profile is included in the base plan. You can add additional locations or businesses for $99/month each." />
            <FaqItem question="What if I only need a few tools?" answer="You still get access to everything. Use what you need now (e.g., just reviews), and expand to other tools (like SEO) as you grow." />
            <FaqItem question="Is there a learning curve?" answer="Minimal. The Growth Plan tells you exactly what to use and when, so you don't have to learn all 20 tools at once." />
          </div>
        </div>
      </section>

    </div>
  );
};