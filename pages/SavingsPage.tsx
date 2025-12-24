
import React, { useState } from 'react';
import { CheckCircleIcon, SparklesIcon, ArrowRightIcon } from '../components/icons/MiniIcons';

interface SavingsPageProps {
  navigate: (path: string) => void;
}

const traditionalCosts = {
  localSEO: { name: 'Local SEO Consultant', min: 500, max: 2000 },
  seoTools: { name: 'SEO Tools (Ahrefs, SEMrush)', min: 99, max: 399 },
  competitorAnalysis: { name: 'Competitor Research Service', min: 300, max: 1500 },
  socialMedia: { name: 'Social Media Manager', min: 800, max: 2500 },
  contentWriter: { name: 'Blog/Content Writer', min: 400, max: 1200 },
  designer: { name: 'Graphic Designer', min: 1000, max: 3000 },
  marketingAgency: { name: 'Marketing Agency (Campaigns)', min: 2000, max: 10000 },
  reputationMgmt: { name: 'Reputation Management', min: 200, max: 800 },
  reviewWidget: { name: 'Review Widget Service', min: 50, max: 200 },
  leadGen: { name: 'Lead Generation Service', min: 500, max: 2000 },
  adAgency: { name: 'Ad Management', min: 500, max: 2000 },
  businessConsultant: { name: 'Business Strategy Consultant', min: 600, max: 3200 },
};

