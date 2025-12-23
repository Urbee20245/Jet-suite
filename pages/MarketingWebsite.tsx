
import React from 'react';
import { Header } from '../components/marketing/Header';
import { Footer } from '../components/marketing/Footer';
import { LandingPage } from './LandingPage';
import { PricingPage } from './PricingPage';
import { SavingsPage } from './SavingsPage';
import { LoginPage } from './LoginPage';
import { BillingSuccessPage } from './BillingSuccessPage';

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
            case '/pricing':
                return <PricingPage navigate={navigate} />;
            case '/savings':
                return <SavingsPage navigate={navigate} />;
            case '/login':
                return <LoginPage navigate={navigate} onLoginSuccess={onLoginSuccess} />;
            case '/billing/success':
                return <BillingSuccessPage navigate={navigate} />;
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
