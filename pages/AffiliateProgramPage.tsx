import React, { useState } from 'react';
import { CheckCircleIcon, CurrencyDollarIcon, ClockIcon, ChartBarIcon, UserGroupIcon, SparklesIcon } from '../components/icons/MiniIcons';

interface AffiliateProgramPageProps {
  navigate: (path: string) => void;
}

const BenefitCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-gradient-to-br from-slate-800 to-brand-dark p-6 rounded-xl border border-slate-700 glow-card glow-card-rounded-xl">
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-accent-purple to-accent-pink rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

const ProgramDetailCard = ({ label, value, description }: { label: string, value: string, description: string }) => (
  <div className="bg-brand-dark/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
    <div className="text-sm text-gray-400 mb-1">{label}</div>
    <div className="text-3xl font-bold text-white mb-2">{value}</div>
    <div className="text-sm text-gray-300">{description}</div>
  </div>
);

const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-700 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-4 text-left focus:outline-none group"
      >
        <span className="font-semibold text-white group-hover:text-accent-cyan transition-colors">{question}</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
        <p className="text-gray-400 text-sm leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

export const AffiliateProgramPage: React.FC<AffiliateProgramPageProps> = ({ navigate }) => {
  const handleJoinClick = () => {
    // Open Rewardful signup - this will be the Rewardful link
    window.open('https://jetsuite.getrewardful.com/signup', '_blank');
  };

  return (
    <div className="min-h-screen bg-brand-darker">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/10 via-accent-pink/10 to-accent-cyan/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-accent-purple/20 to-accent-pink/20 border border-accent-purple/30 rounded-full px-4 py-2 mb-6">
              <SparklesIcon className="w-4 h-4 text-accent-cyan" />
              <span className="text-sm font-semibold text-accent-cyan">Earn Passive Income</span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6">
              Join the JetSuite
              <br />
              <span className="bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan bg-clip-text text-transparent">
                Affiliate Program
              </span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg sm:text-xl text-gray-300 leading-relaxed">
              Partner with us and earn <span className="text-white font-bold">20% recurring commission</span> for every customer you refer.
              Help local businesses grow while building your own passive income stream.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleJoinClick}
                className="w-full sm:w-auto bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan hover:opacity-90 text-white font-bold py-4 px-10 rounded-full transition-all shadow-lg shadow-accent-purple/30 text-lg"
              >
                Join Now - It's Free
              </button>
              <button
                onClick={() => {
                  const detailsSection = document.getElementById('program-details');
                  detailsSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-10 rounded-full transition-all border border-slate-700"
              >
                Learn More
              </button>
            </div>

            {/* Quick Stats */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-gradient-to-br from-slate-800/50 to-brand-dark/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
                <div className="text-4xl font-bold text-white mb-1">20%</div>
                <div className="text-sm text-gray-400">Recurring Commission</div>
              </div>
              <div className="bg-gradient-to-br from-slate-800/50 to-brand-dark/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
                <div className="text-4xl font-bold text-white mb-1">90 Days</div>
                <div className="text-sm text-gray-400">Cookie Duration</div>
              </div>
              <div className="bg-gradient-to-br from-slate-800/50 to-brand-dark/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700">
                <div className="text-4xl font-bold text-white mb-1">12 Months</div>
                <div className="text-sm text-gray-400">Commission Cap</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Calculator Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-accent-purple/10 via-accent-pink/10 to-accent-cyan/10 border border-accent-purple/30 rounded-3xl p-8 sm:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Your Earning Potential
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              With our founder's pricing at $97/month, here's what you could earn per referral
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-brand-dark/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-700 text-center">
              <div className="text-accent-cyan text-sm font-semibold mb-2">Per Month</div>
              <div className="text-5xl font-bold text-white mb-2">$19.40</div>
              <div className="text-gray-400 text-sm">per active customer</div>
            </div>
            <div className="bg-gradient-to-br from-accent-purple/20 to-accent-pink/20 backdrop-blur-sm p-8 rounded-2xl border-2 border-accent-purple/50 text-center transform scale-105">
              <div className="text-accent-pink text-sm font-semibold mb-2">12 Months Total</div>
              <div className="text-5xl font-bold text-white mb-2">$232.80</div>
              <div className="text-gray-300 text-sm font-semibold">lifetime value per customer</div>
              <div className="mt-3 inline-block bg-yellow-500/20 border border-yellow-500/50 rounded-full px-3 py-1">
                <span className="text-yellow-300 text-xs font-bold">BEST VALUE</span>
              </div>
            </div>
            <div className="bg-brand-dark/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-700 text-center">
              <div className="text-accent-cyan text-sm font-semibold mb-2">10 Referrals/Year</div>
              <div className="text-5xl font-bold text-white mb-2">$2,328</div>
              <div className="text-gray-400 text-sm">annual potential income</div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              * Additional earnings available for customers with multiple business locations ($49/month each)
            </p>
          </div>
        </div>
      </div>

      {/* Program Details */}
      <div id="program-details" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
            Program Details
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Simple, transparent terms that work in your favor
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProgramDetailCard
            label="Commission Rate"
            value="20%"
            description="Earn 20% recurring commission on every subscription payment"
          />
          <ProgramDetailCard
            label="Commission Duration"
            value="12 Payments"
            description="Continue earning for up to 12 monthly payments per customer"
          />
          <ProgramDetailCard
            label="Cookie Duration"
            value="90 Days"
            description="Get credit for referrals up to 90 days after first click"
          />
          <ProgramDetailCard
            label="Attribution Model"
            value="Last Click"
            description="The most recent affiliate link gets the commission"
          />
          <ProgramDetailCard
            label="Payout Timing"
            value="30 Days"
            description="Receive payments 30 days after customer payment"
          />
          <ProgramDetailCard
            label="Minimum Payout"
            value="$100"
            description="Minimum balance required for withdrawal via PayPal"
          />
        </div>

        <div className="mt-12 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-yellow-500/50 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Important Note</h3>
              <p className="text-sm text-gray-300">
                Users cannot become an affiliate for their own subscription. Affiliates must refer new customers to the JetSuite platform. All payouts are processed exclusively through PayPal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Why Partner With Us */}
      <div className="bg-gradient-to-b from-brand-darker to-brand-dark py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
              Why Partner With JetSuite?
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              We've built the perfect product for affiliates to promote
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BenefitCard
              icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
              title="High Conversion Rate"
              description="JetSuite saves businesses thousands of dollars monthly. Our compelling value proposition makes it easy to convert leads into paying customers."
            />
            <BenefitCard
              icon={<ChartBarIcon className="w-6 h-6 text-white" />}
              title="Recurring Revenue"
              description="Earn passive income month after month. Each customer you refer can generate up to $232.80 in total commissions over 12 months."
            />
            <BenefitCard
              icon={<UserGroupIcon className="w-6 h-6 text-white" />}
              title="Huge Market"
              description="33+ million small businesses in the US alone need better marketing tools. Target local businesses, consultants, agencies, and entrepreneurs."
            />
            <BenefitCard
              icon={<ClockIcon className="w-6 h-6 text-white" />}
              title="Long Cookie Window"
              description="90-day cookie duration means you get credit even if customers take time to decide. Your referrals don't expire quickly."
            />
            <BenefitCard
              icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
              title="Easy to Promote"
              description="Clear value proposition, proven results, and attractive pricing make JetSuite an easy sell to local business owners."
            />
            <BenefitCard
              icon={<SparklesIcon className="w-6 h-6 text-white" />}
              title="Premium Support"
              description="We provide you with marketing materials, tracking dashboards, and dedicated affiliate support to help you succeed."
            />
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-gray-300 text-lg">
            Start earning in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Step 1 */}
          <div className="relative">
            <div className="bg-gradient-to-br from-slate-800 to-brand-dark p-8 rounded-2xl border border-slate-700 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-purple to-accent-pink rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Sign Up</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Create your free affiliate account and get your unique referral link instantly.
              </p>
            </div>
            <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
              <svg className="w-8 h-8 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="bg-gradient-to-br from-slate-800 to-brand-dark p-8 rounded-2xl border border-slate-700 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-pink to-accent-cyan rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Share</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Share your link with local businesses, on social media, or through your content channels.
              </p>
            </div>
            <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
              <svg className="w-8 h-8 text-accent-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-gradient-to-br from-slate-800 to-brand-dark p-8 rounded-2xl border border-slate-700 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-accent-cyan to-accent-purple rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl font-bold text-white">3</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Earn</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Earn 20% recurring commission paid monthly via PayPal for every customer you refer.
            </p>
          </div>
        </div>
      </div>

      {/* Who Should Join */}
      <div className="bg-gradient-to-b from-brand-dark to-brand-darker py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
              Perfect For
            </h2>
            <p className="text-gray-300 text-lg">
              Our affiliate program is ideal for these audiences
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Marketing Agencies", description: "Add value for your clients while earning recurring revenue" },
              { title: "Business Consultants", description: "Recommend a tool that actually helps your clients succeed" },
              { title: "Content Creators", description: "Monetize your business-focused audience with a valuable product" },
              { title: "Web Developers", description: "Offer an all-in-one solution to help your clients grow online" },
              { title: "Local SEO Experts", description: "Provide your clients with affordable DIY tools they can use" },
              { title: "Business Coaches", description: "Give your clients the marketing tools they need to grow" },
              { title: "Industry Influencers", description: "Share a solution your followers will genuinely appreciate" },
              { title: "Entrepreneurs", description: "Build passive income by helping other business owners succeed" }
            ].map((item, index) => (
              <div key={index} className="bg-gradient-to-br from-slate-800/50 to-brand-dark/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700 hover:border-accent-purple/50 transition-colors">
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-brand-dark p-8 rounded-2xl border border-slate-700">
          <FaqItem
            question="How do I get paid?"
            answer="All payments are made through PayPal. Once you reach the $100 minimum payout threshold, you'll receive your commission 30 days after your referred customer's payment. Payouts are processed monthly."
          />
          <FaqItem
            question="Can I refer myself or my own business?"
            answer="No, you cannot become an affiliate for your own subscription. The affiliate program is designed to reward you for bringing new customers to JetSuite, not for purchasing the service yourself."
          />
          <FaqItem
            question="How long do cookies last?"
            answer="Cookies last for 90 days. This means if someone clicks your affiliate link and signs up within 90 days, you'll get credit for the referral."
          />
          <FaqItem
            question="What happens after 12 months?"
            answer="Commission payments are capped at 12 monthly payments per customer. After that, while the customer may continue their subscription, you will no longer earn commission from that specific referral. However, you can continue earning from new referrals."
          />
          <FaqItem
            question="What marketing materials do you provide?"
            answer="Once you join, you'll get access to our affiliate dashboard with banners, social media graphics, email templates, and promotional copy you can use to promote JetSuite."
          />
          <FaqItem
            question="Is there a limit to how much I can earn?"
            answer="No! There's no cap on the number of customers you can refer or your total earnings. The only limit is the 12-month commission duration per individual customer."
          />
          <FaqItem
            question="What is the attribution model?"
            answer="We use a last-click attribution model. This means the most recent affiliate link a customer clicked before signing up gets the commission. Make sure to stay engaged with your audience!"
          />
          <FaqItem
            question="How do I track my referrals?"
            answer="You'll have access to a comprehensive dashboard powered by Rewardful where you can track clicks, signups, commissions, and payments in real-time."
          />
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-accent-purple/20 via-accent-pink/20 to-accent-cyan/20 border-2 border-accent-purple/50 rounded-3xl p-12 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Join hundreds of partners who are already earning recurring income by helping local businesses grow.
          </p>
          <button
            onClick={handleJoinClick}
            className="bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan hover:opacity-90 text-white font-bold py-5 px-12 rounded-full transition-all shadow-lg shadow-accent-purple/30 text-lg"
          >
            Join the Affiliate Program
          </button>
          <p className="mt-6 text-sm text-gray-400">
            Free to join • No approval required • Start earning immediately
          </p>
        </div>
      </div>
    </div>
  );
};
