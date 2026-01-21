import React from 'react';
import { Header } from '../components/marketing/Header';
import { Footer } from '../components/marketing/Footer';
import { LandingPage } from './LandingPage';
import { HowItWorksPage } from './HowItWorksPage';
import { FeaturesPage } from './FeaturesPage';
import { PricingPage } from './PricingPage';
import { SavingsPage } from './SavingsPage';
import { LoginPage } from './LoginPage';
import { FaqPage } from './FaqPage';
import { DemoJetBizPage } from './DemoJetBizPage';
import { DemoJetVizPage } from './DemoJetVizPage';
import { GetStartedPage } from './GetStartedPage';
import { BillingSuccessPage } from './BillingSuccessPage';
import { BillingLockedPage } from './BillingLockedPage';
import { PrivacyPolicy } from './PrivacyPolicy';
import { TermsOfService } from './TermsOfService';
import { NotFoundPage } from './NotFoundPage'; // Import NotFoundPage
import { ContactPage } from './ContactPage'; // Import ContactPage
import JethelperApp from '../jethelper/JethelperApp';

interface MarketingWebsiteProps {
    currentPath: string;
    navigate: (path: string) => void;
    onLoginSuccess: (email: string) => void;
    onLogout: () => void; // ADDED PROP
}

export const MarketingWebsite: React.FC<MarketingWebsiteProps> = ({ currentPath, navigate, onLoginSuccess, onLogout }) => {
    const renderPage = () => {
        switch (currentPath) {
            case '/':
                return <LandingPage navigate={navigate} />;
            case '/how-it-works':
                return <HowItWorksPage navigate={navigate} />;
            case '/features':
                return <FeaturesPage navigate={navigate} />;
            case '/pricing':
                return <PricingPage navigate={navigate} />;
            case '/savings':
                return <SavingsPage navigate={navigate} />;
            case '/get-started':
                return <GetStartedPage navigate={navigate} />;
            case '/faq':
                return <FaqPage navigate={navigate} />;
            case '/demo/jetbiz':
                return <DemoJetBizPage navigate={navigate} />;
            case '/demo/jetviz':
                return <DemoJetVizPage navigate={navigate} />;
            case '/login':
                return <LoginPage navigate={navigate} onLoginSuccess={onLoginSuccess} />;
            case '/billing/success':
                return <BillingSuccessPage navigate={navigate} />;
            case '/billing/locked':
                return <BillingLockedPage navigate={navigate} onLogout={onLogout} />;
            case '/privacy-policy':
                return <PrivacyPolicy />;
            case '/terms':
                return <TermsOfService />;
            case '/contact': // NEW ROUTE
                return <ContactPage />;
            default:
                // Handle 404 Not Found
                return <NotFoundPage navigate={navigate} />;
        }
    };

    return (
        <div className="bg-brand-darker text-gray-200 font-sans">
            <Header navigate={navigate} />
            <main>{renderPage()}</main>
            <Footer navigate={navigate} />
            
            {/* JetHelper chatbot - shows on all pages except login */}
            {currentPath !== '/login' && <JethelperApp />}
        </div>
    );
};