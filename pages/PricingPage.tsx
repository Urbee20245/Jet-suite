import React, { useState } from 'react';
import { PricingCalculator } from '../components/marketing/PricingCalculator';
import { CheckCircleIcon, MinusIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon } from '../components/icons/MiniIcons';
import { createCheckoutSession } from '../services/stripeService';
import { Loader } from '../components/Loader';

interface PricingPageProps {
  navigate: (path: string) => void;
}

const PricingFaqItem = ({ question, answer, id }: { question: string, answer: string, id?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div id={id} className="border-b border-slate-700 last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center py-4 text-left focus:outline-none"
            >
                <span className="font-semibold text-white">{question}</span>
                {isOpen 
                    ? <ChevronUpIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    : <ChevronDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                }
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
                <p className="text-gray-400 text-sm leading-relaxed">{answer}</p>
            </div>
        </div>
    );
};

export const PricingPage: React.FC<PricingPageProps> = ({ navigate }) => {
  const [businesses, setBusinesses] = useState(1);
  const [seats, setSeats] = useState(0);  // 0 additional seats (1 included in base)

  // Calculate pricing
  const basePlan = 149;
  const additionalBusinessCost = 49;
  const seatCost = 15;
  
  // Calculate additional businesses (businesses beyond the first one)
  const additionalBusinessCount = Math.max(0, businesses - 1);
  
  // Calculate total: Base plan ($149) + Additional businesses + Additional seats
  const monthlyTotal = basePlan + (additionalBusinessCount * additionalBusinessCost) + (seats * seatCost);

  const handleBusinessChange = (delta: number) => {
    setBusinesses(prev => Math.max(1, prev + delta));
  };

  const handleSeatsChange = (delta: number) => {
    setSeats(prev => Math.max(0, prev + delta));
  };


  return (
    <div className="py-20 sm:py-28 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-300">
            Start your subscription today. One plan, all the tools. No hidden fees, no feature gates.
          </p>

          {/* Founders Pricing Banner */}
          <div className="mt-8 inline-block relative">
            <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-yellow-500/50 rounded-2xl px-8 py-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400"></div>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
                <span className="bg-yellow-500 text-black text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">Founders Price</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-gray-400 line-through text-2xl">$349/mo</span>
                  <span className="text-4xl font-extrabold text-white">$149/mo</span>
                </div>
                <span className="text-yellow-300 text-sm font-semibold">Lock in this price before it's gone!</span>
              </div>
            </div>
          </div>
          
          {/* Savings Calculator CTA */}
          <div className="mt-8">
            <button
              onClick={() => navigate('/savings')}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan hover:opacity-90 text-white font-bold py-3 px-8 rounded-full transition-opacity shadow-lg shadow-accent-purple/30 group"
            >
              <span className="text-lg">💰</span>
              <span>Calculate Your Savings</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <p className="mt-3 text-sm text-gray-400">
              See how much you'll save vs. traditional agencies and tools
            </p>
          </div>
        </div>
        
        {/* Value Prop Banner */}
        <div className="mt-12 bg-gradient-to-r from-accent-purple/10 via-accent-pink/10 to-accent-cyan/10 border border-accent-purple/30 rounded-2xl p-6 text-center">
          <p className="text-xl text-white font-semibold mb-2">
            Replace <span className="text-accent-cyan">$10,000-$35,000/month</span> in agency costs
          </p>
          <p className="text-gray-300">
            Get the same results for a fraction of the price. 
            <button 
              onClick={() => navigate('/savings')}
              className="ml-2 text-accent-purple hover:text-accent-pink font-semibold underline transition-colors"
            >
              See the breakdown →
            </button>
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Pricing Card with Checkout */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-brand-dark p-8 rounded-2xl border border-slate-700 shadow-2xl shadow-accent-purple/10 glow-card glow-card-rounded-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-3xl font-bold text-white">JetSuite Plan</h2>
              <span className="bg-yellow-500 text-black text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">Founders Pricing</span>
            </div>
            <p className="mt-2 text-gray-400 font-medium">All tools included, unlimited usage</p>
            <p className="mt-4 text-gray-300">
              Our core plan gives you everything you need to grow your business from foundation to conversion.
            </p>
            
            <ul className="mt-6 space-y-3 text-gray-200 text-sm">
              <li className="flex items-start"><CheckCircleIcon className="w-5 h-5 text-accent-cyan mr-2 flex-shrink-0 mt-0.5"/><span><span className="font-semibold text-white">Full access</span> to all current and future JetSuite tools.</span></li>
              <li className="flex items-start"><CheckCircleIcon className="w-5 h-5 text-accent-cyan mr-2 flex-shrink-0 mt-0.5"/><span>Guided growth roadmap and prioritized weekly action plans.</span></li>
              <li className="flex items-start"><CheckCircleIcon className="w-5 h-5 text-accent-cyan mr-2 flex-shrink-0 mt-0.5"/><span>AI-powered content generation and optimization.</span></li>
              <li className="flex items-start"><CheckCircleIcon className="w-5 h-5 text-accent-cyan mr-2 flex-shrink-0 mt-0.5"/><span>Comprehensive analytics and reporting.</span></li>
            </ul>

            {/* Configure Your Plan */}
            <div className="mt-8 bg-brand-dark/50 backdrop-blur-sm p-6 rounded-xl border border-slate-600">
              <h3 className="text-lg font-bold text-white mb-4">Configure Your Plan</h3>
              
              {/* Businesses Selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-300">Number of Businesses</label>
                  <span className="text-xs text-gray-400">
                    ${basePlan} base + ${additionalBusinessCost}/mo each additional
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleBusinessChange(-1)}
                    disabled={businesses <= 1}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                  >
                    <MinusIcon className="w-5 h-5" />
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold text-white">{businesses}</div>
                    <div className="text-xs text-gray-400">
                      {businesses === 1 ? 'Business' : 'Businesses'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleBusinessChange(1)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Seats Selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-300">Team Seats</label>
                  <span className="text-xs text-gray-400">
                    1 included + ${seatCost}/mo each additional
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleSeatsChange(-1)}
                    disabled={seats <= 0}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                  >
                    <MinusIcon className="w-5 h-5" />
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold text-white">{seats}</div>
                    <div className="text-xs text-gray-400">
                      Additional {seats === 1 ? 'Seat' : 'Seats'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSeatsChange(1)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="bg-slate-900/50 p-4 rounded-lg space-y-2 text-sm">
                {/* Base Plan - Always $149 */}
                <div className="flex justify-between text-gray-300">
                  <span>Base Plan (includes 1 business, 1 seat)</span>
                  <span className="font-semibold">${basePlan}/mo</span>
                </div>
                
                {/* Additional Businesses */}
                {additionalBusinessCount > 0 && (
                  <div className="flex justify-between text-gray-300">
                    <span>
                      {additionalBusinessCount === 1 
                        ? '1 Additional Business' 
                        : `${additionalBusinessCount} Additional Businesses`}
                    </span>
                    <span className="font-semibold">${additionalBusinessCount * additionalBusinessCost}/mo</span>
                  </div>
                )}
                
                {/* Additional Seats */}
                {seats > 0 && (
                  <div className="flex justify-between text-gray-300">
                    <span>
                      {seats === 1 
                        ? '1 Additional Seat' 
                        : `${seats} Additional Seats`}
                    </span>
                    <span className="font-semibold">${seats * seatCost}/mo</span>
                  </div>
                )}
                
                {/* Total */}
                <div className="border-t border-slate-700 pt-2 mt-2">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-white text-lg">Monthly Total</span>
                    <span className="text-3xl font-extrabold text-white">
                      ${monthlyTotal}
                      <span className="text-lg font-normal text-gray-400">/mo</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-6 mb-6 p-6 bg-brand-darker rounded-xl border border-slate-700 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400"></div>
              <div className="text-sm text-yellow-400 font-semibold mb-2">Introductory Founders Price</div>
              <div className="flex items-baseline justify-center gap-3">
                <span className="text-xl text-gray-500 line-through">${basePlan + 200 + (additionalBusinessCount * additionalBusinessCost) + (seats * seatCost)}</span>
                <span className="text-4xl font-bold text-white">${monthlyTotal}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">Billed Monthly</div>
              <p className="text-xs text-yellow-300/80 mt-2 font-medium">Regular price will be $349/mo base. Lock in your founders rate today!</p>
            </div>

            {/* Checkout Button */}
            <button 
              onClick={() => navigate('/get-started')}
              className="w-full mt-6 bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-4 px-8 rounded-lg transition-opacity duration-300 text-lg shadow-lg shadow-accent-purple/20 flex items-center justify-center gap-3"
            >
              Start Subscription
            </button>
            
            <p className="mt-4 text-center text-sm text-gray-400">
              Cancel anytime. No long-term contracts.
            </p>
            <div className="mt-4 text-center">
              <p className="text-xs text-yellow-400/70 font-medium">
                This introductory founders price won't last long. Regular price: $349/mo.
              </p>
            </div>
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
                        <p className="font-semibold text-white">Additional Team Seats</p>
                        <p className="text-gray-300"><span className="font-bold text-white text-lg">+$15/mo</span> per user</p>
                    </div>
                </div>
            </div>
            <PricingCalculator />
          </div>
        </div>

        {/* 3 Strategic FAQ Additions */}
        <div className="mt-20 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white text-center mb-8">Common Questions</h3>
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
                <PricingFaqItem 
                    question="Can I upgrade or downgrade my plan later?" 
                    answer="Yes, you can add or remove businesses and team seats at any time from your dashboard. Changes are prorated automatically." 
                />
                <PricingFaqItem 
                    question="When will I be charged?" 
                    answer={`You will be charged $${monthlyTotal} immediately upon subscription. Your subscription renews monthly at the same rate.`} 
                />
                <PricingFaqItem 
                    question="Do I need to sign a long-term contract?" 
                    answer="No contracts. JetSuite is a month-to-month subscription. We believe you should stay because you love the product, not because you're locked in." 
                />
            </div>
            <p className="text-center text-gray-500 mt-6 text-sm">
                Have more questions? <button onClick={() => navigate('/faq')} className="text-blue-400 hover:text-blue-300 underline">Visit our full FAQ page</button>
            </p>
        </div>

      </div>
    </div>
  );
};