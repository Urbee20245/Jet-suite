
import React from 'react';
import { PricingCalculator } from '../components/marketing/PricingCalculator';

interface SavingsPageProps {
  navigate: (path: string) => void;
}

export const SavingsPage: React.FC<SavingsPageProps> = ({ navigate }) => {
  return (
    <div className="py-20 sm:py-28 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
            Calculate Your Savings
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-300">
            See how much you'll invest in growing your business with JetSuite's all-in-one marketing platform.
          </p>
        </div>
        
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calculator */}
          <div>
            <PricingCalculator />
          </div>

          {/* Value Breakdown */}
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 glow-card glow-card-rounded-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">What You Get</h3>
            <div className="space-y-4">
              <div className="bg-brand-dark p-4 rounded-lg">
                <p className="font-semibold text-white">Base Plan - $149/mo</p>
                <ul className="mt-2 text-sm text-gray-300 space-y-1">
                  <li>• 1 Business Profile</li>
                  <li>• 1 Team Member</li>
                  <li>• All JetSuite Tools</li>
                  <li>• Unlimited AI Generation</li>
                </ul>
              </div>
              
              <div className="bg-brand-dark p-4 rounded-lg">
                <p className="font-semibold text-white">Additional Businesses - $49/mo each</p>
                <p className="text-sm text-gray-300 mt-1">Scale your agency or manage multiple brands</p>
              </div>
              
              <div className="bg-brand-dark p-4 rounded-lg">
                <p className="font-semibold text-white">Team Members - $10/mo each</p>
                <p className="text-sm text-gray-300 mt-1">Collaborate with your marketing team</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-700">
              <p className="text-sm text-gray-400 mb-4">Compare to hiring:</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Marketing Manager</span>
                  <span className="text-white font-semibold">~$5,000/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Content Writer</span>
                  <span className="text-white font-semibold">~$3,000/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">SEO Specialist</span>
                  <span className="text-white font-semibold">~$4,000/mo</span>
                </div>
                <div className="flex justify-between border-t border-slate-600 pt-2 mt-2">
                  <span className="text-white font-bold">JetSuite</span>
                  <span className="text-accent-purple font-bold text-lg">$149/mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button 
            onClick={() => navigate('/pricing')} 
            className="bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-4 px-8 rounded-lg transition-opacity duration-300 text-lg shadow-lg shadow-accent-purple/20"
          >
            View Full Pricing
          </button>
          <p className="mt-4 text-gray-400">
            Ready to get started? <button onClick={() => navigate('/login')} className="text-accent-purple font-semibold hover:underline">Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
};
