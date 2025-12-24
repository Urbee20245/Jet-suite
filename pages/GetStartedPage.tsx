import React, { useState } from 'react';
import { MinusIcon, PlusIcon } from '../components/icons/MiniIcons';

interface GetStartedPageProps {
  navigate: (path: string) => void;
}

export const GetStartedPage: React.FC<GetStartedPageProps> = ({ navigate }) => {
  // Customer info state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  
  // Pricing state
  const [businesses, setBusinesses] = useState(1);
  const [seats, setSeats] = useState(0);
  
  // Loading state
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pricing constants
  const basePlan = 149;
  const additionalBusinessCost = 49;
  const seatCost = 15;
  
  // Calculate totals
  const additionalBusinessCount = Math.max(0, businesses - 1);
  const total = basePlan + (additionalBusinessCost * additionalBusinessCount) + (seatCost * seats);

  const handleBusinessChange = (delta: number) => {
    setBusinesses(prev => Math.max(1, prev + delta));
  };

  const handleSeatsChange = (delta: number) => {
    setSeats(prev => Math.max(0, prev + delta));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate required fields
    if (!firstName || !lastName || !email || !businessName) {
      setError('Please fill in all required fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create Stripe checkout session with all customer info
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          seatCount: seats,
          additionalBusinessCount: additionalBusinessCount,
          metadata: {
            firstName,
            lastName,
            businessName,
            phone,
            website,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      setError(error.message || 'Failed to start checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Get Started with JetSuite
          </h1>
          <p className="text-xl text-gray-300">
            Complete the form below to proceed to secure payment
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT SIDE - Customer Information */}
            <div className="bg-brand-card border border-slate-700 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Your Information</h2>
              
              <div className="space-y-4">
                {/* First Name & Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      First Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      required
                      className="w-full bg-brand-darker border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-accent-purple focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Last Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Smith"
                      required
                      className="w-full bg-brand-darker border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-accent-purple focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@yourbusiness.com"
                    required
                    className="w-full bg-brand-darker border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-accent-purple focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll send your login credentials to this email after payment
                  </p>
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Business Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your Business LLC"
                    required
                    className="w-full bg-brand-darker border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-accent-purple focus:border-transparent"
                  />
                </div>

                {/* Phone (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full bg-brand-darker border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-accent-purple focus:border-transparent"
                  />
                </div>

                {/* Website (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourbusiness.com"
                    className="w-full bg-brand-darker border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-accent-purple focus:border-transparent"
                  />
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-6 bg-brand-darker border border-slate-600 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-sm mb-1">Secure Checkout</h3>
                    <p className="text-xs text-gray-400">
                      Payment processed securely via Stripe. We never see or store your card details. Your account will be created automatically after successful payment.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE - Plan Configuration */}
            <div>
              {/* Configure Plan */}
              <div className="bg-brand-card border border-slate-700 rounded-2xl p-8 mb-6">
                <h2 className="text-2xl font-bold text-white mb-6">Configure Your Plan</h2>
                
                {/* Businesses Selector */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-300">Number of Businesses</label>
                    <span className="text-xs text-gray-400">
                      ${basePlan} base + ${additionalBusinessCost}/mo additional
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleBusinessChange(-1)}
                      disabled={businesses <= 1}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-brand-darker hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors border border-slate-600"
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
                      type="button"
                      onClick={() => handleBusinessChange(1)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-brand-darker hover:bg-slate-600 text-white transition-colors border border-slate-600"
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
                      1 included + ${seatCost}/mo additional
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleSeatsChange(-1)}
                      disabled={seats <= 0}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-brand-darker hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors border border-slate-600"
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
                      type="button"
                      onClick={() => handleSeatsChange(1)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-brand-darker hover:bg-slate-600 text-white transition-colors border border-slate-600"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="bg-brand-darker rounded-lg p-6 space-y-3">
                  <div className="flex justify-between text-gray-300 text-sm">
                    <span>Base Plan (1 business, 1 seat)</span>
                    <span>${basePlan}/mo</span>
                  </div>
                  
                  {additionalBusinessCount > 0 && (
                    <div className="flex justify-between text-gray-300 text-sm">
                      <span>Additional Businesses ({additionalBusinessCount} × ${additionalBusinessCost})</span>
                      <span>${additionalBusinessCost * additionalBusinessCount}/mo</span>
                    </div>
                  )}
                  
                  {seats > 0 && (
                    <div className="flex justify-between text-gray-300 text-sm">
                      <span>Additional Seats ({seats} × ${seatCost})</span>
                      <span>${seatCost * seats}/mo</span>
                    </div>
                  )}

                  <div className="border-t border-slate-600 pt-3 mt-3">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-white text-lg">Monthly Total</span>
                      <span className="text-3xl font-extrabold text-white">
                        ${total}
                        <span className="text-lg font-normal text-gray-400">/mo</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* What's Included */}
                <div className="mt-6 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>All 20 tools included</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Unlimited usage</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>No hidden fees</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 disabled:opacity-50 text-white font-bold py-4 px-8 rounded-lg transition-opacity text-lg shadow-lg flex items-center justify-center gap-3"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Continue to Payment
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-500 mt-4">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
