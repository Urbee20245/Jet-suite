import React from 'react';
import { CheckCircleIcon, ChartBarIcon, SparklesIcon } from '../components/icons/MiniIcons';

interface AffiliateThankYouPageProps {
  navigate: (path: string) => void;
}

const NextStepCard = ({ number, title, description, icon }: { number: number, title: string, description: string, icon: React.ReactNode }) => (
  <div className="bg-gradient-to-br from-slate-800 to-brand-dark p-6 rounded-xl border border-slate-700 glow-card glow-card-rounded-xl">
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-accent-purple to-accent-pink rounded-full flex items-center justify-center">
        <span className="text-xl font-bold text-white">{number}</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

export const AffiliateThankYouPage: React.FC<AffiliateThankYouPageProps> = ({ navigate }) => {
  return (
    <div className="min-h-screen bg-brand-darker py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6 animate-bounce">
            <CheckCircleIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-6">
            Welcome to the Team!
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            You're now part of the JetSuite affiliate program. Let's get you set up for success.
          </p>
        </div>

        {/* Stats Highlight */}
        <div className="mb-12 bg-gradient-to-r from-accent-purple/20 via-accent-pink/20 to-accent-cyan/20 border border-accent-purple/30 rounded-2xl p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">20%</div>
              <div className="text-sm text-gray-400">Your Commission Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">$232</div>
              <div className="text-sm text-gray-400">Per Customer (12 months)</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">90 Days</div>
              <div className="text-sm text-gray-400">Cookie Duration</div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Your Next Steps</h2>
          <div className="space-y-4">
            <NextStepCard
              number={1}
              title="Check Your Email"
              description="We've sent you a welcome email with your unique affiliate link and login credentials for your dashboard. Check your inbox (and spam folder) now."
              icon={<svg className="w-5 h-5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>}
            />
            <NextStepCard
              number={2}
              title="Access Your Dashboard"
              description="Log into your Rewardful dashboard to get your referral link, track clicks, monitor conversions, and view your earnings in real-time."
              icon={<ChartBarIcon className="w-5 h-5 text-accent-cyan" />}
            />
            <NextStepCard
              number={3}
              title="Get Your Marketing Materials"
              description="Download banners, social media graphics, email templates, and promotional copy from your dashboard to make promoting JetSuite easy and effective."
              icon={<SparklesIcon className="w-5 h-5 text-accent-cyan" />}
            />
            <NextStepCard
              number={4}
              title="Start Sharing"
              description="Share your unique affiliate link with local business owners, on social media, in blog posts, or anywhere your audience hangs out. Start earning today!"
              icon={<svg className="w-5 h-5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>}
            />
          </div>
        </div>

        {/* Pro Tips */}
        <div className="mb-12 bg-gradient-to-br from-slate-800 to-brand-dark p-8 rounded-2xl border border-slate-700">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-accent-cyan" />
            Pro Tips for Success
          </h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-accent-purple/20 rounded-full flex items-center justify-center mt-0.5">
                <CheckCircleIcon className="w-4 h-4 text-accent-purple" />
              </div>
              <div>
                <div className="font-semibold text-white mb-1">Target Local Business Owners</div>
                <div className="text-sm text-gray-400">Reach out to plumbers, dentists, lawyers, restaurants, and other local businesses who need better marketing.</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-accent-pink/20 rounded-full flex items-center justify-center mt-0.5">
                <CheckCircleIcon className="w-4 h-4 text-accent-pink" />
              </div>
              <div>
                <div className="font-semibold text-white mb-1">Emphasize the Cost Savings</div>
                <div className="text-sm text-gray-400">JetSuite replaces $10,000-$35,000/month in agency costs. This value proposition sells itself.</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-accent-cyan/20 rounded-full flex items-center justify-center mt-0.5">
                <CheckCircleIcon className="w-4 h-4 text-accent-cyan" />
              </div>
              <div>
                <div className="font-semibold text-white mb-1">Create Valuable Content</div>
                <div className="text-sm text-gray-400">Write blog posts, create videos, or share case studies about local business marketing challenges and solutions.</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-accent-purple/20 rounded-full flex items-center justify-center mt-0.5">
                <CheckCircleIcon className="w-4 h-4 text-accent-purple" />
              </div>
              <div>
                <div className="font-semibold text-white mb-1">Use Social Proof</div>
                <div className="text-sm text-gray-400">Share testimonials, results, and success stories from JetSuite customers to build trust.</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-accent-pink/20 rounded-full flex items-center justify-center mt-0.5">
                <CheckCircleIcon className="w-4 h-4 text-accent-pink" />
              </div>
              <div>
                <div className="font-semibold text-white mb-1">Stay Consistent</div>
                <div className="text-sm text-gray-400">The more you promote, the more you earn. Make affiliate marketing a regular part of your content strategy.</div>
              </div>
            </li>
          </ul>
        </div>

        {/* Support Section */}
        <div className="bg-gradient-to-r from-accent-purple/10 via-accent-pink/10 to-accent-cyan/10 border border-accent-purple/30 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Need Help?</h3>
          <p className="text-gray-300 mb-6">
            We're here to support you every step of the way. If you have questions or need assistance, don't hesitate to reach out.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/contact')}
              className="bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan hover:opacity-90 text-white font-bold py-3 px-8 rounded-full transition-all"
            >
              Contact Support
            </button>
            <button
              onClick={() => navigate('/affiliate-program')}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-full transition-all border border-slate-700"
            >
              View Program Details
            </button>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
