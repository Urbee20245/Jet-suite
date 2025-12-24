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
import { BillingSuccessPage } from './BillingSuccessPage';
import { BillingLockedPage } from './BillingLockedPage';

interface MarketingWebsiteProps {
    currentPath: string;
    navigate: (path: string) => void;
    onLoginSuccess: (email: string) => void;
}

export const MarketingWebsite: React.FC<MarketingWebsiteProps> = ({ currentPath, navigate, onLoginSuccess }) => {
    const isPricingPage = currentPath === '/pricing';

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
            case '/faq':
                return <FaqPage navigate={navigate} />;
            case '/login':
                return <LoginPage navigate={navigate} onLoginSuccess={onLoginSuccess} />;
            case '/billing/success':
                return <BillingSuccessPage navigate={navigate} />;
            case '/billing/locked':
                return <BillingLockedPage navigate={navigate} />;
            default:
                return <LandingPage navigate={navigate} />;
        }
    };

    return (
        <div className={`font-sans min-h-screen ${isPricingPage ? 'bg-brand-darker text-gray-200' : 'bg-white text-slate-600'}`}>
            <Header navigate={navigate} isDarkMode={isPricingPage} />
            <main>{renderPage()}</main>
            <Footer navigate={navigate} isDarkMode={isPricingPage} />
        </div>
    );
};
