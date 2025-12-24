import React, { useState, useEffect } from 'react';
import { 
    MagnifyingGlassIcon, 
    ClipboardDocumentCheckIcon, 
    PaintBrushIcon, 
    ChartBarIcon,
    ArrowRightIcon,
    XMarkIcon,
    CheckIcon,
    CalendarIcon,
    ClockIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
    JetBizIcon, 
    JetVizIcon, 
    JetKeywordsIcon, 
    JetCreateIcon, 
    JetImageIcon, 
    JetReplyIcon, 
    GrowthScoreIcon
} from '../components/icons/ToolIcons';

// Custom icons wrapper to use existing project icons or fallbacks
const DiagnoseIcon = () => <JetVizIcon className="w-8 h-8" />;
const StrategizeIcon = () => <ClipboardDocumentCheckIcon className="w-8 h-8" />;
const ExecuteIcon = () => <PaintBrushIcon className="w-8 h-8" />;
const TrackIcon = () => <GrowthScoreIcon className="w-8 h-8" />;

interface HowItWorksPageProps {
  navigate: (path: string) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ navigate }) => {
  const [activePhase, setActivePhase] = useState(0);
  
  // Auto-rotate phases for the hero animation
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePhase((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const phases = [
    { title: "Diagnose", icon: DiagnoseIcon, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-500" },
    { title: "Strategize", icon: StrategizeIcon, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-400" },
    { title: "Execute", icon: ExecuteIcon, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-500" },
    { title: "Track", icon: TrackIcon, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-500" }
  ];

  return (
    <div className="bg-white text-slate-600 font-sans overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative py-24 sm:py-32 px-4 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-100/50 rounded-full blur-[120px] -z-10"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-8">
                From Marketing Chaos to <br className="hidden sm:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                    Consistent Growth
                </span>
            </h1>
            
            <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 leading-relaxed">
                Most tools show you problems. JetSuite solves them. Here's exactly how our AI-powered system transforms your online presence in 90 days.
            </p>

            {/* Animated Timeline Visual */}
            <div className="mt-16 relative h-32 max-w-3xl mx-auto hidden md:flex items-center justify-between px-12">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10"></div>
                <div 
                    className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 via-teal-400 to-pink-500 -z-10 transition-all duration-1000 ease-in-out"
                    style={{ width: `${(activePhase / 3) * 100}%` }}
                ></div>

                {phases.map((phase, index) => (
                    <div 
                        key={index}
                        className={`relative z-10 flex flex-col items-center transition-all duration-500 ${index <= activePhase ? 'opacity-100 scale-110' : 'opacity-40 scale-100'}`}
                    >
                        <div className={`w-16 h-16 rounded-full ${index <= activePhase ? 'bg-white border-2 ' + phase.border : 'bg-slate-100 border border-slate-200'} flex items-center justify-center shadow-xl transition-colors duration-300`}>
                            <div className={phase.color}>
                                <phase.icon />
                            </div>
                        </div>
                        <span className={`mt-4 font-bold ${index <= activePhase ? 'text-slate-900' : 'text-slate-400'}`}>{phase.title}</span>
                    </div>
                ))}
            </div>

            {/* Mobile Timeline Fallback */}
             <div className="mt-12 md:hidden flex justify-center space-x-2">
                 {phases.map((p, i) => (
                     <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activePhase ? 'w-8 bg-blue-600' : 'w-2 bg-slate-300'}`}></div>
                 ))}
                 <p className="w-full text-center text-slate-900 font-bold mt-2">{phases[activePhase].title}</p>
             </div>

            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => navigate('/login')} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 text-lg shadow-lg shadow-blue-600/25">
                    Get Your Free Growth Score Analysis
                </button>
                <button onClick={() => navigate('/pricing')} className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 font-semibold py-4 px-8 rounded-xl transition-all duration-300 text-lg border border-slate-200 shadow-sm">
                    See Pricing & Plans
                </button>
            </div>
        </div>
      </section>

      {/* 2. THE PROBLEM vs SOLUTION */}
      <section className="py-24 px-4 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
             <div className="grid md:grid-cols-2 gap-0 border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
                 
                 {/* LEFT: THE CHAOS */}
                 <div className="bg-[#1e293b] p-8 md:p-12 relative overflow-hidden group text-white">
                     {/* Chaos Background Elements */}
                     <div className="absolute top-10 left-10 opacity-10 rotate-12 transform group-hover:rotate-45 transition-transform duration-1000">
                         <ExclamationTriangleIcon className="w-64 h-64 text-red-500" />
                     </div>
                     
                     <div className="relative z-10">
                         <h2 className="text-2xl font-bold text-red-400 mb-2">The Old Way</h2>
                         <h3 className="text-3xl font-bold text-white mb-8">Scattered, Overwhelming, Ineffective</h3>
                         
                         <div className="space-y-4 mb-8">
                             <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-lg border border-red-500/20">
                                 <div className="bg-red-500/20 p-2 rounded text-red-400"><ClockIcon className="w-6 h-6"/></div>
                                 <span className="text-gray-300">Wasting 15+ hours/week managing tools</span>
                             </div>
                             <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-lg border border-red-500/20">
                                 <div className="bg-red-500/20 p-2 rounded text-red-400"><ExclamationTriangleIcon className="w-6 h-6"/></div>
                                 <span className="text-gray-300">Conflicting advice from "gurus"</span>
                             </div>
                             <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-lg border border-red-500/20">
                                 <div className="bg-red-500/20 p-2 rounded text-red-400"><XMarkIcon className="w-6 h-6"/></div>
                                 <span className="text-gray-300">Inconsistent branding & forgotten reviews</span>
                             </div>
                         </div>
                         <p className="text-gray-400 italic">"You work hard but see no results."</p>
                     </div>
                 </div>

                 {/* RIGHT: THE SYSTEM */}
                 <div className="bg-white p-8 md:p-12 relative overflow-hidden">
                     <div className="absolute inset-0 bg-blue-50/50"></div>
                     
                     <div className="relative z-10">
                         <h2 className="text-2xl font-bold text-blue-600 mb-2">The JetSuite Way</h2>
                         <h3 className="text-3xl font-bold text-slate-900 mb-8">Systematic, Clear, Effective</h3>
                         
                         <div className="space-y-4 mb-8">
                             <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                                 <div className="bg-blue-50 p-2 rounded text-blue-600"><CheckIcon className="w-6 h-6"/></div>
                                 <span className="text-slate-700 font-medium">3 prioritized tasks per week</span>
                             </div>
                             <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                                 <div className="bg-blue-50 p-2 rounded text-blue-600"><ChartBarIcon className="w-6 h-6"/></div>
                                 <span className="text-slate-700 font-medium">One dashboard for everything</span>
                             </div>
                             <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                                 <div className="bg-blue-50 p-2 rounded text-blue-600"><ArrowRightIcon className="w-6 h-6"/></div>
                                 <span className="text-slate-700 font-medium">Automated growth & consistent results</span>
                             </div>
                         </div>
                         <p className="text-slate-600 font-medium">"You know exactly what to do to grow."</p>
                     </div>
                 </div>
             </div>
        </div>
      </section>

      {/* 3. THE 4-PHASE SYSTEM */}
      <section className="py-24 px-4 bg-white relative">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
                <span className="text-blue-600 font-bold uppercase tracking-wider">The Process</span>
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mt-2">How We Build Your Online Empire</h2>
            </div>

            {/* PHASE 1: DIAGNOSE */}
            <div className="flex flex-col md:flex-row gap-12 items-center mb-24 relative">
                <div className="md:w-1/2 relative z-10">
                    <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">WEEK 1</div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-4">Phase 1: Diagnose</h3>
                    <p className="text-xl text-blue-600 mb-6 font-medium">Complete Honest Audit</p>
                    <p className="text-slate-600 mb-6 leading-relaxed">
                        We stop the guessing game. JetSuite connects to your Google Business Profile and website to run a deep-dive audit. We analyze over 200 data points to find exactly what's holding you back.
                    </p>
                    <ul className="space-y-3 text-slate-600">
                        <li className="flex items-start"><CheckIcon className="w-5 h-5 text-blue-600 mr-2 mt-1"/><span>JetBiz scans your Google Business Profile health</span></li>
                        <li className="flex items-start"><CheckIcon className="w-5 h-5 text-blue-600 mr-2 mt-1"/><span>JetViz analyzes website speed, SEO, and trust</span></li>
                        <li className="flex items-start"><CheckIcon className="w-5 h-5 text-blue-600 mr-2 mt-1"/><span>JetCompete reveals why competitors are outranking you</span></li>
                    </ul>
                </div>
                <div className="md:w-1/2">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xl relative">
                         {/* Mockup */}
                         <div className="flex justify-between items-center mb-6">
                             <div>
                                 <div className="h-4 w-32 bg-slate-100 rounded mb-2"></div>
                                 <div className="h-6 w-48 bg-slate-200 rounded"></div>
                             </div>
                             <div className="text-right">
                                 <div className="text-4xl font-bold text-red-500">34<span className="text-sm text-slate-400 ml-1">/100</span></div>
                                 <div className="text-xs text-red-500 font-bold uppercase">Critical Issues Found</div>
                             </div>
                         </div>
                         <div className="space-y-3">
                             <div className="bg-slate-50 p-3 rounded border border-red-200 flex justify-between items-center">
                                 <span className="text-slate-700 text-sm">Missing Business Categories</span>
                                 <span className="text-red-500 text-xs font-bold">HIGH IMPACT</span>
                             </div>
                             <div className="bg-slate-50 p-3 rounded border border-yellow-200 flex justify-between items-center">
                                 <span className="text-slate-700 text-sm">Slow Mobile Page Load</span>
                                 <span className="text-yellow-500 text-xs font-bold">MEDIUM IMPACT</span>
                             </div>
                             <div className="bg-slate-50 p-3 rounded border border-slate-200 flex justify-between items-center">
                                 <span className="text-slate-700 text-sm">Inconsistent NAP Data</span>
                                 <span className="text-slate-500 text-xs font-bold">LOW IMPACT</span>
                             </div>
                         </div>
                    </div>
                </div>
                {/* Connector Line */}
                <div className="hidden md:block absolute left-1/2 bottom-[-48px] h-12 w-0.5 bg-slate-200"></div>
            </div>

            {/* PHASE 2: STRATEGIZE */}
            <div className="flex flex-col md:flex-row-reverse gap-12 items-center mb-24 relative">
                <div className="md:w-1/2 relative z-10">
                    <div className="bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">WEEK 2</div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-4">Phase 2: Strategize</h3>
                    <p className="text-xl text-teal-600 mb-6 font-medium">AI-Powered Prioritization</p>
                    <p className="text-slate-600 mb-6 leading-relaxed">
                        Data without a plan is useless. Our Growth Plan Engine takes the thousands of issues found and prioritizes them by "Impact vs. Effort." You get a simple, sequenced checklist.
                    </p>
                    <ul className="space-y-3 text-slate-600">
                        <li className="flex items-start"><CheckIcon className="w-5 h-5 text-teal-500 mr-2 mt-1"/><span>Deduplicates overlapping issues</span></li>
                        <li className="flex items-start"><CheckIcon className="w-5 h-5 text-teal-500 mr-2 mt-1"/><span>Sequences tasks logically (Foundation first)</span></li>
                        <li className="flex items-start"><CheckIcon className="w-5 h-5 text-teal-500 mr-2 mt-1"/><span>Assigns estimated completion times</span></li>
                    </ul>
                </div>
                <div className="md:w-1/2">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xl relative">
                        <div className="mb-4">
                            <h4 className="text-slate-900 font-bold mb-1">Weekly Growth Plan</h4>
                            <p className="text-xs text-slate-500">Focus on these 3 tasks to improve your score.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-gradient-to-r from-slate-50 to-white p-4 rounded-lg border-l-4 border-teal-500 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="text-slate-800 font-semibold text-sm">Update Business Hours</h5>
                                    <span className="bg-teal-50 text-teal-600 text-[10px] px-2 py-0.5 rounded">5 MIN</span>
                                </div>
                                <p className="text-slate-500 text-xs">Your hours on Facebook don't match Google.</p>
                            </div>
                            <div className="bg-gradient-to-r from-slate-50 to-white p-4 rounded-lg border-l-4 border-teal-500 shadow-sm opacity-80">
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="text-slate-800 font-semibold text-sm">Respond to 3 Reviews</h5>
                                    <span className="bg-teal-50 text-teal-600 text-[10px] px-2 py-0.5 rounded">10 MIN</span>
                                </div>
                                <p className="text-slate-500 text-xs">Recent reviews need your attention.</p>
                            </div>
                            <div className="bg-gradient-to-r from-slate-50 to-white p-4 rounded-lg border-l-4 border-teal-500 shadow-sm opacity-60">
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="text-slate-800 font-semibold text-sm">Add 5 Photos</h5>
                                    <span className="bg-teal-50 text-teal-600 text-[10px] px-2 py-0.5 rounded">15 MIN</span>
                                </div>
                                <p className="text-slate-500 text-xs">Profiles with photos get 42% more requests.</p>
                            </div>
                        </div>
                    </div>
                </div>
                 {/* Connector Line */}
                <div className="hidden md:block absolute left-1/2 bottom-[-48px] h-12 w-0.5 bg-slate-200"></div>
            </div>

            {/* PHASE 3: EXECUTE */}
            <div className="flex flex-col md:flex-row gap-12 items-center mb-24 relative">
                <div className="md:w-1/2 relative z-10">
                    <div className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">WEEKS 3-8</div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-4">Phase 3: Execute</h3>
                    <p className="text-xl text-purple-600 mb-6 font-medium">AI Creates, You Review</p>
                    <p className="text-slate-600 mb-6 leading-relaxed">
                        Knowing what to do is half the battle. Doing it is the other half. JetSuite's AI tools handle 80% of the workload. You just review, approve, and hit publish.
                    </p>
                    <ul className="space-y-3 text-slate-600">
                        <li className="flex items-start"><CheckIcon className="w-5 h-5 text-purple-500 mr-2 mt-1"/><span>JetCreate writes optimized posts & emails</span></li>
                        <li className="flex items-start"><CheckIcon className="w-5 h-5 text-purple-500 mr-2 mt-1"/><span>JetImage generates professional visuals</span></li>
                        <li className="flex items-start"><CheckIcon className="w-5 h-5 text-purple-500 mr-2 mt-1"/><span>JetReply drafts perfect review responses</span></li>
                    </ul>
                </div>
                <div className="md:w-1/2">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xl relative">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-1/2 bg-slate-50 p-3 rounded border border-slate-200">
                                <div className="text-xs text-purple-600 font-bold mb-2">AI GENERATING...</div>
                                <div className="space-y-2 animate-pulse">
                                    <div className="h-2 w-full bg-slate-200 rounded"></div>
                                    <div className="h-2 w-3/4 bg-slate-200 rounded"></div>
                                    <div className="h-2 w-5/6 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                            <div className="text-slate-400"><ArrowRightIcon className="w-6 h-6"/></div>
                             <div className="w-1/2 bg-white p-3 rounded border border-blue-200 shadow-sm">
                                <div className="text-xs text-green-600 font-bold mb-2">READY TO PUBLISH</div>
                                <p className="text-[10px] text-slate-700 leading-tight">
                                    "Check out our new summer specials! ☀️ We're offering 20% off all AC tune-ups this week..."
                                </p>
                                <button className="mt-2 w-full bg-blue-600 text-white text-[10px] py-1 rounded">Publish Now</button>
                            </div>
                        </div>
                    </div>
                </div>
                 {/* Connector Line */}
                <div className="hidden md:block absolute left-1/2 bottom-[-48px] h-12 w-0.5 bg-slate-200"></div>
            </div>

            {/* PHASE 4: TRACK */}
             <div className="flex flex-col md:flex-row-reverse gap-12 items-center relative">
                <div className="md:w-1/2 relative z-10">
                    <div className="bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">ONGOING</div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-4">Phase 4: Track</h3>
                    <p className="text-xl text-pink-600 mb-6 font-medium">Progress You Can See</p>
                    <p className="text-slate-600 mb-6 leading-relaxed">
                        No more wondering if your marketing is working. The numbers prove it. Watch your Growth Score climb as you complete tasks, and see real customers start flowing in.
                    </p>
                    <ul className="space-y-3 text-slate-600">
                        <li className="flex items-start"><CheckIcon className="w-5 h-5 text-pink-500 mr-2 mt-1"/><span>Growth Score updates weekly</span></li>
                        <li className="flex items-start"><CheckIcon className="w-5 h-5 text-pink-500 mr-2 mt-1"/><span>Monthly re-audits find new opportunities</span></li>
                        <li className="flex items-start"><CheckIcon className="w-5 h-5 text-pink-500 mr-2 mt-1"/><span>System adapts as you grow</span></li>
                    </ul>
                </div>
                <div className="md:w-1/2">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xl relative">
                        <div className="h-48 flex items-end justify-between gap-2">
                             <div className="w-full flex flex-col items-center gap-1 group">
                                 <div className="text-xs text-slate-400 mb-1 group-hover:text-slate-600 transition-colors">W1</div>
                                 <div className="w-full bg-slate-200 h-16 rounded-t-sm group-hover:bg-red-500 transition-colors relative">
                                     <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-slate-600 text-xs font-bold opacity-0 group-hover:opacity-100">34</span>
                                 </div>
                             </div>
                             <div className="w-full flex flex-col items-center gap-1 group">
                                 <div className="text-xs text-slate-400 mb-1 group-hover:text-slate-600 transition-colors">W4</div>
                                 <div className="w-full bg-slate-200 h-24 rounded-t-sm group-hover:bg-yellow-500 transition-colors relative">
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-slate-600 text-xs font-bold opacity-0 group-hover:opacity-100">58</span>
                                 </div>
                             </div>
                             <div className="w-full flex flex-col items-center gap-1 group">
                                 <div className="text-xs text-slate-400 mb-1 group-hover:text-slate-600 transition-colors">W8</div>
                                 <div className="w-full bg-slate-200 h-32 rounded-t-sm group-hover:bg-blue-500 transition-colors relative">
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-slate-600 text-xs font-bold opacity-0 group-hover:opacity-100">72</span>
                                 </div>
                             </div>
                             <div className="w-full flex flex-col items-center gap-1 group">
                                 <div className="text-xs text-slate-400 mb-1 group-hover:text-slate-600 transition-colors">W12</div>
                                 <div className="w-full bg-gradient-to-t from-pink-600 to-purple-500 h-40 rounded-t-sm shadow-[0_0_15px_rgba(236,72,153,0.3)] relative">
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-slate-900 text-xs font-bold">84</span>
                                 </div>
                             </div>
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-sm font-bold text-slate-900">Your Growth Journey</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </section>

      {/* 4. REAL BUSINESS STORY */}
      <section className="py-24 px-4 bg-slate-50 border-t border-slate-200">
          <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-slate-900">How 'Triad Mechanical' Went From Invisible to #1</h2>
                  <p className="text-slate-600 mt-2">A real result from the JetSuite system.</p>
              </div>
              
              <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 shadow-xl">
                  <div className="grid md:grid-cols-4 gap-8">
                      <div className="text-center md:text-left">
                          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto md:mx-0">🔧</div>
                          <h3 className="text-xl font-bold text-slate-900">Triad Mechanical</h3>
                          <p className="text-sm text-slate-500">HVAC Service • Winder, GA</p>
                      </div>
                      <div className="col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                              <p className="text-xs text-slate-500 uppercase font-bold mb-2">WEEK 1</p>
                              <div className="text-3xl font-bold text-red-500 mb-1">28<span className="text-sm text-slate-500 ml-1">/100</span></div>
                              <p className="text-xs text-slate-500">"Invisible online. No photos. Wrong phone number listed."</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                              <p className="text-xs text-slate-500 uppercase font-bold mb-2">WEEK 6</p>
                              <div className="text-3xl font-bold text-yellow-500 mb-1">67<span className="text-sm text-slate-500 ml-1">/100</span></div>
                              <p className="text-xs text-slate-500">"Ranking on page 2. 20 photos added. Reviews responding."</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-xl border border-blue-200 shadow-sm">
                              <p className="text-xs text-blue-600 uppercase font-bold mb-2">WEEK 12</p>
                              <div className="text-3xl font-bold text-blue-600 mb-1">84<span className="text-sm text-slate-500 ml-1">/100</span></div>
                              <p className="text-xs text-slate-600">"#3 for 'HVAC repair'. Calls increased by 40%."</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* 5. FINAL CTA */}
      <section className="py-24 px-4 text-center bg-gradient-to-br from-blue-900 via-slate-900 to-brand-darker relative overflow-hidden text-white">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">Ready to start your Phase 1?</h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                  See exactly where you stand in under 2 minutes. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => navigate('/login')} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 text-lg shadow-xl shadow-blue-600/30">
                  Get Your Free Analysis
                </button>
              </div>
          </div>
      </section>
    </div>
  );
};
