import React from 'react';
import { JetSuiteLogo } from '../JetSuiteLogo';

interface HeaderProps {
    navigate: (path: string) => void;
    isDarkMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ navigate, isDarkMode = false }) => {
    const bgClass = isDarkMode ? 'bg-brand-darker/80 border-slate-800' : 'bg-white/80 border-slate-200';
    const textClass = isDarkMode ? 'text-gray-300 hover:text-white' : 'text-slate-600 hover:text-slate-900';
    const logoTextClass = isDarkMode ? 'text-white' : 'text-slate-900';
    const subTextClass = isDarkMode ? 'text-gray-400' : 'text-slate-500';

    return (
        <header className={`sticky top-0 z-50 backdrop-blur-lg border-b ${bgClass}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo and Nav Links */}
                    <div className="flex items-center space-x-8">
                        <button onClick={() => navigate('/')} className="flex items-center space-x-2">
                           <JetSuiteLogo className="w-10 h-10"/>
                           <div>
                                <span className={`text-xl font-bold ${logoTextClass}`}>JetSuite</span>
                                <span className={`block text-xs ${subTextClass} -mt-1`}>by Jet Automations</span>
                           </div>
                        </button>
                        <nav className="hidden md:flex items-center space-x-6">
                            <button onClick={() => navigate('/features')} className={`${textClass} transition-colors font-medium`}>Features</button>
                            <button onClick={() => navigate('/how-it-works')} className={`${textClass} transition-colors font-medium`}>How It Works</button>
                            <button onClick={() => navigate('/pricing')} className={`${textClass} transition-colors font-medium`}>Pricing</button>
                            <button onClick={() => navigate('/savings')} className="text-blue-600 hover:text-blue-700 transition-colors font-semibold">Calculate Savings 💰</button>
                            <button onClick={() => navigate('/faq')} className={`${textClass} transition-colors font-medium`}>FAQ</button>
                        </nav>
                    </div>
                    {/* CTAs */}
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate('/login')} className={`hidden sm:inline-block font-medium hover:text-blue-600 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-600'}`}>
                            Login
                        </button>
                        <button onClick={() => navigate('/pricing')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition-colors duration-300 shadow-md shadow-blue-500/20">
                            Get Started
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
