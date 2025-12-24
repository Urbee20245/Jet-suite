
import React from 'react';
import { JetSuiteLogo } from '../JetSuiteLogo';

interface HeaderProps {
    navigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ navigate }) => {
    return (
        <header className="sticky top-0 z-50 bg-brand-darker/80 backdrop-blur-lg border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo and Nav Links */}
                    <div className="flex items-center space-x-8">
                        <button onClick={() => navigate('/')} className="flex items-center space-x-2">
                           <JetSuiteLogo className="w-10 h-10"/>
                           <div>
                                <span className="text-xl font-bold text-white">JetSuite</span>
                                <span className="block text-xs text-gray-400 -mt-1">by Jet Automations</span>
                           </div>
                        </button>
                        <nav className="hidden md:flex items-center space-x-6">
                            <button onClick={() => navigate('/features')} className="text-gray-300 hover:text-white transition-colors font-medium">Features</button>
                            <button onClick={() => navigate('/how-it-works')} className="text-gray-300 hover:text-white transition-colors font-medium">How It Works</button>
                            <button onClick={() => navigate('/pricing')} className="text-gray-300 hover:text-white transition-colors font-medium">Pricing</button>
                            <button onClick={() => navigate('/savings')} className="text-accent-cyan hover:text-accent-purple transition-colors font-semibold">Calculate Savings 💰</button>
                            <button onClick={() => navigate('/faq')} className="text-gray-300 hover:text-white transition-colors font-medium">FAQ</button>
                        </nav>
                    </div>
                    {/* CTAs */}
                    <div className="flex items-center space-x-4">
                        {/* Try Free Tools Dropdown */}
                        <div className="relative group">
                            <button className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1">
                                Try Free Tools
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                <button 
                                onClick={() => navigate('/demo/jetbiz')}
                                className="block w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-slate-700 hover:text-white transition-colors rounded-t-lg"
                                >
                                <div className="font-semibold">JetBiz Demo</div>
                                <div className="text-xs text-gray-500">Google Business Analyzer</div>
                                </button>
                                <button 
                                onClick={() => navigate('/demo/jetviz')}
                                className="block w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-slate-700 hover:text-white transition-colors border-t border-slate-700 rounded-b-lg"
                                >
                                <div className="font-semibold">JetViz Demo</div>
                                <div className="text-xs text-gray-500">Website Visual Analyzer</div>
                                </button>
                            </div>
                        </div>

                        <button onClick={() => navigate('/login')} className="hidden sm:inline-block text-white font-medium hover:text-gray-200">
                            Login
                        </button>
                        <button onClick={() => navigate('/pricing')} className="bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-opacity shadow-lg">
                            Get Started
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
