import React from 'react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-100 mb-4">Privacy Policy</h1>
          <p className="text-gray-100-muted">
            <strong>Effective Date:</strong> December 29, 2024
          </p>
          <p className="text-gray-100-muted">
            <strong>Last Updated:</strong> December 29, 2024
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-8 prose prose-lg max-w-none">
          <p className="text-gray-100">
            Welcome to JetSuite ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, 
            and safeguard your information when you use our digital marketing software-as-a-service platform (the "Service"). 
            Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, 
            please do not access the Service.
          </p>
          <p className="text-gray-100">
            We reserve the right to make changes to this Privacy Policy at any time and for any reason. We will alert you 
            about any changes by updating the "Last Updated" date of this Privacy Policy. You are encouraged to periodically 
            review this Privacy Policy to stay informed of updates.
          </p>
        </section>

        {/* Table of Contents */}
        <section className="mb-8 bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">Table of Contents</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-100">
            <li><a href="#information-collection" className="text-accent-blue hover:underline">Information We Collect</a></li>
            <li><a href="#information-use" className="text-accent-blue hover:underline">How We Use Your Information</a></li>
            <li><a href="#information-sharing" className="text-accent-blue hover:underline">Disclosure of Your Information</a></li>
            <li><a href="#third-party-services" className="text-accent-blue hover:underline">Third-Party Services</a></li>
            <li><a href="#data-security" className="text-accent-blue hover:underline">Security of Your Information</a></li>
            <li><a href="#data-retention" className="text-accent-blue hover:underline">Data Retention</a></li>
            <li><a href="#user-rights" className="text-accent-blue hover:underline">Your Rights</a></li>
            <li><a href="#cookies" className="text-accent-blue hover:underline">Cookies and Tracking</a></li>
            <li><a href="#children" className="text-accent-blue hover:underline">Children's Privacy</a></li>
            <li><a href="#international" className="text-accent-blue hover:underline">International Users</a></li>
            <li><a href="#california" className="text-accent-blue hover:underline">California Privacy Rights</a></li>
            <li><a href="#gdpr" className="text-accent-blue hover:underline">GDPR Compliance</a></li>
            <li><a href="#contact" className="text-accent-blue hover:underline">Contact Us</a></li>
          </ol>
        </section>

        {/* Section 1: Information Collection */}
        <section id="information-collection" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">1. Information We Collect</h2>
          
          <h3 className="text-xl font-semibold text-gray-100 mb-3">1.1 Personal Information You Provide</h3>
          <p className="text-gray-100 mb-4">
            We collect information that you voluntarily provide to us when you:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li>Register for an account</li>
            <li>Subscribe to our services</li>
            <li>Connect third-party social media accounts</li>
            <li>Contact us for support</li>
            <li>Participate in surveys or promotions</li>
          </ul>
          <p className="text-gray-100 mb-4">
            This information may include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li><strong>Account Information:</strong> Name, email address, username, password</li>
            <li><strong>Business Information:</strong> Business name, website URL, business category, location</li>
            <li><strong>Payment Information:</strong> Credit card details, billing address (processed securely through Stripe)</li>
            <li><strong>Profile Information:</strong> Business logo, brand colors, fonts, descriptions</li>
            <li><strong>Communication Data:</strong> Messages, feedback, support requests</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-100 mb-3">1.2 Information Collected Automatically</h3>
          <p className="text-gray-100 mb-4">
            When you access our Service, we automatically collect certain information:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
            <li><strong>Usage Information:</strong> Pages viewed, features used, time spent, click patterns</li>
            <li><strong>Log Data:</strong> Access times, error logs, performance data</li>
            <li><strong>Location Data:</strong> General geographic location based on IP address</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-100 mb-3">1.3 Information from Third-Party Services</h3>
          <p className="text-gray-100 mb-4">
            When you connect third-party accounts (Facebook, Instagram, Google Business Profile, etc.), we receive:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li><strong>OAuth Tokens:</strong> Access tokens to post on your behalf (encrypted and stored securely)</li>
            <li><strong>Profile Data:</strong> Username, profile ID, email (if provided)</li>
            <li><strong>Page/Account Data:</strong> Pages you manage, basic account information</li>
            <li><strong>Analytics Data:</strong> Performance metrics from connected platforms</li>
          </ul>
          <p className="text-gray-100 mb-4 bg-yellow-900 border-l-4 border-yellow-500 p-4">
            <strong>Important:</strong> We NEVER store your social media passwords. All connections use secure OAuth 2.0 
            authentication, and you can revoke access at any time.
          </p>
        </section>

        {/* Section 2: How We Use Information */}
        <section id="information-use" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">2. How We Use Your Information</h2>
          <p className="text-gray-100 mb-4">
            We use the information we collect for the following purposes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li><strong>Provide Services:</strong> Create and manage your account, process subscriptions, deliver requested features</li>
            <li><strong>Social Media Management:</strong> Post content to your connected accounts, schedule posts, analyze performance</li>
            <li><strong>Business Analysis:</strong> Generate reports, provide insights, recommend improvements</li>
            <li><strong>Communication:</strong> Send service updates, respond to inquiries, provide customer support</li>
            <li><strong>Payment Processing:</strong> Process subscriptions and handle billing (via Stripe)</li>
            <li><strong>Improve Services:</strong> Analyze usage patterns, fix bugs, develop new features</li>
            <li><strong>Security:</strong> Detect fraud, prevent abuse, protect user accounts</li>
            <li><strong>Legal Compliance:</strong> Comply with legal obligations, enforce our terms</li>
            <li><strong>Marketing:</strong> Send promotional materials (only with your consent, opt-out anytime)</li>
          </ul>
        </section>

        {/* Section 3: Information Sharing */}
        <section id="information-sharing" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">3. Disclosure of Your Information</h2>
          <p className="text-gray-100 mb-4">
            We may share your information in the following situations:
          </p>
          
          <h3 className="text-xl font-semibold text-gray-100 mb-3">3.1 Service Providers</h3>
          <p className="text-gray-100 mb-4">
            We share information with third-party service providers who perform services on our behalf:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li><strong>Stripe:</strong> Payment processing</li>
            <li><strong>Supabase:</strong> Database and authentication</li>
            <li><strong>Vercel:</strong> Hosting and deployment</li>
            <li><strong>Google (Gemini AI):</strong> AI-powered content generation and analysis</li>
            <li><strong>Email Service Providers:</strong> Transactional and marketing emails</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-100 mb-3">3.2 Social Media Platforms</h3>
          <p className="text-gray-100 mb-4">
            When you connect social media accounts, we interact with their APIs to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li>Post content on your behalf</li>
            <li>Retrieve analytics and performance data</li>
            <li>Manage your pages and accounts</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-100 mb-3">3.3 Legal Requirements</h3>
          <p className="text-gray-100 mb-4">
            We may disclose your information if required by law or in response to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li>Court orders or legal process</li>
            <li>Government or regulatory requests</li>
            <li>Protection of our rights, property, or safety</li>
            <li>Prevention of fraud or illegal activity</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-100 mb-3">3.4 Business Transfers</h3>
          <p className="text-gray-100 mb-4">
            If we are involved in a merger, acquisition, or sale of assets, your information may be transferred. 
            We will notify you before your information becomes subject to a different privacy policy.
          </p>

          <h3 className="text-xl font-semibold text-gray-100 mb-3">3.5 With Your Consent</h3>
          <p className="text-gray-100 mb-4">
            We may share your information for any other purpose with your explicit consent.
          </p>

          <p className="text-gray-100 mt-6 bg-blue-900 border-l-4 border-blue-500 p-4">
            <strong>We Do NOT:</strong> Sell, rent, or trade your personal information to third parties for their marketing purposes.
          </p>
        </section>

        {/* Section 4: Third-Party Services */}
        <section id="third-party-services" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">4. Third-Party Services</h2>
          <p className="text-gray-100 mb-4">
            Our Service integrates with third-party platforms and services:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li><strong>Facebook/Instagram:</strong> Subject to Meta's Privacy Policy</li>
            <li><strong>Google Business Profile:</strong> Subject to Google's Privacy Policy</li>
            <li><strong>Twitter/X:</strong> Subject to X's Privacy Policy</li>
            <li><strong>LinkedIn:</strong> Subject to LinkedIn's Privacy Policy</li>
            <li><strong>TikTok:</strong> Subject to TikTok's Privacy Policy</li>
            <li><strong>Stripe:</strong> Subject to Stripe's Privacy Policy</li>
          </ul>
          <p className="text-gray-100 mb-4">
            We are not responsible for the privacy practices of these third-party services. We encourage you to review 
            their privacy policies before connecting your accounts.
          </p>
        </section>

        {/* Section 5: Data Security */}
        <section id="data-security" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">5. Security of Your Information</h2>
          <p className="text-gray-100 mb-4">
            We implement appropriate technical and organizational security measures to protect your information:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li><strong>Encryption:</strong> All data transmitted is encrypted using SSL/TLS</li>
            <li><strong>Token Encryption:</strong> OAuth access tokens are encrypted using AES-256 encryption</li>
            <li><strong>Secure Storage:</strong> Data stored in secure, encrypted databases</li>
            <li><strong>Access Controls:</strong> Strict access controls and authentication requirements</li>
            <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
            <li><strong>Secure Payment Processing:</strong> Payment data handled by PCI-compliant Stripe</li>
          </ul>
          <p className="text-gray-100 mb-4 bg-yellow-900 border-l-4 border-yellow-500 p-4">
            <strong>Important:</strong> No method of transmission over the Internet or electronic storage is 100% secure. 
            While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
          </p>
        </section>

        {/* Section 6: Data Retention */}
        <section id="data-retention" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">6. Data Retention</h2>
          <p className="text-gray-100 mb-4">
            We retain your information for as long as necessary to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li>Provide you with our services</li>
            <li>Comply with legal obligations</li>
            <li>Resolve disputes</li>
            <li>Enforce our agreements</li>
          </ul>
          <p className="text-gray-100 mb-4">
            <strong>Account Deletion:</strong> If you delete your account, we will delete or anonymize your personal 
            information within 30 days, except where we are required to retain it for legal or compliance purposes.
          </p>
          <p className="text-gray-100 mb-4">
            <strong>Backup Data:</strong> Deleted data may persist in backup systems for up to 90 days before permanent deletion.
          </p>
        </section>

        {/* Section 7: User Rights */}
        <section id="user-rights" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">7. Your Rights</h2>
          <p className="text-gray-100 mb-4">
            Depending on your location, you may have the following rights regarding your personal information:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
            <li><strong>Restriction:</strong> Request restriction of processing of your information</li>
            <li><strong>Objection:</strong> Object to processing of your information</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent for processing (where consent is the legal basis)</li>
            <li><strong>Opt-Out:</strong> Opt-out of marketing communications</li>
          </ul>
          <p className="text-gray-100 mb-4">
            To exercise these rights, please contact us at{' '}
            <a href="mailto:privacy@getjetsuite.com" className="text-accent-blue hover:underline">
              privacy@getjetsuite.com
            </a>
          </p>
          <p className="text-gray-100 mb-4">
            We will respond to your request within 30 days.
          </p>
        </section>

        {/* Section 8: Cookies */}
        <section id="cookies" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">8. Cookies and Tracking Technologies</h2>
          <p className="text-gray-100 mb-4">
            We use cookies and similar tracking technologies to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li><strong>Essential Cookies:</strong> Required for authentication and security</li>
            <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
            <li><strong>Analytics Cookies:</strong> Understand how you use our Service</li>
            <li><strong>Performance Cookies:</strong> Monitor and improve Service performance</li>
          </ul>
          <p className="text-gray-100 mb-4">
            You can control cookies through your browser settings. However, disabling cookies may limit your ability 
            to use certain features of our Service.
          </p>
        </section>

        {/* Section 9: Children's Privacy */}
        <section id="children" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">9. Children's Privacy</h2>
          <p className="text-gray-100 mb-4">
            Our Service is not intended for children under the age of 18. We do not knowingly collect personal information 
            from children under 18. If you are a parent or guardian and believe your child has provided us with personal 
            information, please contact us immediately. If we become aware that we have collected personal information from 
            a child under 18 without parental consent, we will take steps to delete that information.
          </p>
        </section>

        {/* Section 10: International Users */}
        <section id="international" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">10. International Data Transfers</h2>
          <p className="text-gray-100 mb-4">
            Your information may be transferred to and processed in countries other than your country of residence. 
            These countries may have data protection laws that are different from the laws of your country.
          </p>
          <p className="text-gray-100 mb-4">
            We take appropriate safeguards to ensure that your personal information remains protected in accordance 
            with this Privacy Policy, including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li>Standard Contractual Clauses approved by the European Commission</li>
            <li>Ensuring service providers are certified under approved frameworks</li>
            <li>Implementing appropriate technical and organizational measures</li>
          </ul>
        </section>

        {/* Section 11: California Privacy Rights */}
        <section id="california" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">11. California Privacy Rights (CCPA)</h2>
          <p className="text-gray-100 mb-4">
            If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA):
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li><strong>Right to Know:</strong> Request information about personal data collected, used, and shared</li>
            <li><strong>Right to Delete:</strong> Request deletion of personal information</li>
            <li><strong>Right to Opt-Out:</strong> Opt-out of sale of personal information (we do not sell personal information)</li>
            <li><strong>Right to Non-Discrimination:</strong> Not be discriminated against for exercising your rights</li>
          </ul>
          <p className="text-gray-100 mb-4">
            To exercise these rights, contact us at{' '}
            <a href="mailto:privacy@getjetsuite.com" className="text-accent-blue hover:underline">
              privacy@getjetsuite.com
            </a>
          </p>
          <p className="text-gray-100 mb-4">
            <strong>Verification:</strong> We may need to verify your identity before processing your request.
          </p>
          <p className="text-gray-100 mb-4">
            <strong>Authorized Agent:</strong> You may designate an authorized agent to make requests on your behalf.
          </p>
        </section>

        {/* Section 12: GDPR Compliance */}
        <section id="gdpr" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">12. GDPR Compliance (European Users)</h2>
          <p className="text-gray-100 mb-4">
            If you are located in the European Economic Area (EEA), you have rights under the General Data Protection 
            Regulation (GDPR):
          </p>
          
          <h3 className="text-xl font-semibold text-gray-100 mb-3">Legal Basis for Processing</h3>
          <p className="text-gray-100 mb-4">
            We process your personal data under the following legal bases:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li><strong>Contract Performance:</strong> To provide our services to you</li>
            <li><strong>Legitimate Interests:</strong> To improve our services, prevent fraud</li>
            <li><strong>Legal Compliance:</strong> To comply with legal obligations</li>
            <li><strong>Consent:</strong> For marketing communications and optional features</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-100 mb-3">Your GDPR Rights</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-100 mb-6 ml-4">
            <li>Right to access your personal data</li>
            <li>Right to rectification of inaccurate data</li>
            <li>Right to erasure ("right to be forgotten")</li>
            <li>Right to restrict processing</li>
            <li>Right to data portability</li>
            <li>Right to object to processing</li>
            <li>Right to withdraw consent</li>
            <li>Right to lodge a complaint with a supervisory authority</li>
          </ul>

          <p className="text-gray-100 mb-4">
            To exercise your rights, contact us at{' '}
            <a href="mailto:privacy@getjetsuite.com" className="text-accent-blue hover:underline">
              privacy@getjetsuite.com
            </a>
          </p>
        </section>

        {/* Section 13: Contact Us */}
        <section id="contact" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">13. Contact Us</h2>
          <p className="text-gray-100 mb-4">
            If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <p className="text-gray-100 mb-2">
              <strong>Email:</strong>{' '}
              <a href="mailto:privacy@getjetsuite.com" className="text-accent-blue hover:underline">
                privacy@getjetsuite.com
              </a>
            </p>
            <p className="text-gray-100 mb-2">
              <strong>Website:</strong>{' '}
              <a href="https://www.getjetsuite.com" className="text-accent-blue hover:underline">
                www.getjetsuite.com
              </a>
            </p>
            <p className="text-gray-100">
              <strong>Response Time:</strong> We will respond to your inquiry within 30 days
            </p>
          </div>
        </section>

        {/* Footer */}
        <section className="mt-12 pt-8 border-t border-gray-700">
          <p className="text-sm text-gray-100-muted text-center">
            © {new Date().getFullYear()} JetSuite. All rights reserved. This Privacy Policy is effective as of 
            the date stated at the top of this page.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
