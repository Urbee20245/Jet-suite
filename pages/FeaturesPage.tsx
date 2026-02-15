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
    JetProductIcon,
    JetServicesIcon
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
            tagline: "WordPress Publishing & Content Creation",
            brief: "AI-powered content creator that publishes blog posts, articles, and press releases directly to WordPress. Includes scheduling, featured image generation, and full SEO optimization.",
            replaces: "Content Writers + CMS ($500/mo)",
            icon: JetContentIcon,
            iconBg: "bg-fuchsia-600",
            featured: true
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
        },
        {
            name: "JetServices",
            tagline: "Service Management & Promotion",
            brief: "Manage your service listings, generate AI images, post to social media, and schedule via calendar—all in one place.",
            replaces: "Service Marketing Tools ($300/mo)",
            icon: JetServicesIcon,
            iconBg: "bg-amber-600",
            featured: true
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
                    Get Started
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
        <div className="mt-16 relative h-48 md:h-64 max-w-6xl mx-auto pointer-events-none">
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 transform rotate-6 scale-110">
                 {[...Array(8)].map((_, i) => (
                     <div key={i} className="bg-slate-800 border border-slate-700 rounded-lg h-32 md:h-48 w-full overflow-hidden">
                         <img
                             src={`/feature/${i + 1}.png`}
                             alt={`JetSuite feature ${i + 1}`}
                             className="w-full h-full object-cover"
                         />
                     </div>
                 ))}
             </div>
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

      {/* 4.5 JETCONTENT + WORDPRESS DEEP DIVE */}
      <section className="py-24 px-4 bg-gradient-to-b from-slate-900 to-brand-darker border-t border-slate-800">
          <div className="max-w-7xl mx-auto">
              <div className="mb-12 text-center">
                  <span className="text-indigo-400 font-bold uppercase tracking-wider text-sm">Spotlight Feature</span>
                  <h2 className="text-3xl font-bold text-white mt-2">JetContent + WordPress Integration</h2>
                  <p className="text-gray-400 mt-2 max-w-2xl mx-auto">Create SEO-optimized content and publish directly to your WordPress website—all in one place.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                  {/* Left: Feature Breakdown */}
                  <div className="space-y-6">
                      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                              <svg className="w-6 h-6 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12.158 12.786l-2.698 7.84c.806.236 1.657.365 2.54.365 1.047 0 2.051-.18 2.986-.51-.024-.037-.046-.078-.065-.123l-2.763-7.572zm-5.54-3.03l3.202 8.768L4.736 8.285c.583-.09 1.109-.132 1.109-.132.523-.062.463-.833-.06-.804 0 0-1.571.123-2.585.123-.951 0-2.553-.123-2.553-.123-.523-.03-.583.773-.06.804 0 0 .492.042 1.012.132l1.502 4.116-2.109 6.326L.255 7.413c.583-.09 1.109-.132 1.109-.132.523-.062.463-.833-.06-.804 0 0-1.571.123-2.585.123l-.515-.01C1.295 3.073 4.389.869 8 .869c2.706 0 5.168 1.041 7.013 2.746-.045-.003-.088-.01-.134-.01-.951 0-1.624.827-1.624 1.715 0 .797.462 1.471.951 2.269.37.644.805 1.471.805 2.667 0 .826-.316 1.785-.734 3.12l-.962 3.212-3.491-10.384zM12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm10-10c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10 10-4.477 10-10z"/>
                              </svg>
                              Connect Multiple WordPress Sites
                          </h3>
                          <p className="text-gray-400 text-sm">Add unlimited WordPress websites. Manage credentials securely and publish to any connected site.</p>
                      </div>

                      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                              <CheckCircleIcon className="w-6 h-6 text-green-400"/>
                              Three Content Types
                          </h3>
                          <ul className="space-y-3 text-sm text-gray-400">
                              <li className="flex items-start gap-3">
                                  <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <span className="text-xs font-bold text-blue-400">1</span>
                                  </div>
                                  <div>
                                      <strong className="text-white">Blog Posts</strong> - Quick, SEO-optimized posts for regular updates
                                  </div>
                              </li>
                              <li className="flex items-start gap-3">
                                  <div className="w-6 h-6 bg-purple-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <span className="text-xs font-bold text-purple-400">2</span>
                                  </div>
                                  <div>
                                      <strong className="text-white">Articles</strong> - Long-form content with research, key takeaways, and references
                                  </div>
                              </li>
                              <li className="flex items-start gap-3">
                                  <div className="w-6 h-6 bg-emerald-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <span className="text-xs font-bold text-emerald-400">3</span>
                                  </div>
                                  <div>
                                      <strong className="text-white">Press Releases</strong> - Media-ready announcements with structured formatting
                                  </div>
                              </li>
                          </ul>
                      </div>

                      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              AI-Powered Features
                          </h3>
                          <ul className="space-y-2 text-sm text-gray-400">
                              <li className="flex items-center gap-2">
                                  <CheckCircleIcon className="w-4 h-4 text-green-400"/>
                                  Auto-generate featured images
                              </li>
                              <li className="flex items-center gap-2">
                                  <CheckCircleIcon className="w-4 h-4 text-green-400"/>
                                  SEO meta descriptions & keywords
                              </li>
                              <li className="flex items-center gap-2">
                                  <CheckCircleIcon className="w-4 h-4 text-green-400"/>
                                  Schedule posts with timezone support
                              </li>
                              <li className="flex items-center gap-2">
                                  <CheckCircleIcon className="w-4 h-4 text-green-400"/>
                                  Automatic keyword optimization
                              </li>
                              <li className="flex items-center gap-2">
                                  <CheckCircleIcon className="w-4 h-4 text-green-400"/>
                                  Category & tag suggestions
                              </li>
                          </ul>
                      </div>
                  </div>

                  {/* Right: Visual Demo */}
                  <div className="relative">
                      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border border-slate-700 relative overflow-hidden">
                          <div className="absolute -right-20 -top-20 bg-indigo-500/20 w-64 h-64 blur-3xl rounded-full"></div>

                          <div className="relative z-10 space-y-4">
                              {/* Header */}
                              <div className="flex items-center justify-between mb-6">
                                  <h4 className="text-white font-bold">Publishing Dashboard</h4>
                                  <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                      <span className="text-xs text-green-400">Connected</span>
                                  </div>
                              </div>

                              {/* Content Preview Card */}
                              <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-500/30">
                                  <div className="flex items-start gap-3 mb-3">
                                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex-shrink-0"></div>
                                      <div className="flex-1 min-w-0">
                                          <h5 className="text-white font-medium text-sm truncate">10 Ways to Improve Your Local SEO</h5>
                                          <p className="text-xs text-gray-400 mt-1">Blog Post • 847 words</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-500">mysite.com/blog</span>
                                      <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded">Published</span>
                                  </div>
                              </div>

                              {/* Stats Grid */}
                              <div className="grid grid-cols-3 gap-3">
                                  <div className="bg-slate-950/50 p-3 rounded-lg text-center">
                                      <div className="text-lg font-bold text-white">24</div>
                                      <div className="text-xs text-gray-400">Published</div>
                                  </div>
                                  <div className="bg-slate-950/50 p-3 rounded-lg text-center">
                                      <div className="text-lg font-bold text-white">7</div>
                                      <div className="text-xs text-gray-400">Scheduled</div>
                                  </div>
                                  <div className="bg-slate-950/50 p-3 rounded-lg text-center">
                                      <div className="text-lg font-bold text-white">3</div>
                                      <div className="text-xs text-gray-400">Draft</div>
                                  </div>
                              </div>

                              {/* Workflow Steps */}
                              <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 p-4 rounded-xl border border-indigo-500/20 mt-6">
                                  <h5 className="text-white font-bold mb-3 text-sm">Publishing Workflow:</h5>
                                  <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-xs text-gray-300">
                                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">✓</div>
                                          <span>AI writes content</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-300">
                                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">✓</div>
                                          <span>Generate featured image</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-300">
                                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">✓</div>
                                          <span>Optimize for SEO</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-300">
                                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold animate-pulse">→</div>
                                          <span>Publish to WordPress</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Key Benefits Banner */}
              <div className="bg-gradient-to-r from-indigo-900/30 via-purple-900/30 to-indigo-900/30 rounded-2xl border border-indigo-500/30 p-8">
                  <h3 className="text-2xl font-bold text-white text-center mb-8">Why JetContent + WordPress?</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                          <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                          </div>
                          <h4 className="font-bold text-white mb-2">Save 10+ Hours/Week</h4>
                          <p className="text-sm text-gray-400">No more copying between tools. Create and publish in one place.</p>
                      </div>
                      <div className="text-center">
                          <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                          </div>
                          <h4 className="font-bold text-white mb-2">100% SEO Optimized</h4>
                          <p className="text-sm text-gray-400">Every post includes meta descriptions, keywords, and proper formatting.</p>
                      </div>
                      <div className="text-center">
                          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                          </div>
                          <h4 className="font-bold text-white mb-2">Publish 3x More Content</h4>
                          <p className="text-sm text-gray-400">AI speed means more content, more keywords, more traffic.</p>
                      </div>
                  </div>
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
                <div className="inline-block bg-yellow-500/20 border border-yellow-500/50 rounded-full px-4 py-1 mb-3">
                  <span className="text-yellow-300 text-sm font-bold">Special Founders Price</span>
                </div>
                <p className="text-xl text-white font-bold">Your Price: <span className="text-gray-400 line-through text-lg mr-2">$149/mo</span><span className="text-blue-400 text-3xl">$97/mo</span></p>
                <p className="text-sm text-yellow-300/70 font-medium mt-1">This special founders rate won't last long. Lock it in today!</p>
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
                    Get Started
                </button>
                <button onClick={() => navigate('/schedule-demo')} className="w-full sm:w-auto bg-transparent border-2 border-slate-600 hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-xl transition-colors duration-300 text-lg">
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