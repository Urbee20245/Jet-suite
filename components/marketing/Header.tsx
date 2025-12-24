
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
                            <button className="text-gray-300 hover:text-white transition-colors font-medium">Features</button>
                            <button onClick={() => navigate('/how-it-works')} className="text-gray-300 hover:text-white transition-colors font-medium">How It Works</button>
                            <button onClick={() => navigate('/pricing')} className="text-gray-300 hover:text-white transition-colors font-medium">Pricing</button>
                            <button onClick={() => navigate('/savings')} className="text-accent-cyan hover:text-accent-purple transition-colors font-semibold">Calculate Savings 💰</button>
                            <button className="text-gray-300 hover:text-white transition-colors font-medium">FAQ</button>
                        </nav>
                    </div>
                    {/* CTAs */}
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate('/login')} className="hidden sm:inline-block text-white font-medium hover:text-gray-200">
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
