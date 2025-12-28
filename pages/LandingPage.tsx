import React, { useState } from 'react';
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

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  return (
    <div className="bg-brand-darker text-gray-300 overflow-x-hidden font-sans">
      
      {/* 1. HERO SECTION - REVISED with video */}
      <section className="relative pt-20 pb-24 sm:pt-32 sm:pb-32 px-4 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -z-10 opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] -z-10 opacity-30"></div>

        <div className="max-w-7xl mx-auto">
          {/* Main content and video side-by-side on desktop */}
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12">
            {/* Left Column: Text Content */}
            <div className="lg:w-1/2 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-300 text-sm font-medium mb-8">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Trusted by 360+ local businesses
                </div>
                
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-tight mb-8">
                    Get Found First on Google.
                    <br className="hidden md:block"/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                        Get More Customers.
                    </span>
                </h1>
                
                {/* REVISED SUBTITLE - More benefit-focused */}
                <p className="mt-6 max-w-2xl text-lg sm:text-xl text-gray-400 leading-relaxed">
                    JetSuite is the AI platform that handles your Google ranking, reputation, and ads for you—so local customers find you first and choose you.
                </p>
                
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => navigate('/get-started')} 
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 text-lg shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-1"
                    >
                        Get Started
                    </button>
                    <button 
                      onClick={() => navigate('/demo')}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 text-lg border border-slate-700"
                    >
                        Watch 2-Min Demo <span>→</span>
                    </button>
                </div>
            </div>

            {/* Right Column: VIDEO PLACEHOLDER - NEW */}
            <div className="lg:w-1/2 w-full max-w-2xl mx-auto lg:mx-0">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden aspect-video group cursor-pointer relative">
                    {/* This is the video placeholder. Replace with an actual <video> or <iframe> for YouTube/Vimeo */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900/40 to-purple-900/40">
                        {/* Play Button */}
                        <div className="w-24 h-24 rounded-full bg-white/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                            <div className="w-0 h-0 border-t-[16px] border-b-[16px] border-l-[24px] border-transparent border-l-blue-600 ml-2"></div>
                        </div>
                    </div>
                    
                    {/* Optional: Overlay label */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white py-2 px-6 rounded-full text-sm font-medium border border-white/20">
                        See how it works in 2 minutes
                    </div>
                </div>
                <p className="text-center text-gray-500 text-sm mt-4">See how JetSuite works for businesses like yours</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM SECTION */}
      <section className="py-24 px-4 bg-[#0B1121]">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Is Your Online Presence Costing You Customers?</h2>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                    JetSuite replaces your entire marketing stack with one intelligent platform.
                </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-slate-800/30 p-8 rounded-2xl border border-slate-700 hover:border-slate-600 transition-colors">
                    <div className="bg-red-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                        <EyeSlashIcon className="w-7 h-7 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Invisible to Searchers</h3>
                    <p className="text-gray-400 leading-relaxed">
                        88% of local searches visit a business within 24 hours. If you're not on page 1, you're missing out on ready-to-buy customers.
                    </p>
                </div>

                <div className="bg-slate-800/30 p-8 rounded-2xl border border-slate-700 hover:border-slate-600 transition-colors">
                    <div className="bg-yellow-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                        <ExclamationTriangleIcon className="w-7 h-7 text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Tool Overload</h3>
                    <p className="text-gray-400 leading-relaxed">
                        Managing 10+ different tools for SEO, reviews, and content is overwhelming. You end up paying for tools you don't have time to use.
                    </p>
                </div>

                <div className="bg-slate-800/30 p-8 rounded-2xl border border-slate-700 hover:border-slate-600 transition-colors">
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
      <section className="py-24 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white">Everything You Need to Dominate Local Search</h2>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
                <div className="p-6 bg-brand-darker rounded-xl border-t-4 border-blue-500 shadow-xl">
                    <div className="mb-4"><JetVizIcon className="w-10 h-10 text-blue-500"/></div>
                    <h3 className="text-xl font-bold text-white mb-2">Analyze & Diagnose</h3>
                    <p className="text-gray-400 text-sm">Audit your Google Business Profile, website, and competitors instantly.</p>
                </div>
                <div className="p-6 bg-brand-darker rounded-xl border-t-4 border-teal-400 shadow-xl">
                    <div className="mb-4"><JetCreateIcon className="w-10 h-10 text-teal-400"/></div>
                    <h3 className="text-xl font-bold text-white mb-2">Create & Publish</h3>
                    <p className="text-gray-400 text-sm">AI generates your marketing content, images, and ads in seconds.</p>
                </div>
                <div className="p-6 bg-brand-darker rounded-xl border-t-4 border-purple-500 shadow-xl">
                    <div className="mb-4"><ChatBubbleLeftRightIcon className="w-10 h-10 text-purple-500"/></div>
                    <h3 className="text-xl font-bold text-white mb-2">Engage & Convert</h3>
                    <p className="text-gray-400 text-sm">Manage reviews, capture leads, and build trust automatically.</p>
                </div>
                <div className="p-6 bg-brand-darker rounded-xl border-t-4 border-pink-500 shadow-xl">
                    <div className="mb-4"><RocketLaunchIcon className="w-10 h-10 text-pink-500"/></div>
                    <h3 className="text-xl font-bold text-white mb-2">Execute & Grow</h3>
                    <p className="text-gray-400 text-sm">Weekly prioritized action plan that actually gets done.</p>
                </div>
            </div>
        </div>
      </section>
      </section>

      {/* "VIEW ALL TOOLS" BUTTON SECTION - ADD THIS */}
      <section className="py-12 px-4 bg-slate-900 border-y border-slate-800">
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
            onClick={() => window.open("https://www.getjetsuite.com/features", "_blank")}
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 text-lg shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-1"
          >
            <span>View All 20+ Tools</span>
            <span className="group-hover:translate-x-2 transition-transform">→</span>
          </button>
          
          <p className="text-gray-500 text-sm mt-4">
            No credit card required • Explore at your own pace
          </p>
        </div>
      </section>
      {/* END OF "VIEW ALL TOOLS" SECTION */}
    
      {/* 4. FEATURES SHOWCASE - WITH ENHANCED ANIMATIONS FOR ALL TOOLS */}
      <section className="py-24 px-4 bg-[#0B1121]">
        <div className="max-w-6xl mx-auto space-y-20">
            {/* Foundation Tools */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1">
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
                <div className="order-1 md:order-2 bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border border-slate-700 relative">
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
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                     </div>
                </div>
            </div>

            {/* Creation Tools - ENHANCED with animated AI section */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border border-slate-700 relative overflow-hidden">
                    <div className="absolute -right-20 -top-20 bg-teal-500/20 w-64 h-64 blur-3xl rounded-full"></div>
                    
                    {/* Animated AI Content Generator */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg flex items-center justify-center">
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
                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-700 hover:border-teal-500/50 transition-colors group ai-content-card">
                                <div className="flex items-center justify-between mb-2">
                                    <JetCreateIcon className="w-5 h-5 text-teal-400" />
                                    <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-1 rounded ai-status-ready">Ready</span>
                                </div>
                                <div className="text-center">
                                    <span className="text-xs text-gray-400 block">Social Post</span>
                                    <div className="mt-1 h-6 w-full bg-slate-800 rounded animate-pulse group-hover:bg-slate-700"></div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-700 hover:border-purple-500/50 transition-colors group ai-content-card">
                                <div className="flex items-center justify-between mb-2">
                                    <JetImageIcon className="w-5 h-5 text-purple-400" />
                                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded ai-status-ready">Ready</span>
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
            
            {/* Engagement Tools - ENHANCED with animated JetReply & JetTrust */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1">
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
                 <div className="order-1 md:order-2 bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border border-slate-700 relative">
                     <div className="space-y-6">
                        {/* Animated Review Stream */}
                        <div className="relative">
                            <div className="absolute -top-3 -left-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                <ChatBubbleLeftRightIcon className="w-3 h-3 text-white" />
                            </div>
                            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <StarIcon key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
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
                                
                                {/* AI Typing Response */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1">
                                        <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></div>
                                        <div className="h-2 w-12 bg-blue-400/30 rounded-full animate-pulse delay-100"></div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse delay-200"></div>
                                        <div className="h-2 w-20 bg-blue-400/30 rounded-full animate-pulse delay-300"></div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse delay-400"></div>
                                        <div className="h-2 w-16 bg-blue-400/30 rounded-full animate-pulse delay-500"></div>
                                    </div>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-blue-500/20">
                                    <div className="text-xs text-blue-200 opacity-70 flex items-center justify-between">
                                        <span>Personalized for: Plumbing business</span>
                                        <span className="text-blue-300">✓ Brand voice matched</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Trust Score Visualization */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-white font-medium">Trust Score Impact</span>
                                <span className="text-xs text-pink-300 bg-pink-500/20 px-2 py-1 rounded">+45%</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Before JetTrust</span>
                                    <span className="text-xs text-gray-400">After JetTrust</span>
                                </div>
                                <div className="h-8 rounded-lg bg-slate-800 overflow-hidden flex">
                                    <div className="h-full w-1/3 bg-gradient-to-r from-slate-600 to-slate-700 flex items-center justify-center">
                                        <span className="text-xs text-white">2.8%</span>
                                    </div>
                                    <div className="h-full w-2/3 bg-gradient-to-r from-pink-500 to-rose-600 flex items-center justify-center">
                                        <span className="text-xs text-white">4.1% Conversion</span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 text-center">Showing reviews boosts customer trust</div>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="py-24 px-4 bg-slate-900">
         <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-16">Your Path to More Customers in 10 Minutes/Day</h2>
            
            <div className="grid md:grid-cols-3 gap-8 relative">
                 {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-1 bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 -z-10"></div>
                
                <div className="bg-brand-darker p-8 rounded-2xl border border-slate-800 relative group hover:-translate-y-2 transition-transform">
                    <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-blue-600/30 text-2xl font-bold ring-8 ring-brand-darker">
                        <BoltIcon className="w-8 h-8"/>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">1. Connect & Analyze</h3>
                    <p className="text-gray-400">Connect your business. Our AI audits everything in minutes.</p>
                </div>
                
                 <div className="bg-brand-darker p-8 rounded-2xl border border-slate-800 relative group hover:-translate-y-2 transition-transform">
                    <div className="bg-teal-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-teal-500/30 text-2xl font-bold ring-8 ring-brand-darker">
                        <CheckCircleIcon className="w-8 h-8"/>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">2. Execute Tasks</h3>
                    <p className="text-gray-400">Complete 3-5 simple weekly actions from your Growth Plan.</p>
                </div>
                
                 <div className="bg-brand-darker p-8 rounded-2xl border border-slate-800 relative group hover:-translate-y-2 transition-transform">
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
      <section className="py-24 px-4 bg-[#0B1121]">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Replace $15,000/Month in Services</h2>
                <p className="text-xl text-gray-400">Get the power of an entire agency for less than the cost of lunch.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
                {/* Comparison Table */}
                <div className="bg-slate-800/20 rounded-2xl border border-slate-800 overflow-hidden">
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
                <div className="relative bg-gradient-to-b from-blue-900 to-slate-900 rounded-2xl border border-blue-500 shadow-2xl shadow-blue-900/50 p-8 text-center overflow-hidden transform md:scale-105">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-teal-400"></div>
                    <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/30">BEST VALUE</div>
                    
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
                    
                    <button onClick={() => navigate('/get-started')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 text-lg shadow-lg mb-4">
                        Get Started
                    </button>
                    <p className="text-xs text-gray-500">Get instant access to all 20 growth tools</p>
                </div>
            </div>
        </div>
      </section>

      {/* 7. SOCIAL PROOF */}
      <section className="py-24 px-4 bg-brand-darker">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-bold text-white text-center mb-16">What Local Business Owners Are Saying</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
      <section className="py-24 px-4 bg-slate-900 border-y border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Track Your Progress With One Number</h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                Your Growth Score (0-99) measures your online presence strength and shows exactly what to improve next.
            </p>
            
            <div className="relative inline-block">
                 <div className="w-64 h-64 rounded-full border-[12px] border-slate-800 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-[12px] border-blue-500 border-l-transparent rotate-45"></div>
                    <div className="text-center">
                        <span className="block text-7xl font-bold text-white">82</span>
                        <span className="block text-sm text-gray-400 uppercase tracking-widest mt-2">Excellent</span>
                    </div>
                 </div>
            </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="py-24 px-4 bg-brand-darker">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-bold text-center text-white mb-16">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => <FaqItem key={i} question={faq.q} answer={faq.a} />)}
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="py-24 sm:py-32 px-4 text-center bg-gradient-to-br from-blue-900 via-slate-900 to-brand-darker relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto">
              <h2 className="text-4xl sm:text-6xl font-extrabold text-white mb-6">Start Getting Found Today</h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                  Join 360+ local businesses growing with JetSuite. Start growing today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => navigate('/get-started')} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 text-lg shadow-xl shadow-blue-600/30">
                  Get Started
                </button>
               <button 
  onClick={() => window.open("https://tidycal.com/team/jetsuit/jetsuite-demo", "_blank")}
  className="w-full sm:w-auto bg-transparent border-2 border-slate-600 hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-xl transition-colors duration-300 text-lg"
>
  Schedule a Personalized Demo
</button>
              </div>
          </div>
      </section>
      
    </div>
  );
};
