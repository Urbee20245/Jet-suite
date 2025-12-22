
import React from 'react';
import { PricingCalculator } from '../components/marketing/PricingCalculator';
import { CheckCircleIcon } from '../components/icons/MiniIcons';

interface PricingPageProps {
  navigate: (path: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ navigate }) => {
  return (
    <div className="py-20 sm:py-28 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-300">
            One plan, all the tools. No hidden fees, no feature gates. Just pure growth potential, priced per business.
          </p>
        </div>
        
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Pricing Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-brand-dark p-8 rounded-2xl border border-slate-700 shadow-2xl shadow-accent-purple/10 glow-card glow-card-rounded-2xl">
            <h2 className="text-3xl font-bold text-white">1 Business Plan</h2>
            <div className="flex items-baseline gap-4 mt-4">
              <span className="text-5xl font-extrabold text-white">$99<span className="text-lg font-medium text-gray-400">/mo</span></span>
              <span className="text-2xl font-medium text-gray-500 line-through">$149</span>
            </div>
            <p className="mt-2 text-accent-purple font-semibold">Founding Price</p>
            <p className="mt-6 text-gray-300">
              Our core plan gives you everything you need to grow one business from foundation to conversion.
            </p>
            <ul className="mt-8 space-y-4 text-gray-200">
              <li className="flex items-start"><CheckCircleIcon className="w-6 h-6 text-accent-cyan mr-3 flex-shrink-0"/><span><span className="font-semibold text-white">Full access</span> to all current and future JetSuite tools.</span></li>
              <li className="flex items-start"><CheckCircleIcon className="w-6 h-6 text-accent-cyan mr-3 flex-shrink-0"/><span><span className="font-semibold text-white">1 business profile</span> included to power your AI tools.</span></li>
              <li className="flex items-start"><CheckCircleIcon className="w-6 h-6 text-accent-cyan mr-3 flex-shrink-0"/><span><span className="font-semibold text-white">1 user seat</span> for you or your primary marketing lead.</span></li>
              <li className="flex items-start"><CheckCircleIcon className="w-6 h-6 text-accent-cyan mr-3 flex-shrink-0"/><span>Guided growth roadmap and prioritized weekly action plans.</span></li>
            </ul>
             <button onClick={() => navigate('/login')} className="w-full mt-10 bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-4 px-8 rounded-lg transition-opacity duration-300 text-lg shadow-lg shadow-accent-purple/20">
              Start Growing
            </button>
          </div>

          {/* Calculator and Add-ons */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 glow-card glow-card-rounded-2xl">
                <h3 className="font-bold text-white">Add-Ons</h3>
                <div className="mt-4 space-y-3">
                    <div className="bg-brand-dark p-4 rounded-lg">
                        <p className="font-semibold text-white">Additional Business Profiles</p>
                        <p className="text-gray-300"><span className="font-bold text-white text-lg">+$49/mo</span> each</p>
                    </div>
                    <div className="bg-brand-dark p-4 rounded-lg">
                        <p className="font-semibold text-white">Additional Team Members</p>
                        <p className="text-gray-300"><span className="font-bold text-white text-lg">+$10/mo</span> per user</p>
                    </div>
                </div>
            </div>
            <PricingCalculator />
          </div>
        </div>
      </div>
    </div>
  );
};