export const SavingsPage: React.FC<SavingsPageProps> = ({ navigate }) => {
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'localSEO',
    'socialMedia',
    'contentWriter',
    'designer',
    'marketingAgency'
  ]);
  const [businessSize, setBusinessSize] = useState<'solo' | 'small' | 'growing'>('small');

  const toggleService = (service: string) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter(s => s !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const calculateSavings = () => {
    let total = 0;
    selectedServices.forEach(serviceKey => {
      const service = traditionalCosts[serviceKey as keyof typeof traditionalCosts];
      if (service) {
        // Use mid-range for calculation
        const avgCost = (service.min + service.max) / 2;
        total += avgCost;
      }
    });
    return Math.round(total);
  };

  const monthlyTraditionalCost = calculateSavings();
  const jetSuiteCost = 149;
  const monthlySavings = monthlyTraditionalCost - jetSuiteCost;
  const annualSavings = monthlySavings * 12;
  const roi = monthlyTraditionalCost > 0 ? Math.round((monthlySavings / jetSuiteCost) * 100) : 0;

  const businessSizeExamples = {
    solo: {
      title: 'Solo Entrepreneur',
      description: 'DIY marketing with occasional freelancers',
      typical: '$500-1,500/mo',
      services: ['socialMedia', 'contentWriter', 'designer'],
    },
    small: {
      title: 'Small Business',
      description: 'Local agency + tools + freelancers',
      typical: '$3,000-8,000/mo',
      services: ['localSEO', 'socialMedia', 'contentWriter', 'designer', 'marketingAgency'],
    },
    growing: {
      title: 'Growing Business',
      description: 'Multiple agencies and full-service marketing',
      typical: '$10,000-25,000/mo',
      services: Object.keys(traditionalCosts).slice(0, 8),
    }
  };

  return (
    <div className="min-h-screen bg-brand-darker py-20 sm:py-28 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-accent-purple/10 border border-accent-purple/30 px-4 py-2 rounded-full mb-6">
            <SparklesIcon className="w-5 h-5 text-accent-purple" />
            <span className="text-accent-purple font-semibold text-sm">ROI Calculator</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-6">
            See Your Potential Savings
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            JetSuite replaces expensive agencies, multiple tool subscriptions, and freelancer fees 
            with one AI-powered platform. Calculate your savings below.
          </p>
        </div>

        {/* Business Size Selector */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white text-center mb-6">What describes your business?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {Object.entries(businessSizeExamples).map(([key, example]) => (
              <button
                key={key}
                onClick={() => {
                  setBusinessSize(key as typeof businessSize);
                  setSelectedServices(example.services);
                }}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  businessSize === key
                    ? 'bg-gradient-to-br from-accent-purple/20 to-accent-pink/20 border-accent-purple shadow-lg shadow-accent-purple/20'
                    : 'bg-slate-800 border-slate-700 hover:border-accent-purple/50'
                }`}
              >
                <h3 className="text-xl font-bold text-white mb-2">{example.title}</h3>
                <p className="text-sm text-gray-300 mb-3">{example.description}</p>
                <p className="text-xs text-accent-purple font-semibold">Typically: {example.typical}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Service Selector */}
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Select Services You Currently Use</h2>
            <div className="space-y-3">
              {Object.entries(traditionalCosts).map(([key, service]) => (
                <label
                  key={key}
                  className="flex items-start gap-3 p-4 rounded-lg bg-brand-dark hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(key)}
                    onChange={() => toggleService(key)}
                    className="mt-1 h-5 w-5 rounded border-slate-600 text-accent-purple focus:ring-accent-purple cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white">{service.name}</p>
                    <p className="text-sm text-gray-400">
                      ${service.min.toLocaleString()} - ${service.max.toLocaleString()}/month
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Right: Savings Calculator */}
          <div className="space-y-6">
            {/* Results Card */}
            <div className="bg-gradient-to-br from-accent-purple via-accent-pink to-accent-blue p-8 rounded-2xl shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-8 text-center">Your Potential Savings</h2>
              
              <div className="space-y-6">
                {/* Monthly Traditional Cost */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <p className="text-sm text-white/70 uppercase tracking-wide mb-2">Traditional Monthly Cost</p>
                  <p className="text-4xl font-extrabold text-white">
                    ${monthlyTraditionalCost.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/60 mt-2">{selectedServices.length} services selected</p>
                </div>

                {/* JetSuite Cost */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <p className="text-sm text-white/70 uppercase tracking-wide mb-2">JetSuite Monthly Cost</p>
                  <p className="text-4xl font-extrabold text-white">
                    ${jetSuiteCost}<span className="text-lg">/mo</span>
                  </p>
                  <p className="text-xs text-white/60 mt-2">All 12+ tools included</p>
                </div>

                <div className="h-px bg-white/30"></div>

                {/* Monthly Savings */}
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border-2 border-white/40">
                  <p className="text-sm text-white uppercase tracking-wide mb-2">Monthly Savings</p>
                  <p className="text-5xl font-extrabold text-white mb-2">
                    ${monthlySavings.toLocaleString()}
                  </p>
                  <p className="text-lg text-white/90 font-semibold">
                    Annual: ${annualSavings.toLocaleString()}
                  </p>
                </div>

                {/* ROI */}
                <div className="text-center">
                  <p className="text-sm text-white/70 mb-2">Return on Investment</p>
                  <p className="text-6xl font-extrabold text-white">{roi}%</p>
                  <p className="text-sm text-white/80 mt-2">You save ${roi} for every $1 spent</p>
                </div>
              </div>
            </div>

            {/* What You Get */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4">What You Get with JetSuite</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-accent-cyan flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">13+ AI-powered tools</strong> including review widgets</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-accent-cyan flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Business DNA system</strong> ensures brand consistency</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-accent-cyan flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Embeddable review widgets</strong> for your website</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-accent-cyan flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Unlimited usage</strong> - no per-project fees</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-accent-cyan flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Instant generation</strong> - no waiting weeks</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-accent-cyan flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Integrated platform</strong> - no vendor juggling</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate('/get-started')}
              className="w-full bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-4 px-8 rounded-xl transition-opacity shadow-lg shadow-accent-purple/30 flex items-center justify-center gap-2 text-lg"
            >
              Get Started
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Traditional vs. JetSuite</h2>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-brand-dark">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Service</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Traditional Cost</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-accent-purple">JetSuite</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {Object.entries(traditionalCosts).map(([key, service]) => (
                    <tr key={key} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{service.name}</td>
                      <td className="px-6 py-4 text-center text-gray-300">
                        ${service.min.toLocaleString()} - ${service.max.toLocaleString()}/mo
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-accent-cyan font-semibold">
                          <CheckCircleIcon className="w-5 h-5" />
                          Included
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gradient-to-r from-accent-purple/10 to-accent-pink/10 font-bold">
                    <td className="px-6 py-4 text-white text-lg">TOTAL</td>
                    <td className="px-6 py-4 text-center text-white text-lg">
                      $11,100 - $35,200/mo
                    </td>
                    <td className="px-6 py-4 text-center text-accent-purple text-2xl">
                      $149/mo
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Real Examples */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Real Business Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-2">🍕 Restaurant Owner</h3>
              <p className="text-sm text-gray-400 mb-4">Local marketing agency + social media</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Before:</span>
                  <span className="text-white font-semibold">$2,130/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">After:</span>
                  <span className="text-accent-purple font-semibold">$149/mo</span>
                </div>
                <div className="h-px bg-slate-700 my-2"></div>
                <div className="flex justify-between text-lg">
                  <span className="text-white font-bold">Saves:</span>
                  <span className="text-accent-cyan font-bold">$23,772/year</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-2">⚖️ Law Firm</h3>
              <p className="text-sm text-gray-400 mb-4">SEO agency + content + ads + reputation</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Before:</span>
                  <span className="text-white font-semibold">$5,200/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">After:</span>
                  <span className="text-accent-purple font-semibold">$149/mo</span>
                </div>
                <div className="h-px bg-slate-700 my-2"></div>
                <div className="flex justify-between text-lg">
                  <span className="text-white font-bold">Saves:</span>
                  <span className="text-accent-cyan font-bold">$60,612/year</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-2">🏠 Home Services</h3>
              <p className="text-sm text-gray-400 mb-4">Full-service agency + design + tools</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Before:</span>
                  <span className="text-white font-semibold">$6,100/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">After:</span>
                  <span className="text-accent-purple font-semibold">$149/mo</span>
                </div>
                <div className="h-px bg-slate-700 my-2"></div>
                <div className="flex justify-between text-lg">
                  <span className="text-white font-bold">Saves:</span>
                  <span className="text-accent-cyan font-bold">$71,412/year</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-20 text-center bg-gradient-to-br from-accent-purple/20 to-accent-pink/20 border border-accent-purple/40 rounded-2xl p-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Cut Your Marketing Costs by 90%?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join hundreds of businesses saving thousands every month with JetSuite.
          </p>
          <button
            onClick={() => navigate('/get-started')}
            className="bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-4 px-12 rounded-xl transition-opacity shadow-lg shadow-accent-purple/30 text-lg"
          >
            Get Started Today
          </button>
        </div>
      </div>
    </div>
  );
};
