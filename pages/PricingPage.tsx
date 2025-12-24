
import React, { useState } from 'react';
import { PricingCalculator } from '../components/marketing/PricingCalculator';
import { CheckCircleIcon, MinusIcon, PlusIcon } from '../components/icons/MiniIcons';
import { createCheckoutSession } from '../services/stripeService';
import { Loader } from '../components/Loader';

interface PricingPageProps {
  navigate: (path: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ navigate }) => {
  const [businesses, setBusinesses] = useState(1);
 const [seats, setSeats] = useState(0);  // 0 additional seats (1 included in base)
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Calculate pricing
  const basePlan = 149;
  const additionalBusinessCost = 49;
  const seatCost = 15;
  
  const additionalBusinessCount = Math.max(0, businesses - 1);
  const monthlyTotal = basePlan + (additionalBusinessCost * additionalBusinessCount) + (seatCost * seats);

  const handleBusinessChange = (delta: number) => {
    setBusinesses(prev => Math.max(1, prev + delta));
  };

  const handleSeatsChange = (delta: number) => {
 setSeats(prev => Math.max(0, prev + delta));  // Allow 0 additional seats
  };

  const handleCheckout = async () => {
    setCheckoutError(null);
    
    // For demo purposes, use a placeholder email
    // In production, this should come from login state or a form
    const userEmail = localStorage.getItem('jetsuite_userEmail') || 'user@example.com';
    
    if (!userEmail || userEmail === 'user@example.com') {
      // User not logged in, redirect to login first
      alert('Please log in first to start your subscription.');
      navigate('/login');
      return;
    }

    try {
      setIsCheckingOut(true);
      
      const { url } = await createCheckoutSession({
        userId: userEmail,
        email: userEmail,
       seatCount: seats, // seats already represents additional seats beyond the 1 included
        additionalBusinessCount: additionalBusinessCount,
      });

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      setCheckoutError(error.message || 'Failed to start checkout. Please try again.');
      setIsCheckingOut(false);
    }
  };
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
            <h2 className="text-3xl font-bold text-white">JetSuite Plan</h2>
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
                      {seats === 1 ? 'Seat' : 'Seats'}
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
                <div className="flex justify-between text-gray-300">
                  <span>Base Plan ({businesses === 1 ? '1 business' : `${businesses} businesses`})</span>
                  <span>${basePlan + (additionalBusinessCost * additionalBusinessCount)}/mo</span>
                </div>
                {additionalBusinessCount > 0 && (
                  <div className="flex justify-between text-gray-400 text-xs pl-4">
                    <span>• Base (1 business)</span>
                    <span>${basePlan}</span>
                  </div>
                )}
                {additionalBusinessCount > 0 && (
                  <div className="flex justify-between text-gray-400 text-xs pl-4">
                    <span>• Additional ({additionalBusinessCount} × ${additionalBusinessCost})</span>
                    <span>${additionalBusinessCost * additionalBusinessCount}</span>
                  </div>
                )}
               <div className="flex justify-between text-gray-300">
  <span>Team Seats ({seats === 0 ? '1 included' : `${seats + 1} total`})</span>
  <span>${seatCost * seats}/mo</span>
</div>
{seats === 0 && (
  <div className="flex justify-between text-gray-400 text-xs pl-4">
    <span>• 1 seat included in base plan</span>
    <span>$0</span>
  </div>
)}
{seats > 0 && (
  <div className="flex justify-between text-gray-400 text-xs pl-4">
    <span>• Included (1 seat)</span>
    <span>$0</span>
  </div>
)}
{seats > 0 && (
  <div className="flex justify-between text-gray-400 text-xs pl-4">
    <span>• Additional ({seats} × ${seatCost})</span>
    <span>${seatCost * seats}</span>
  </div>
)}
                <div className="border-t border-slate-700 pt-2 mt-2">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-white text-lg">Monthly Total</span>
                    <span className="text-3xl font-extrabold text-white">${monthlyTotal}<span className="text-lg font-normal text-gray-400">/mo</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            {checkoutError && (
              <div className="mt-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
                {checkoutError}
              </div>
            )}
            
            <button 
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full mt-6 bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 disabled:opacity-50 text-white font-bold py-4 px-8 rounded-lg transition-opacity duration-300 text-lg shadow-lg shadow-accent-purple/20 flex items-center justify-center gap-3"
            >
              {isCheckingOut ? (
                <>
                  <Loader />
                  <span>Starting Checkout...</span>
                </>
              ) : (
                <>
                  <span>Start Subscription - ${monthlyTotal}/mo</span>
                </>
              )}
            </button>
            
            <p className="mt-4 text-center text-sm text-gray-400">
              Cancel anytime. No refunds.
            </p>
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
      </div>
    </div>
  );
};
