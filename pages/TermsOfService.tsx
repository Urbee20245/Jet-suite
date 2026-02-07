import React, { useEffect } from 'react';

interface TermsOfServiceProps {
  embedded?: boolean;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ embedded = false }) => {
  useEffect(() => {
    document.title = 'Terms of Service | JetSuite';
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Standalone Header - hidden when embedded inside MarketingWebsite */}
      {!embedded && (
        <div className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/Jetsuitewing.png" alt="JetSuite" className="w-8 h-8" />
                <span className="text-xl font-bold text-white">JetSuite</span>
              </div>
              <a
                href="/"
                className="px-4 py-2 bg-accent-purple hover:bg-accent-purple/80 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                ← Back to Home
              </a>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-100 mb-4">Terms of Service</h1>
          <p className="text-gray-100">
            <strong>Effective Date:</strong> December 29, 2024
          </p>
          <p className="text-gray-100">
            <strong>Last Updated:</strong> December 29, 2024
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-8">
          <p className="text-gray-100 mb-4">
            Welcome to JetSuite. These Terms of Service ("Terms") govern your access to and use of our SaaS platform
            for marketing automation, content publishing, and analytics (the "Service"). By accessing or using the Service,
            you agree to be bound by these Terms.
          </p>
          <p className="text-gray-100 mb-4 bg-yellow-900 border-l-4 border-yellow-500 p-4">
            <strong>IMPORTANT:</strong> Please read these Terms carefully. If you do not agree to these Terms, you may not 
            access or use the Service.
          </p>
        </section>

        {/* Section 1: Acceptance */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-100 mb-4">
            By creating an account, accessing, or using JetSuite, you agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li>Comply with these Terms of Service</li>
            <li>Comply with our Privacy Policy</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Be at least 18 years old or the age of majority in your jurisdiction</li>
          </ul>
        </section>

        {/* Section 2: Service Description */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">2. Service Description</h2>
          <p className="text-gray-100 mb-4">
            JetSuite provides marketing automation, content publishing, and analytics tools and services including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li>Business analysis and optimization tools</li>
            <li>Social media management and scheduling</li>
            <li>Content creation and AI-powered assistance</li>
            <li>Review management and response</li>
            <li>Analytics and reporting</li>
            <li>Integration with third-party platforms</li>
          </ul>
          <p className="text-gray-100 mb-4">
            We reserve the right to modify, suspend, or discontinue any part of the Service at any time with or without 
            notice.
          </p>
        </section>

        {/* Section 3: Account Registration */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">3. Account Registration and Security</h2>
          <p className="text-gray-100 mb-4">
            <strong>3.1 Account Creation:</strong> You must provide accurate, current, and complete information during 
            registration and keep your account information updated.
          </p>
          <p className="text-gray-100 mb-4">
            <strong>3.2 Account Security:</strong> You are responsible for:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li>Maintaining the confidentiality of your password</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized access</li>
          </ul>
          <p className="text-gray-100 mb-4">
            <strong>3.3 Account Termination:</strong> We reserve the right to suspend or terminate your account if you 
            violate these Terms.
          </p>
        </section>

        {/* Section 4: Subscription and Payment */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">4. Subscription and Payment Terms</h2>
          <p className="text-gray-100 mb-4">
            <strong>4.1 Subscription Plans:</strong> We offer various subscription tiers with different features and pricing.
          </p>
          <p className="text-gray-100 mb-4">
            <strong>4.2 Payment:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li>Subscriptions are billed monthly or annually in advance</li>
            <li>Payment is processed through Stripe, our third-party payment processor</li>
            <li>All fees are non-refundable except as required by law</li>
            <li>You authorize us to charge your payment method for all fees incurred</li>
          </ul>
          <p className="text-gray-100 mb-4">
            <strong>4.3 Price Changes:</strong> We may change subscription prices with 30 days' advance notice.
          </p>
          <p className="text-gray-100 mb-4">
            <strong>4.4 Cancellation:</strong> You may cancel your subscription at any time. Cancellation takes effect at 
            the end of your current billing period.
          </p>
          <p className="text-gray-100 mb-4">
            <strong>4.5 Refunds:</strong> No refunds for partial subscription periods, except as required by law or at our 
            sole discretion.
          </p>
        </section>

        {/* Section 5: Acceptable Use */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">5. Acceptable Use Policy</h2>
          <p className="text-gray-100 mb-4">
            You agree NOT to use the Service to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Post spam, malicious content, or viruses</li>
            <li>Harass, threaten, or harm others</li>
            <li>Impersonate any person or entity</li>
            <li>Collect user data without consent</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Attempt unauthorized access to our systems</li>
            <li>Use the Service for any illegal purpose</li>
            <li>Post false, misleading, or defamatory content</li>
            <li>Violate third-party platform terms (Facebook, Google, etc.)</li>
          </ul>
        </section>

        {/* Section 6: Content and Intellectual Property */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">6. Content and Intellectual Property</h2>
          <p className="text-gray-100 mb-4">
            <strong>6.1 Your Content:</strong> You retain all rights to content you create, upload, or post through the Service.
          </p>
          <p className="text-gray-100 mb-4">
            <strong>6.2 License to Use Your Content:</strong> You grant us a worldwide, non-exclusive, royalty-free license to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li>Store, process, and display your content to provide the Service</li>
            <li>Post content to third-party platforms on your behalf</li>
            <li>Use anonymized, aggregated data for analytics and improvements</li>
          </ul>
          <p className="text-gray-100 mb-4">
            <strong>6.3 Our Intellectual Property:</strong> The Service, including all software, designs, text, graphics, 
            and trademarks, is owned by JetSuite and protected by copyright and intellectual property laws.
          </p>
          <p className="text-gray-100 mb-4">
            <strong>6.4 AI-Generated Content:</strong> Content generated using our AI tools is provided to you for your use. 
            You are responsible for reviewing and ensuring all AI-generated content complies with applicable laws and third-party terms.
          </p>
        </section>

        {/* Section 7: Third-Party Services */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">7. Third-Party Services and Integrations</h2>
          <p className="text-gray-100 mb-4">
            <strong>7.1 Third-Party Platforms:</strong> When you connect third-party accounts (Facebook, Instagram, Google, etc.):
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li>You must comply with their terms of service</li>
            <li>We are not responsible for their actions or policies</li>
            <li>They may change their APIs or terms at any time</li>
            <li>Service interruptions may occur due to third-party issues</li>
          </ul>
          <p className="text-gray-100 mb-4">
            <strong>7.2 Your Responsibility:</strong> You are solely responsible for content posted to third-party platforms 
            through our Service.
          </p>
        </section>

        {/* Section 8: Disclaimers */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">8. Disclaimers and Limitations</h2>
          <div className="bg-red-900 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-gray-100 mb-4">
              <strong>8.1 "AS IS" BASIS:</strong> THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES 
              OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
              PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
            <p className="text-gray-100 mb-4">
              <strong>8.2 NO GUARANTEE:</strong> WE DO NOT GUARANTEE THAT:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-100 mb-4 ml-4">
              <li>The Service will be uninterrupted or error-free</li>
              <li>Defects will be corrected</li>
              <li>The Service is free of viruses or harmful components</li>
              <li>Results from using the Service will meet your expectations</li>
            </ul>
            <p className="text-gray-100">
              <strong>8.3 AI-GENERATED CONTENT:</strong> AI-generated content may contain errors, inaccuracies, or 
              inappropriate material. You are responsible for reviewing and ensuring all AI-generated content complies with applicable laws and third-party terms.
            </p>
          </div>
        </section>

        {/* Section 9: Limitation of Liability */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">9. Limitation of Liability</h2>
          <div className="bg-red-900 border-l-4 border-red-500 p-4">
            <p className="text-gray-100 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, JETSUITE SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-100 mb-4 ml-4">
              <li>ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
              <li>LOSS OF PROFITS, DATA, USE, OR GOODWILL</li>
              <li>SERVICE INTERRUPTIONS OR DOWNTIME</li>
              <li>ACTIONS OF THIRD-PARTY PLATFORMS</li>
              <li>UNAUTHORIZED ACCESS TO YOUR ACCOUNT</li>
              <li>ERRORS IN AI-GENERATED CONTENT</li>
            </ul>
            <p className="text-gray-100 mb-4">
              OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM, 
              OR $100, WHICHEVER IS GREATER.
            </p>
            <p className="text-gray-100">
              SOME JURISDICTIONS DO NOT ALLOW LIMITATIONS ON IMPLIED WARRANTIES OR EXCLUSIONS OF LIABILITY, SO THESE 
              LIMITATIONS MAY NOT APPLY TO YOU.
            </p>
          </div>
        </section>

        {/* Section 10: Indemnification */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">10. Indemnification</h2>
          <p className="text-gray-100 mb-4">
            You agree to indemnify, defend, and hold harmless JetSuite and its officers, directors, employees, and agents from 
            any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li>Your use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any third-party rights</li>
            <li>Content you post or share through the Service</li>
            <li>Your violation of any laws or regulations</li>
          </ul>
        </section>

        {/* Section 11: Termination */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">11. Termination</h2>
          <p className="text-gray-100 mb-4">
            <strong>11.1 By You:</strong> You may terminate your account at any time by canceling your subscription.
          </p>
          <p className="text-gray-100 mb-4">
            <strong>11.2 By Us:</strong> We may terminate or suspend your account immediately if you:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li>Violate these Terms</li>
            <li>Fail to pay fees when due</li>
            <li>Engage in fraudulent activity</li>
            <li>Pose a security or legal risk</li>
            <li>Violate third-party platform terms</li>
          </ul>
          <p className="text-gray-100 mb-4">
            <strong>11.3 Effect of Termination:</strong> Upon termination:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li>Your right to use the Service ceases immediately</li>
            <li>We may delete your data after 30 days</li>
            <li>No refunds for unused subscription time (except as required by law)</li>
            <li>Sections that should survive (indemnification, liability limitations) remain in effect</li>
          </ul>
        </section>

        {/* Section 12: Changes to Terms */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">12. Changes to Terms</h2>
          <p className="text-gray-100 mb-4">
            We may modify these Terms at any time. If we make material changes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li>We will notify you via email or in-app notification</li>
            <li>Changes become effective 30 days after notice</li>
            <li>Continued use of the Service constitutes acceptance</li>
            <li>If you don't agree, you may cancel your subscription</li>
          </ul>
        </section>

        {/* Section 13: Governing Law */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">13. Governing Law and Dispute Resolution</h2>
          <p className="text-gray-100 mb-4">
            <strong>13.1 Governing Law:</strong> These Terms are governed by the laws of the State of Georgia, United States, 
            without regard to conflict of law principles.
          </p>
          <p className="text-gray-100 mb-4">
            <strong>13.2 Arbitration:</strong> Any disputes arising from these Terms or the Service shall be resolved through 
            binding arbitration, except:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li>You may bring claims in small claims court</li>
            <li>We may seek injunctive relief in court</li>
          </ul>
          <p className="text-gray-100 mb-4">
            <strong>13.3 Class Action Waiver:</strong> You agree to resolve disputes on an individual basis and waive any 
            right to participate in class actions.
          </p>
        </section>

        {/* Section 14: Miscellaneous */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">14. Miscellaneous</h2>
          <p className="text-gray-100 mb-4">
            <strong>14.1 Entire Agreement:</strong> These Terms constitute the entire agreement between you and JetSuite.
          </p>
          <p className="text-gray-100 mb-4">
            <strong>14.2 Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect.
          </p>
          <p className="text-gray-100 mb-4">
            <strong>14.3 No Waiver:</strong> Our failure to enforce any right does not waive that right.
          </p>
          <p className="text-gray-100 mb-4">
            <strong>14.4 Assignment:</strong> You may not assign these Terms. We may assign our rights to any successor or affiliate.
          </p>
          <p className="text-gray-100 mb-4">
            <strong>14.5 Force Majeure:</strong> We are not liable for delays or failures due to circumstances beyond our control.
          </p>
        </section>

        {/* Section 15: Contact */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">15. Contact Information</h2>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <p className="text-gray-100 mb-2">
              For questions about these Terms, contact us:
            </p>
            <p className="text-gray-100 mb-2">
              <strong>Email:</strong>{' '}
              <a href="mailto:legal@getjetsuite.com" className="text-accent-blue hover:underline">
                legal@getjetsuite.com
              </a>
            </p>
            <p className="text-gray-100">
              <strong>Website:</strong>{' '}
              <a href="https://www.getjetsuite.com" className="text-accent-blue hover:underline">
                www.getjetsuite.com
              </a>
            </p>
          </div>
        </section>

        {/* Acceptance */}
        <section className="mb-8 bg-blue-900 border-l-4 border-blue-500 p-4">
          <p className="text-gray-100 font-semibold">
            BY USING JETSUITE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.
          </p>
        </section>

        {/* Footer */}
        <section className="mt-12 pt-8 border-t border-gray-700">
          <p className="text-sm text-gray-100 text-center">
            © {new Date().getFullYear()} JetSuite. All rights reserved.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;