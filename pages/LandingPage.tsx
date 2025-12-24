import React from 'react';
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
    { q: "How many businesses can I manage?", a: "Your base subscription includes one business profile. You can add additional locations or businesses for just $99/month each from your dashboard." },
    { q: "What's included in the trial?", a: "You get full access to the entire platform—all 20+ tools, unlimited AI content generation, and full audits—for 14 days. No restricted features." }
];

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  return (
    <div className="bg-white text-slate-600 overflow-x-hidden font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-20 pb-24 sm:pt-32 sm:pb-32 px-4 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-sky-100/50 rounded-full blur-[120px] -z-10"></div>

        <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Trusted by 360+ local businesses
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-8">
                Get Found First on Google. <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">
                    Get More Local Customers.
                </span>
            </h1>
            
            <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 leading-relaxed">
                JetSuite is the AI-powered platform that manages your Google ranking, reputation, and marketing—all in one place. Stop being invisible to local searchers.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => navigate('/login')} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 text-lg shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-1">
                    Start Free 14-Day Trial
                </button>
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-4 px-8 rounded-xl transition-all duration-300 text-lg border border-slate-200 shadow-sm">
                    Watch 2-Min Demo <span>→</span>
                </button>
            </div>

            {/* Dashboard Visual */}
            <div className="mt-16 relative mx-auto max-w-5xl">
                <div className="relative bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl shadow-slate-200 overflow-hidden aspect-[16/9] md:aspect-[16/8]">
                    {/* Mockup Header */}
                    <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center px-4 gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        <div className="ml-4 h-6 w-64 bg-slate-900/50 rounded-md"></div>
                    </div>
                    {/* Mockup Content */}
                    <div className="p-6 grid grid-cols-12 gap-6 h-full">
                        {/* Sidebar */}
                        <div className="hidden md:block col-span-2 space-y-4">
                            <div className="h-8 w-full bg-slate-800 rounded-lg opacity-50"></div>
                            <div className="h-8 w-full bg-blue-600/20 rounded-lg border border-blue-500/30"></div>
                            <div className="h-8 w-full bg-slate-800 rounded-lg opacity-50"></div>
                            <div className="h-8 w-full bg-slate-800 rounded-lg opacity-50"></div>
                        </div>
                        {/* Main Content */}
                        <div className="col-span-12 md:col-span-10 grid grid-cols-3 gap-6">
                            {/* Score Card */}
                            <div className="col-span-3 md:col-span-1 bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                                <h3 className="text-gray-400 font-medium mb-2">Growth Score</h3>
                                <div className="text-5xl font-bold text-white mb-1">78<span className="text-lg text-green-400 ml-1">↑</span></div>
                                <div className="text-xs text-gray-500">Top 10% in your area</div>
                            </div>
                            {/* Chart */}
                            <div className="col-span-3 md:col-span-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-end justify-between gap-2 h-40">
                                {[30, 45, 35, 50, 60, 55, 70, 80, 75, 90].map((h, i) => (
                                    <div key={i} className="w-full bg-gradient-to-t from-blue-600 to-teal-400 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity" style={{height: `${h}%`}}></div>
                                ))}
                            </div>
                            {/* Action Items */}
                            <div className="col-span-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-white font-semibold">Weekly Action Plan</h3>
                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">2 Tasks Left</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                        <div className="h-5 w-5 rounded-full border-2 border-slate-600"></div>
                                        <div className="h-2 w-32 bg-slate-700 rounded"></div>
                                    </div>
                                    <div className="flex items-center gap-3 p-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                        <div className="h-5 w-5 rounded-full border-2 border-blue-500 bg-blue-500 flex items-center justify-center text-[10px] text-white">✓</div>
                                        <div className="h-2 w-48 bg-slate-700 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Floating Elements */}
                <div className="absolute -right-4 -bottom-4 md:right-[-20px] md:bottom-10 bg-white p-4 rounded-lg shadow-xl shadow-slate-200 animate-bounce duration-[3000ms] border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full"><StarIcon className="w-5 h-5 text-green-600"/></div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold">New Review</p>
                            <p className="text-sm font-bold text-slate-900">⭐⭐⭐⭐⭐ Great service!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* 2. THE PROBLEM SECTION */}
      <section className="py-24 px-4 bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Is Your Online Presence Costing You Customers?</h2>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                    JetSuite replaces your entire marketing stack with one intelligent platform.
                </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:translate-y-[-2px]">
                    <div className="bg-red-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                        <EyeSlashIcon className="w-7 h-7 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Invisible to Searchers</h3>
                    <p className="text-slate-600 leading-relaxed">
                        88% of local searches visit a business within 24 hours. If you're not on page 1, you're missing out on ready-to-buy customers.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:translate-y-[-2px]">
                    <div className="bg-yellow-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                        <ExclamationTriangleIcon className="w-7 h-7 text-yellow-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Tool Overload</h3>
                    <p className="text-slate-600 leading-relaxed">
                        Managing 10+ different tools for SEO, reviews, and content is overwhelming. You end up paying for tools you don't have time to use.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:translate-y-[-2px]">
                    <div className="bg-blue-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                        <CreditCardIcon className="w-7 h-7 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Expensive Agencies</h3>
                    <p className="text-slate-600 leading-relaxed">
                        Hiring agencies costs $5,000+/month with no guaranteed results. You pay whether you grow or not.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* 3. VALUE PROPOSITION GRID */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Everything You Need to Dominate Local Search</h2>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
                <div className="p-6 bg-slate-50 rounded-xl border-t-4 border-blue-500 shadow-sm hover:shadow-md transition-all">
                    <div className="mb-4"><JetVizIcon className="w-10 h-10 text-blue-600"/></div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Analyze & Diagnose</h3>
                    <p className="text-slate-600 text-sm">Audit your Google Business Profile, website, and competitors instantly.</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-xl border-t-4 border-teal-400 shadow-sm hover:shadow-md transition-all">
                    <div className="mb-4"><JetCreateIcon className="w-10 h-10 text-teal-500"/></div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Create & Publish</h3>
                    <p className="text-slate-600 text-sm">AI generates your marketing content, images, and ads in seconds.</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-xl border-t-4 border-purple-500 shadow-sm hover:shadow-md transition-all">
                    <div className="mb-4"><ChatBubbleLeftRightIcon className="w-10 h-10 text-purple-600"/></div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Engage & Convert</h3>
                    <p className="text-slate-600 text-sm">Manage reviews, capture leads, and build trust automatically.</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-xl border-t-4 border-pink-500 shadow-sm hover:shadow-md transition-all">
                    <div className="mb-4"><RocketLaunchIcon className="w-10 h-10 text-pink-500"/></div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Execute & Grow</h3>
                    <p className="text-slate-600 text-sm">Weekly prioritized action plan that actually gets done.</p>
                </div>
            </div>
        </div>
      </section>

      {/* 4. FEATURES SHOWCASE */}
      <section className="py-24 px-4 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto space-y-20">
            {/* Foundation Tools */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1">
                    <span className="text-blue-600 font-bold uppercase tracking-wider text-sm">Foundation</span>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2 mb-6">Build a Rock-Solid Presence</h3>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="bg-white p-3 rounded-lg h-fit border border-slate-200 shadow-sm"><JetBizIcon className="w-6 h-6 text-blue-600"/></div>
                            <div>
                                <h4 className="font-bold text-slate-900">JetBiz</h4>
                                <p className="text-slate-600 text-sm">Optimize your Google Business Profile for higher ranking.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white p-3 rounded-lg h-fit border border-slate-200 shadow-sm"><JetVizIcon className="w-6 h-6 text-blue-600"/></div>
                            <div>
                                <h4 className="font-bold text-slate-900">JetViz</h4>
                                <p className="text-slate-600 text-sm">Deep-dive AI website audit with specific technical fixes.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white p-3 rounded-lg h-fit border border-slate-200 shadow-sm"><JetKeywordsIcon className="w-6 h-6 text-blue-600"/></div>
                            <div>
                                <h4 className="font-bold text-slate-900">JetKeywords</h4>
                                <p className="text-slate-600 text-sm">Find profitable local search terms your competitors missed.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="order-1 md:order-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl relative">
                     <div className="absolute inset-0 bg-blue-50/50 blur-3xl rounded-full"></div>
                     <div className="relative z-10 space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                            <span className="text-slate-700 font-medium">Google Profile Health</span>
                            <span className="text-green-600 font-bold">94/100</span>
                        </div>
                         <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                            <span className="text-slate-700 font-medium">Website Performance</span>
                            <span className="text-yellow-500 font-bold">72/100</span>
                        </div>
                         <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                            <span className="text-slate-700 font-medium">Keyword Opportunities</span>
                            <span className="text-blue-600 font-bold">12 Found</span>
                        </div>
                     </div>
                </div>
            </div>

            {/* Creation Tools */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl relative overflow-hidden">
                     <div className="absolute -right-20 -top-20 bg-teal-50/50 w-64 h-64 blur-3xl rounded-full"></div>
                     <div className="relative z-10 grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 aspect-square flex items-center justify-center">
                            <div className="text-center">
                                <JetCreateIcon className="w-8 h-8 text-teal-500 mx-auto mb-2"/>
                                <span className="text-xs text-slate-500 block">Social Post</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 aspect-square flex items-center justify-center">
                             <div className="text-center">
                                <JetImageIcon className="w-8 h-8 text-purple-500 mx-auto mb-2"/>
                                <span className="text-xs text-slate-500 block">Ad Creative</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 aspect-square flex items-center justify-center col-span-2">
                             <div className="text-center w-full">
                                <div className="h-2 w-3/4 bg-slate-200 rounded mx-auto mb-2"></div>
                                <div className="h-2 w-1/2 bg-slate-200 rounded mx-auto"></div>
                                <span className="text-xs text-slate-400 block mt-2">AI Generating...</span>
                            </div>
                        </div>
                     </div>
                </div>
                <div>
                    <span className="text-teal-500 font-bold uppercase tracking-wider text-sm">Creation</span>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2 mb-6">Never Run Out of Content</h3>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="bg-white p-3 rounded-lg h-fit border border-slate-200 shadow-sm"><JetCreateIcon className="w-6 h-6 text-teal-500"/></div>
                            <div>
                                <h4 className="font-bold text-slate-900">JetCreate ⭐</h4>
                                <p className="text-slate-600 text-sm">AI creative director that writes your posts, emails, and ads.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white p-3 rounded-lg h-fit border border-slate-200 shadow-sm"><JetImageIcon className="w-6 h-6 text-teal-500"/></div>
                            <div>
                                <h4 className="font-bold text-slate-900">JetImage</h4>
                                <p className="text-slate-600 text-sm">Generate custom, on-brand images instantly.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Engagement Tools */}
             <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1">
                    <span className="text-purple-600 font-bold uppercase tracking-wider text-sm">Engagement</span>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2 mb-6">Turn Visitors into Loyal Customers</h3>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="bg-white p-3 rounded-lg h-fit border border-slate-200 shadow-sm"><JetReplyIcon className="w-6 h-6 text-purple-600"/></div>
                            <div>
                                <h4 className="font-bold text-slate-900">JetReply</h4>
                                <p className="text-slate-600 text-sm">AI-crafted responses to all your reviews in one click.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white p-3 rounded-lg h-fit border border-slate-200 shadow-sm"><JetTrustIcon className="w-6 h-6 text-purple-600"/></div>
                            <div>
                                <h4 className="font-bold text-slate-900">JetTrust</h4>
                                <p className="text-slate-600 text-sm">Showcase your best reviews on your website to build trust.</p>
                            </div>
                        </div>
                    </div>
                </div>
                 <div className="order-1 md:order-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl relative">
                     <div className="space-y-4">
                        <div className="bg-slate-50 text-slate-900 p-4 rounded-xl rounded-tl-none shadow-sm border border-slate-100 max-w-[90%]">
                            <p className="text-sm font-semibold mb-1">Five Star Review!</p>
                            <p className="text-xs text-slate-600">"The service was incredible. Highly recommend to everyone in the area!"</p>
                        </div>
                         <div className="bg-blue-600 text-white p-4 rounded-xl rounded-tr-none shadow-md max-w-[90%] ml-auto">
                            <p className="text-xs text-blue-100 mb-1">AI Suggested Reply:</p>
                            <p className="text-sm">"Thank you so much! We love serving our local community. Hope to see you again soon!"</p>
                        </div>
                     </div>
                </div>
            </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="py-24 px-4 bg-white">
         <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-16">Your Path to More Customers in 10 Minutes/Day</h2>
            
            <div className="grid md:grid-cols-3 gap-8 relative">
                 {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-1 bg-slate-100 -z-10"></div>
                
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg relative group hover:-translate-y-2 transition-transform">
                    <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-blue-600/30 text-2xl font-bold ring-8 ring-white">
                        <BoltIcon className="w-8 h-8"/>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">1. Connect & Analyze</h3>
                    <p className="text-slate-600">Connect your business. Our AI audits everything in minutes.</p>
                </div>
                
                 <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg relative group hover:-translate-y-2 transition-transform">
                    <div className="bg-teal-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-teal-500/30 text-2xl font-bold ring-8 ring-white">
                        <CheckCircleIcon className="w-8 h-8"/>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">2. Execute Tasks</h3>
                    <p className="text-slate-600">Complete 3-5 simple weekly actions from your Growth Plan.</p>
                </div>
                
                 <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg relative group hover:-translate-y-2 transition-transform">
                    <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-purple-600/30 text-2xl font-bold ring-8 ring-white">
                        <GrowthScoreIcon className="w-8 h-8"/>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">3. Track Growth</h3>
                    <p className="text-slate-600">Watch your Google ranking, reviews, and leads increase.</p>
                </div>
            </div>
         </div>
      </section>

      {/* 6. PRICING & VALUE SHOCK */}
      <section className="py-24 px-4 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Replace $15,000/Month in Services</h2>
                <p className="text-xl text-slate-600">Get the power of an entire agency for less than the cost of lunch.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
                {/* Comparison Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 bg-slate-50">
                        <h3 className="text-lg font-bold text-slate-900">The Old Way (Hiring Pros)</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-600">Web Design Agency</span>
                            <span className="text-slate-900 font-mono">$2,000-5,000/mo</span>
                        </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-600">Graphic Designer</span>
                            <span className="text-slate-900 font-mono">$1,000-3,000/mo</span>
                        </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-600">SEO Consultant</span>
                            <span className="text-slate-900 font-mono">$1,000-3,000/mo</span>
                        </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-100">
                            <span className="text-slate-600">Content Writer</span>
                            <span className="text-slate-900 font-mono">$500-2,000/mo</span>
                        </div>
                         <div className="flex justify-between items-center py-2">
                            <span className="text-slate-600">Review Management</span>
                            <span className="text-slate-900 font-mono">$200-800/mo</span>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg flex justify-between items-center mt-4">
                            <span className="text-red-700 font-bold">Total Cost</span>
                            <span className="text-red-700 font-bold font-mono text-xl">$5,000 - $16,000/mo</span>
                        </div>
                    </div>
                </div>

                {/* JetSuite Pricing Card */}
                <div className="relative bg-white rounded-2xl border border-blue-500 shadow-2xl shadow-blue-200/50 p-8 text-center overflow-hidden transform md:scale-105">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-teal-400"></div>
                    <div className="absolute top-4 right-4 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">BEST VALUE</div>
                    
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Complete Platform</h3>
                    <div className="flex items-baseline justify-center my-8">
                        <span className="text-6xl font-extrabold text-slate-900">$149</span>
                        <span className="text-xl text-slate-500 ml-2">/month</span>
                    </div>
                    
                    <ul className="text-left space-y-4 mb-8 max-w-xs mx-auto text-slate-600">
                        <li className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-teal-500 mr-3 shrink-0"/> All 20+ Tools Included</li>
                        <li className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-teal-500 mr-3 shrink-0"/> Unlimited Usage</li>
                        <li className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-teal-500 mr-3 shrink-0"/> No Contracts</li>
                        <li className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-teal-500 mr-3 shrink-0"/> 30-Day Results Guarantee</li>
                    </ul>
                    
                    <button onClick={() => navigate('/login')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 text-lg shadow-lg mb-4">
                        Start Free Trial →
                    </button>
                    <p className="text-xs text-slate-500">14-day free trial • No credit card required</p>
                </div>
            </div>
        </div>
      </section>

      {/* 7. SOCIAL PROOF */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 text-center mb-16">What Local Business Owners Are Saying</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <TestimonialCard variant="light" 
                quote="JetSuite found issues three other agencies missed. Finally have a clear path forward." 
                author="Mark P." 
                role="Plumbing Contractor" 
            />
            <TestimonialCard variant="light" 
                quote="The weekly tasks keep me focused. My Google ranking has already jumped from page 3 to page 1." 
                author="Dr. Sarah K." 
                role="Dentist" 
            />
            <TestimonialCard variant="light" 
                quote="I love being able to track my own progress with the Growth Score. It's motivating and simple." 
                author="David L." 
                role="Real Estate Agent" 
            />
          </div>
        </div>
      </section>

      {/* 8. GROWTH SCORE */}
      <section className="py-24 px-4 bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">Track Your Progress With One Number</h2>
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
                Your Growth Score (0-99) measures your online presence strength and shows exactly what to improve next.
            </p>
            
            <div className="relative inline-block">
                 <div className="w-64 h-64 rounded-full border-[12px] border-slate-200 flex items-center justify-center relative bg-white shadow-lg">
                    <div className="absolute inset-0 rounded-full border-[12px] border-blue-500 border-l-transparent rotate-45"></div>
                    <div className="text-center">
                        <span className="block text-7xl font-bold text-slate-900">82</span>
                        <span className="block text-sm text-slate-500 uppercase tracking-widest mt-2">Excellent</span>
                    </div>
                 </div>
            </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-bold text-center text-slate-900 mb-16">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => <FaqItem key={i} question={faq.q} answer={faq.a} variant="light" />)}
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="py-24 sm:py-32 px-4 text-center bg-gradient-to-br from-blue-900 via-slate-900 to-brand-darker relative overflow-hidden text-white">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto">
              <h2 className="text-4xl sm:text-6xl font-extrabold text-white mb-6">Start Getting Found Today</h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                  Join 360+ local businesses growing with JetSuite. Try it risk-free.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => navigate('/login')} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 text-lg shadow-xl shadow-blue-600/30">
                  Get Started Free for 14 Days
                </button>
                <button className="w-full sm:w-auto bg-transparent border-2 border-slate-600 hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-xl transition-colors duration-300 text-lg">
                  Schedule a Demo
                </button>
              </div>
          </div>
      </section>
      
    </div>
  );
};
