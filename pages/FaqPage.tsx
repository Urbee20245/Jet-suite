import React, { useState } from 'react';
import { 
    MagnifyingGlassIcon,
    CurrencyDollarIcon,
    RocketLaunchIcon,
    WrenchScrewdriverIcon,
    ClockIcon,
    ShieldCheckIcon,
    LifebuoyIcon,
    CreditCardIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    HandThumbUpIcon,
    HandThumbDownIcon
} from '@heroicons/react/24/outline';
import { FaqItem } from '../components/marketing/FaqItem';

interface FaqPageProps {
  navigate: (path: string) => void;
}

// Reusable FAQ Item Component specifically for this page to include feedback buttons
const FaqAccordion = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden transition-all duration-300 hover:border-blue-500/50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left p-6 focus:outline-none"
            >
                <h3 className="text-lg font-semibold text-white pr-4">{question}</h3>
                {isOpen 
                    ? <ChevronUpIcon className="w-5 h-5 text-blue-400 flex-shrink-0"/> 
                    : <ChevronDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0"/>
                }
            </button>
            <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="px-6 pb-6 text-gray-300 leading-relaxed border-t border-slate-700 pt-4">
                   <p>{answer}</p>
                   
                   <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center gap-4 text-xs text-gray-500">
                       <span>Was this helpful?</span>
                       <button 
                            onClick={(e) => { e.stopPropagation(); setFeedback('yes'); }}
                            className={`flex items-center gap-1 hover:text-white transition-colors ${feedback === 'yes' ? 'text-green-400' : ''}`}
                        >
                           <HandThumbUpIcon className="w-4 h-4"/> Yes
                       </button>
                       <button 
                            onClick={(e) => { e.stopPropagation(); setFeedback('no'); }}
                            className={`flex items-center gap-1 hover:text-white transition-colors ${feedback === 'no' ? 'text-red-400' : ''}`}
                        >
                           <HandThumbDownIcon className="w-4 h-4"/> No
                       </button>
                   </div>
                </div>
            </div>
        </div>
    );
};

