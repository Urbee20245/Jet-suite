
import React from 'react';
import { Header } from '../components/marketing/Header';
import { Footer } from '../components/marketing/Footer';
import { LandingPage } from './LandingPage';
import { HowItWorksPage } from './HowItWorksPage';
import { FeaturesPage } from './FeaturesPage';
import { PricingPage } from './PricingPage';
import { SavingsPage } from './SavingsPage';
import { LoginPage } from './LoginPage';
import { BillingSuccessPage } from './BillingSuccessPage';
import { BillingLockedPage } from './BillingLockedPage';

interface MarketingWebsiteProps {
    currentPath: string;
    navigate: (path: string) => void;
    onLoginSuccess: (email: string) => void;
}

export const MarketingWebsite: React.FC<MarketingWebsiteProps> = ({ currentPath, navigate, onLoginSuccess }) => {

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
        <div className="bg-brand-darker text-gray-200 font-sans">
            <Header navigate={navigate} />
            <main>{renderPage()}</main>
            <Footer navigate={navigate} />
        </div>
    );
};