export const FaqPage: React.FC<FaqPageProps> = ({ navigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'general', name: 'General Questions', icon: MagnifyingGlassIcon },
    { id: 'pricing', name: 'Pricing & Plans', icon: CurrencyDollarIcon },
    { id: 'start', name: 'Getting Started', icon: RocketLaunchIcon },
    { id: 'tools', name: 'Tools & Features', icon: WrenchScrewdriverIcon },
    { id: 'results', name: 'Time & Results', icon: ClockIcon },
    { id: 'security', name: 'Privacy & Security', icon: ShieldCheckIcon },
    { id: 'support', name: 'Support & Help', icon: LifebuoyIcon },
    { id: 'billing', name: 'Billing', icon: CreditCardIcon },
  ];

  const allFaqs = [
      // General
      { category: 'general', q: "What is JetSuite?", a: "JetSuite is an all-in-one local business growth platform. It combines SEO, reputation management, content creation, and lead generation into a single AI-powered dashboard." },
      { category: 'general', q: "How is JetSuite different from other tools?", a: "Most tools just give you data dumps. JetSuite gives you a prioritized weekly action plan. We tell you exactly what to fix, track your completion, and adjust your strategy based on results." },
      { category: 'general', q: "Who is JetSuite for?", a: "It's built specifically for local service businesses (HVAC, plumbers, dentists, lawyers, real estate agents, etc.) who want to rank higher on Google Maps and get more local customers." },
      { category: 'general', q: "Who is JetSuite NOT for?", a: "It's not designed for purely e-commerce businesses that don't have a local physical presence or service area. It works best for businesses that rely on local search traffic." },
      { category: 'general', q: "Do I need to install anything?", a: "No. JetSuite is 100% cloud-based. You can access it from any web browser on your computer, tablet, or phone." },
      { category: 'general', q: "Does it work for businesses outside the US?", a: "Currently, our local SEO data sources are optimized for US-based businesses. However, many tools (website audit, content creation) work globally. We recommend it primarily for US businesses at this time." },

      // Pricing
      { category: 'pricing', q: "How much does JetSuite cost?", a: "We offer one simple plan: $149/month. This includes full access to all 20+ tools, unlimited AI content generation, and support. No hidden fees." },
      { category: 'pricing', q: "When will I be charged?", a: "You'll be charged immediately when you subscribe. Your subscription renews monthly at the same rate." },
      { category: 'pricing', q: "Are there setup fees?", a: "None. You can set up your account in about 2 minutes completely free." },
      { category: 'pricing', q: "Do I have to sign a contract?", a: "No. JetSuite is a month-to-month service. You can cancel at any time without penalty." },
      { category: 'pricing', q: "Do you offer enterprise plans?", a: "Yes. If you manage more than 10 locations or are an agency, contact our sales team for custom volume pricing." },
      { category: 'pricing', q: "What forms of payment do you accept?", a: "We accept all major credit cards (Visa, Mastercard, Amex, Discover)." },
      { category: 'pricing', q: "Is the price locked in?", a: "Yes. Once you subscribe, your price is locked in for as long as you maintain your subscription, even if our public pricing increases." },

      // Getting Started
      { category: 'start', q: "How long does setup take?", a: "About 5 minutes. You'll simply connect your Google Business Profile (if you have one) and enter your website URL. Our AI handles the rest." },
      { category: 'start', q: "Do I need marketing experience?", a: "Zero. The Growth Plan gives you step-by-step instructions for every task. If something is technical, our system often does it for you automatically." },
      { category: 'start', q: "What if I don't have a website yet?", a: "That's okay! You can still use JetSuite to optimize your Google Business Profile and social media. We can also help guide you on what your new website needs." },
      { category: 'start', q: "What if I don't have a Google Business Profile?", a: "We'll guide you through setting one up correctly from day one, which is crucial for local ranking." },
      { category: 'start', q: "Can I invite my team?", a: "Yes. Your account includes 1 team member seat for free. You can add additional team members for $15/month each." },

      // Tools
      { category: 'tools', q: "Do I get all tools immediately?", a: "Yes. Unlike some platforms that lock features behind higher tiers, you get access to all 20 tools from the moment you sign up." },
      { category: 'tools', q: "What's included?", a: "Everything listed on our Features page: JetBiz (SEO), JetViz (Audit), JetCreate (Content), JetReply (Reviews), Growth Plan, and more." },
      { category: 'tools', q: "How does Growth Score work?", a: "It's a 0-100 score based on over 200 data points across your SEO, reputation, and activity. It gives you a single metric to track your overall online health." },
      { category: 'tools', q: "Can I use the tools individually?", a: "Absolutely. While the Growth Plan suggests a workflow, you can jump into any specific tool (like JetReply for reviews) whenever you want." },
      { category: 'tools', q: "Is the AI content unique?", a: "Yes. Our AI generates content specifically based on your business profile, industry, and local area, ensuring it's unique and relevant." },
      { category: 'tools', q: "How often is data updated?", a: "Most data (rankings, reviews) is updated daily. Your full website audit and competitive analysis run weekly or on-demand." },

      // Time & Results
      { category: 'results', q: "How much time will it save me?", a: "Our users report saving 10-15 hours per week compared to doing these tasks manually or managing multiple tools." },
      { category: 'results', q: "How long until I see results?", a: "Most users see their Growth Score improve in week 1. Significant Google ranking improvements typically start appearing around days 30-60 of consistent use." },
      { category: 'results', q: "Can you guarantee #1 ranking?", a: "No ethical SEO company can guarantee a #1 ranking because Google's algorithm is private. However, we guarantee our system follows all best practices to give you the best possible chance." },
      { category: 'results', q: "What if I stop using JetSuite?", a: "You keep all the improvements you made (profile updates, content posted, reviews answered). However, your rankings may slowly drop over time without ongoing optimization." },
      { category: 'results', q: "Do I have to use it every day?", a: "No. We recommend spending 15-20 minutes once a week to complete your weekly Growth Plan tasks." },

      // Security
      { category: 'security', q: "Is my data safe?", a: "Yes. We use bank-level encryption (256-bit SSL) to protect your data. We never sell your customer data to third parties." },
      { category: 'security', q: "What data do you access?", a: "We only access the public data needed to audit your business and the account connections you explicitly authorize (like Google Business Profile)." },
      { category: 'security', q: "Can you delete my data?", a: "Yes. If you cancel and request data deletion, we will permanently remove all your business information from our servers." },
      { category: 'security', q: "Do you store my credit card info?", a: "No. All payment processing is handled securely by Stripe, the industry standard for online payments." },

      // Support
      { category: 'support', q: "What support do you offer?", a: "We offer email support for all customers with a 24-hour response time guarantee. We also have an extensive knowledge base with video tutorials." },
      { category: 'support', q: "Do you offer phone support?", a: "We prioritize email/chat support to keep costs low for everyone, but we can schedule calls for complex technical issues." },
      { category: 'support', q: "Do you do the work for me?", a: "JetSuite is a 'do-it-yourself' platform with AI assistance. If you want a 'done-for-you' service, ask about our agency partner program." },
      { category: 'support', q: "Where can I learn how to use the tools?", a: "Every tool has a 'How to use' video tutorial built right into the dashboard. You'll never be lost." },
      { category: 'support', q: "Can I request a new feature?", a: "Yes! We love user feedback. You can submit feature requests directly from your dashboard." },

      // Billing
      { category: 'billing', q: "How does billing work?", a: "You are billed $149 automatically each month on the anniversary of your signup date." },
      { category: 'billing', q: "Can I cancel anytime?", a: "Yes. You can cancel with two clicks in your dashboard settings. Your access will continue until the end of your current billing period." },
      { category: 'billing', q: "Do you offer annual plans?", a: "Yes. You can pay annually and get 2 months free (pay for 10 months, get 12). Contact support to switch to annual billing." },
      { category: 'billing', q: "What happens if my payment fails?", a: "We'll retry the payment a few times over the next week. If it continues to fail, your account will be paused until payment is updated." },
      { category: 'billing', q: "Can I pause my subscription?", a: "Yes, you can pause your account for up to 3 months if your business is seasonal or you need a break." },
  ];

  const filteredFaqs = allFaqs.filter(faq => {
      const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            faq.a.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
      return matchesSearch && matchesCategory;
  });

  // Group filtered FAQs by category for display
  const displayCategories = categories.filter(cat => 
      activeCategory === 'all' 
          ? filteredFaqs.some(f => f.category === cat.id) 
          : cat.id === activeCategory
  );

  return (
    <div className="bg-brand-darker text-gray-300 font-sans min-h-screen">
      
      {/* 1. HERO SECTION */}
      <section className="relative py-20 px-4 text-center border-b border-slate-800 bg-slate-900/50">
          <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">Frequently Asked Questions</h1>
              <p className="text-xl text-gray-400 mb-10">Everything you need to know about JetSuite. Can't find your answer? Contact our support team.</p>
              
              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto mb-8">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                      type="text"
                      placeholder="Search questions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-11 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
                  />
              </div>

              {/* Quick Links */}
              <div className="flex flex-wrap justify-center gap-2 text-sm">
                  <button onClick={() => setActiveCategory('all')} className={`px-4 py-2 rounded-full transition-colors ${activeCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-400 hover:text-white'}`}>All</button>
                  {categories.map(cat => (
                      <button 
                        key={cat.id} 
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-4 py-2 rounded-full transition-colors ${activeCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-400 hover:text-white'}`}
                      >
                          {cat.name}
                      </button>
                  ))}
              </div>
          </div>
      </section>

      {/* 2. FAQ CONTENT */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
          {displayCategories.map(cat => {
              const categoryFaqs = filteredFaqs.filter(f => f.category === cat.id);
              if (categoryFaqs.length === 0) return null;

              return (
                  <div key={cat.id} className="mb-16">
                      <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                              <cat.icon className="w-6 h-6" />
                          </div>
                          <h2 className="text-2xl font-bold text-white">{cat.name}</h2>
                      </div>
                      <div className="space-y-4">
                          {categoryFaqs.map((faq, index) => (
                              <FaqAccordion key={index} question={faq.q} answer={faq.a} />
                          ))}
                      </div>
                  </div>
              );
          })}

          {filteredFaqs.length === 0 && (
              <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">No questions found matching "{searchQuery}".</p>
                  <button onClick={() => setSearchQuery('')} className="mt-4 text-blue-400 hover:text-blue-300 underline">Clear search</button>
              </div>
          )}
      </section>

      {/* 3. POPULAR QUESTIONS HIGHLIGHT */}
      <section className="py-16 px-4 bg-slate-900 border-y border-slate-800">
          <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-white text-center mb-10">Most Popular Questions</h2>
              <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                      <h3 className="font-bold text-white mb-2">How much does it cost?</h3>
                      <p className="text-blue-400 font-bold text-xl mb-2">$149/month</p>
                      <p className="text-gray-400 text-sm">Includes everything. No hidden fees or tiered upgrades.</p>
                  </div>
                   <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                      <h3 className="font-bold text-white mb-2">How long until I see results?</h3>
                      <p className="text-green-400 font-bold text-xl mb-2">30-60 Days</p>
                      <p className="text-gray-400 text-sm">Most users see initial ranking improvements in the first month.</p>
                  </div>
                   <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                      <h3 className="font-bold text-white mb-2">Do I need marketing experience?</h3>
                      <p className="text-purple-400 font-bold text-xl mb-2">No Experience Needed</p>
                      <p className="text-gray-400 text-sm">Our Growth Plan guides you step-by-step through every task.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* 4. STILL HAVE QUESTIONS CTA */}
      <section className="py-24 px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Still have questions?</h2>
          <div className="flex flex-col md:flex-row justify-center gap-8 max-w-4xl mx-auto">
              <div className="flex-1 bg-slate-800/50 p-8 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-colors">
                  <h3 className="text-xl font-bold text-white mb-2">Contact Support</h3>
                  <p className="text-gray-400 mb-6">Can't find the answer you're looking for? Our team is here to help.</p>
                  <button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                      Email Support
                  </button>
                  <p className="text-xs text-gray-500 mt-3">Response within 24 hours</p>
              </div>
              <div className="flex-1 bg-slate-800/50 p-8 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-colors">
                  <h3 className="text-xl font-bold text-white mb-2">Try It Yourself</h3>
                  <p className="text-gray-400 mb-6">The best way to understand JetSuite is to see it in action.</p>
                  <button onClick={() => navigate('/pricing')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg shadow-blue-600/20">
                      Get Started
                  </button>
                  <p className="text-xs text-gray-500 mt-3">Get instant access to all 20 growth tools</p>
              </div>
          </div>
      </section>

      {/* 5. RELATED RESOURCES */}
      <section className="py-16 px-4 border-t border-slate-800 bg-slate-900/30">
          <div className="max-w-4xl mx-auto text-center">
              <p className="text-gray-400 mb-6 font-medium">Explore More Resources</p>
              <div className="flex flex-wrap justify-center gap-6">
                  <button onClick={() => navigate('/how-it-works')} className="text-blue-400 hover:text-white transition-colors">How It Works</button>
                  <span className="text-slate-700">•</span>
                  <button onClick={() => navigate('/features')} className="text-blue-400 hover:text-white transition-colors">Features & Tools</button>
                  <span className="text-slate-700">•</span>
                  <button onClick={() => navigate('/pricing')} className="text-blue-400 hover:text-white transition-colors">Pricing</button>
              </div>
          </div>
      </section>

    </div>
  );
};
