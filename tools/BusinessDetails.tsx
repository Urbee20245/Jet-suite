import React, { useState, useEffect, useRef } from 'react';
import type { Tool, ProfileData, BusinessDna, GbpStatus, BrandDnaProfile, BusinessSearchResult } from '../types';
import { extractWebsiteDna, extractBrandDnaProfile, searchGoogleBusiness, generateBusinessDescription } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { InformationCircleIcon as InfoIcon, CheckCircleIcon, XMarkIcon, ChevronDownIcon, StarIcon, SparklesIcon, ArrowRightIcon } from '../components/icons/MiniIcons';
import { ALL_TOOLS } from '../constants';
import { getSupabaseClient } from '../integrations/supabase/client';
import { SocialAccountsStep } from '../components/SocialAccountsStep';

// ============================================
// TYPES
// ============================================
interface BusinessDetailsProps { 
    profileData: ProfileData; 
    onUpdate: (data: ProfileData) => void; 
    setActiveTool: (tool: Tool | null) => void; 
    onBusinessUpdated: () => void;
    isAdmin: boolean;
}
type ExtractionStage = 'idle' | 'extracting' | 'reviewing' | 'saving';

// ============================================
// HELPER FUNCTIONS
// ============================================
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const isBase64 = (str: string) => str.startsWith('data:image');

const imageURLToBase64 = async (url: string): Promise<string> => {
    if (!url || isBase64(url)) return url;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("CORS error fetching image, returning original URL:", error);
        return url; 
    }
};

// ============================================
// CONSTANTS
// ============================================
const BUSINESS_CATEGORIES = [
    "Accounting", "Advertising Agency", "Attorney / Law Firm", "Auto Repair", "Bakery", "Bank", 
    "Beauty Salon", "Car Dealer", "Chiropractor", "Church", "Cleaning Service", "Construction Company", 
    "Consultant", "Contractor", "Dentist", "Doctor", "Electrician", "Event Planner", 
    "Financial Services", "Fitness Center", "Florist", "HVAC Contractor", "Insurance Agency", 
    "Insurance & Financial Services", "Interior Designer", "Landscaper", "Lawyer", "Marketing Agency", 
    "Medical Practice", "Moving Company", "Painter", "Photographer", "Plumber", "Real Estate Agency", 
    "Restaurant", "Retail Store", "Roofing Contractor", "Salon / Spa", "Software Company", 
    "Tax Preparation", "Veterinarian", "Web Design", "Other"
];

// ============================================
// WIZARD UI COMPONENTS (NEW)
// ============================================

const AIGuidanceMessage: React.FC<{ message: string; emoji?: string }> = ({ message, emoji = "🤖" }) => (
    <div className="bg-gradient-to-r from-accent-purple/10 to-accent-blue/10 border-2 border-accent-purple/30 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
            <div className="text-4xl flex-shrink-0">{emoji}</div>
            <div>
                <h3 className="font-bold text-lg text-brand-text mb-2">AI Assistant</h3>
                <p className="text-brand-text-muted leading-relaxed">{message}</p>
            </div>
        </div>
    </div>
);

const WizardProgress: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => {
    const steps = [
        { number: 1, label: "Business Info" },
        { number: 2, label: "Business DNA" },
        { number: 3, label: "Google Profile" },
        { number: 4, label: "Social Accounts" }
    ];
    
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-brand-text-muted">
                    Step {currentStep} of {totalSteps}
                </p>
                <p className="text-sm font-semibold text-accent-purple">
                    {Math.round((currentStep / totalSteps) * 100)}% Complete
                </p>
            </div>
            <div className="relative">
                <div className="overflow-hidden h-3 flex rounded-full bg-brand-light border border-brand-border">
                    <div 
                        style={{ width: `${(currentStep / totalSteps) * 100}%` }} 
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-accent-purple to-accent-pink transition-all duration-700 ease-out"
                    />
                </div>
            </div>
            <div className="flex justify-between mt-3">
                {steps.map((step) => (
                    <div key={step.number} className="flex flex-col items-center flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                            currentStep > step.number 
                                ? 'bg-green-500 text-white' 
                                : currentStep === step.number 
                                    ? 'bg-gradient-to-r from-accent-purple to-accent-pink text-white ring-4 ring-accent-purple/20' 
                                    : 'bg-brand-light border-2 border-brand-border text-brand-text-muted'
                        }`}>
                            {currentStep > step.number ? '✓' : step.number}
                        </div>
                        <p className={`text-xs mt-1 font-medium ${
                            currentStep >= step.number ? 'text-brand-text' : 'text-brand-text-muted'
                        }`}>
                            {step.label}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const WizardStepContainer: React.FC<{ 
    title: string; 
    children: React.ReactNode;
    icon?: string;
}> = ({ title, children, icon }) => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="bg-brand-card rounded-xl shadow-xl border border-brand-border overflow-hidden">
            <div className="bg-gradient-to-r from-accent-purple to-accent-pink p-6">
                <div className="flex items-center gap-3">
                    {icon && <div className="text-white text-3xl">{icon}</div>}
                    <h2 className="text-2xl font-extrabold text-white">{title}</h2>
                </div>
            </div>
            <div className="p-8">
                {children}
            </div>
        </div>
    </div>
);

const StepCompletionCelebration: React.FC<{ 
    stepName: string; 
    onNext: () => void;
    nextStepName?: string;
}> = ({ stepName, onNext, nextStepName }) => (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 text-center border-2 border-green-200">
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <h3 className="text-2xl font-bold text-green-800 mb-2">{stepName} Complete!</h3>
        <p className="text-green-700 mb-6">Great job! You're one step closer to launching your business.</p>
        <button 
            onClick={onNext}
            className="bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto"
        >
            {nextStepName ? `Continue to ${nextStepName}` : 'Continue'} <ArrowRightIcon className="w-5 h-5" />
        </button>
    </div>
);

// ============================================
// EXISTING UI COMPONENTS
// ============================================

const DnaExtractionLoading: React.FC = () => {
    const steps = ["Connecting to website...", "Scanning for logo...", "Extracting brand colors...", "Detecting fonts...", "Analyzing brand style...", "Compiling results..."];
    const [currentStep, setCurrentStep] = useState(0);
    useEffect(() => { 
        const interval = setInterval(() => { 
            setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev)); 
        }, 2000); 
        return () => clearInterval(interval); 
    }, []);
    return (
        <div className="text-center p-8 bg-brand-light rounded-xl border-2 border-dashed border-brand-border">
            <h3 className="text-xl font-bold text-brand-text">Analyzing Your Website...</h3>
            <p className="text-brand-text-muted my-2">This usually takes 2-5 minutes.</p>
            <div className="w-full max-w-xs mx-auto my-6">
                <div className="relative pt-1">
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-accent-purple/20">
                        <div style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-accent-purple transition-all duration-500"></div>
                    </div>
                </div>
                <ul className="text-left text-sm text-brand-text-muted space-y-2">
                    {steps.map((step, index) => (
                        <li key={step} className={`flex items-center transition-opacity duration-300 ${index <= currentStep ? 'opacity-100' : 'opacity-40'}`}>
                            {index < currentStep ? <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" /> : <div className="w-4 h-4 mr-2"><Loader /></div>}
                            {step}
                        </li>
                    ))}
                </ul>
            </div>
            <p className="text-xs text-brand-text-muted">Please don't close this page.</p>
        </div>
    );
};

const DnaDetailedAnalysis: React.FC<{ 
    dnaProfile: BrandDnaProfile;
    onUpdate: (newProfile: BrandDnaProfile) => void;
    isEditable: boolean;
    openSections: string[];
    toggleSection: (key: string) => void;
}> = ({ dnaProfile, onUpdate, isEditable, openSections, toggleSection }) => {
    const handleFieldChange = (section: keyof BrandDnaProfile, field: any, value: any) => {
        onUpdate({ ...dnaProfile, [section]: { ...dnaProfile[section], [field]: value } });
    };
    
    return (
        <div className="space-y-3">
            {Object.entries(dnaProfile).map(([sectionKey, sectionValue]) => (
                <div key={sectionKey} className="border border-brand-border rounded-lg overflow-hidden bg-white">
                    <button 
                        type="button" 
                        onClick={() => toggleSection(sectionKey)} 
                        className="w-full flex justify-between items-center p-3 bg-brand-light hover:bg-brand-border transition-colors"
                    >
                        <h4 className="font-semibold text-brand-text capitalize">{sectionKey.replace(/_/g, ' ')}</h4>
                        <ChevronDownIcon className={`w-5 h-5 text-brand-text-muted transition-transform ${openSections.includes(sectionKey) ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.includes(sectionKey) && (
                        <div className="p-4 space-y-4">
                            {Object.entries(sectionValue).map(([fieldKey, fieldValue]) => (
                                <div key={fieldKey}>
                                    <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">
                                        {fieldKey.replace(/_/g, ' ')}
                                    </label>
                                    {isEditable ? (
                                        <textarea
                                            value={fieldValue as string}
                                            onChange={(e) => handleFieldChange(sectionKey as keyof BrandDnaProfile, fieldKey, e.target.value)}
                                            className="w-full mt-1 bg-brand-light border border-brand-border rounded-lg p-2 text-sm"
                                            rows={2}
                                        />
                                    ) : (
                                        <p className="text-sm text-brand-text mt-1">{fieldValue as string}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const GbpDashboard: React.FC<{ gbpData: ProfileData['googleBusiness']; onDisconnect: () => void }> = ({ gbpData, onDisconnect }) => (
    <div className="bg-brand-light p-6 rounded-lg border border-brand-border space-y-4">
        <div>
            <p className="font-bold text-brand-text">{gbpData.profileName}</p>
            <p className="text-sm text-brand-text-muted">{gbpData.address}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white p-3 rounded-lg border">
                <p className="font-bold text-xl flex items-center justify-center gap-1">
                    <StarIcon className="w-5 h-5 text-yellow-400"/> {gbpData.rating}
                </p>
                <p className="text-xs text-brand-text-muted">Rating</p>
            </div>
            <div className="bg-white p-3 rounded-lg border">
                <p className="font-bold text-xl">{gbpData.reviewCount}</p>
                <p className="text-xs text-brand-text-muted">Total Reviews</p>
            </div>
        </div>
        <div className="flex gap-4 pt-2">
            <a href={gbpData.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-accent-blue hover:underline">
                View on Maps
            </a>
            <button type="button" onClick={onDisconnect} className="text-sm font-semibold text-red-500 hover:underline ml-auto">
                Disconnect
            </button>
        </div>
    </div>
);

const GbpNotCreatedGuide: React.FC<{ 
    business: ProfileData['business']; 
    onUpdateStatus: (status: GbpStatus) => void; 
    onSkip: () => void;
}> = ({ business, onUpdateStatus, onSkip }) => (
    <div className="bg-brand-light p-6 rounded-lg border border-brand-border space-y-4">
        <h4 className="font-bold text-brand-text">Create Your Google Business Profile</h4>
        <p className="text-sm text-brand-text-muted">A Google Business Profile is essential for local search. Follow these steps:</p>
        <ol className="space-y-3 text-sm">
            <li>
                <span className="font-bold">1. Go to Google:</span> Click below to open Google Business Profile.<br/>
                <a href="https://business.google.com/create" target="_blank" rel="noopener noreferrer" className="inline-block mt-1 bg-blue-500 text-white font-semibold py-1 px-3 rounded-md text-xs hover:bg-blue-600">
                    Open Google
                </a>
            </li>
            <li><span className="font-bold">2. Enter Info:</span> Use your business name ({business.business_name}), category, etc.</li>
            <li><span className="font-bold">3. Verify:</span> Google will send a postcard or call. This can take 5-14 days.</li>
        </ol>
        <div className="flex justify-between items-center pt-2">
            <button type="button" onClick={onSkip} className="text-sm font-semibold text-brand-text-muted hover:underline">
                Skip for now
            </button>
            <button type="button" onClick={() => onUpdateStatus('Not Verified')} className="text-sm font-semibold text-accent-blue hover:underline">
                I've created my profile &rarr;
            </button>
        </div>
    </div>
);

const GbpNotVerifiedGuide: React.FC<{ onUpdateStatus: (status: GbpStatus) => void }> = ({ onUpdateStatus }) => (
    <div className="bg-brand-light p-6 rounded-lg border border-brand-border space-y-4">
        <h4 className="font-bold text-brand-text">Verify Your Google Business Profile</h4>
        <p className="text-sm text-brand-text-muted">Your profile won't appear in search results until verified.</p>
        <ol className="space-y-3 text-sm">
            <li>
                <span className="font-bold">1. Go to your Dashboard:</span> Click to open your profile.<br/>
                <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="inline-block mt-1 bg-blue-500 text-white font-semibold py-1 px-3 rounded-md text-xs hover:bg-blue-600">
                    Open My Profile
                </a>
            </li>
            <li><span className="font-bold">2. Find Prompt:</span> Look for the 'Get verified' or 'Verify now' prompt.</li>
            <li><span className="font-bold">3. Enter Code:</span> Enter the verification code when it arrives by mail.</li>
        </ol>
        <button type="button" onClick={() => onUpdateStatus('Verified')} className="text-sm font-semibold text-accent-blue hover:underline">
            I've verified my profile! &rarr;
        </button>
    </div>
);

const GbpConnect: React.FC<{ 
    profileData: ProfileData; 
    onSearch: (e: React.FormEvent) => Promise<void>; 
    searchResults: BusinessSearchResult[]; 
    loading: boolean; 
    error: string; 
    onSelect: (b: BusinessSearchResult) => void; 
    selected: BusinessSearchResult | null; 
    onConfirm: () => void; 
    onCancel: () => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}> = ({ profileData, onSearch, searchResults, loading, error, onSelect, selected, onConfirm, onCancel, searchTerm, setSearchTerm }) => { 
    if (loading) {
        return (
            <div className="bg-brand-light p-6 rounded-lg border text-center">
                <Loader />
                <h4 className="font-bold text-brand-text mt-4">Searching Google Maps...</h4>
                <p className="text-sm text-brand-text-muted mt-2">This may take a moment. We're scanning for verified business profiles that match your search.</p>
            </div>
        );
    }
    
    if (selected) {
        return (
            <div className="bg-brand-light p-6 rounded-lg border text-center">
                <h4 className="font-bold text-brand-text">Confirm This Business</h4>
                <p className="text-sm text-brand-text-muted mb-4">Is this the correct Google Business Profile?</p>
                <div className="bg-white my-4 p-4 rounded-lg border">
                    <p className="font-bold text-brand-text">{selected.name}</p>
                    <p className="text-sm text-brand-text-muted">{selected.address}</p>
                    <p className="text-xs text-brand-text-muted flex items-center justify-center gap-1 mt-1">
                        <StarIcon className="w-3 h-3 text-yellow-400" /> {selected.rating} ({selected.reviewCount} reviews)
                    </p>
                </div>
                <div className="flex gap-4 justify-center">
                    <button type="button" onClick={onCancel} className="text-sm font-semibold text-brand-text-muted hover:underline">
                        No, search again
                    </button>
                    <button type="button" onClick={onConfirm} className="bg-accent-blue text-white font-bold py-2 px-4 rounded-lg">
                        Save & Connect Profile
                    </button>
                </div>
            </div>
        );
    }
    
    return ( 
        <div className="bg-brand-light p-6 rounded-lg border space-y-4"> 
            <h4 className="font-bold text-brand-text">Connect Your Verified Profile</h4> 
            <form onSubmit={onSearch} className="space-y-4"> 
                <div>
                    <label className="text-xs font-semibold text-brand-text-muted">Search by Name & Location</label>
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        placeholder={`${profileData.business.business_name}, ${profileData.business.location}`} 
                        className="w-full bg-white border-brand-border rounded-lg p-2 text-sm mt-1" 
                    />
                </div> 
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" disabled={!searchTerm} className="w-full bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                    Find & Connect
                </button>
                <div className="space-y-2 mt-4">
                    {searchResults.map(r => 
                        <button 
                            type="button" 
                            key={r.name+r.address} 
                            onClick={() => onSelect(r)} 
                            className="w-full text-left p-3 bg-white hover:bg-gray-50 rounded-lg border"
                        >
                            <p className="font-semibold text-brand-text">{r.name}</p>
                            <p className="text-xs text-brand-text-muted">{r.address}</p>
                        </button>
                    )}
                </div> 
            </form> 
        </div> 
    ); 
};

// ============================================
// MAIN COMPONENT
// ============================================

export const BusinessDetails: React.FC<BusinessDetailsProps> = ({ profileData, onUpdate, setActiveTool, onBusinessUpdated, isAdmin }) => {
    const supabase = getSupabaseClient();
    
    // Wizard state
    const [currentWizardStep, setCurrentWizardStep] = useState(1);
    const [showCelebration, setShowCelebration] = useState(false);
    
    // Notification
    const [notification, setNotification] = useState<{message: string; type: 'error' | 'info'} | null>(null);
    
    // Business Info State
    const [business, setBusiness] = useState(profileData.business);
    const [locationType, setLocationType] = useState<'physical' | 'online' | 'home'>(
        profileData.business.location_type || 'physical'
    );
    const [isSavingInfo, setIsSavingInfo] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState('');
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
    const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
    
    // DNA State
    const [extractionStage, setExtractionStage] = useState<ExtractionStage>('idle');
    const [extractedDna, setExtractedDna] = useState<BusinessDna | null>(null);
    const [detailedDna, setDetailedDna] = useState<BrandDnaProfile | null>(profileData.business.brand_dna_profile || null);
    const [isDnaEditing, setIsDnaEditing] = useState(false);
    const [editableBrandProfile, setEditableBrandProfile] = useState<BrandDnaProfile | null>(null);
    const [openSections, setOpenSections] = useState<string[]>([]);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    
    // GBP State
    const [googleBusiness, setGoogleBusiness] = useState(profileData.googleBusiness);
    const [isGbpSkipped, setIsGbpSkipped] = useState(false);
    const [isSearchingGbp, setIsSearchingGbp] = useState(false);
    const [searchResults, setSearchResults] = useState<BusinessSearchResult[]>([]);
    const [searchError, setSearchError] = useState('');
    const [selectedGbp, setSelectedGbp] = useState<BusinessSearchResult | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Locking State
    const [isLocking, setIsLocking] = useState(false);
    const [isLocked, setIsLocked] = useState(profileData.business.is_locked || false);
    const [isDirty, setIsDirty] = useState(false);
    
    // Step Completion
    const step1Completed = Boolean(
        business.business_name && 
        business.business_website && 
        business.industry && 
        business.is_complete
    );
    const step2Completed = Boolean(profileData.business.isDnaApproved && detailedDna);
    const step3Completed = Boolean(
        googleBusiness.status === 'Verified' || isGbpSkipped
    );
    const step4Completed = true; // Social is always optional/complete
    const allStepsComplete = step1Completed && step2Completed && step3Completed && step4Completed;
    
    // Determine wizard step based on completion
    useEffect(() => {
        if (!step1Completed) {
            setCurrentWizardStep(1);
        } else if (!step2Completed) {
            setCurrentWizardStep(2);
        } else if (!step3Completed) {
            setCurrentWizardStep(3);
        } else if (!step4Completed) {
            setCurrentWizardStep(4);
        } else if (!isLocked) {
            setCurrentWizardStep(5); // Lock screen
        } else {
            setCurrentWizardStep(6); // Final redirect
        }
    }, [step1Completed, step2Completed, step3Completed, step4Completed, isLocked]);
    
    // Auto-redirect to homepage when locked
    useEffect(() => {
        if (allStepsComplete && isLocked) {
            setTimeout(() => {
                setActiveTool(null); // Navigate to Welcome/Home
            }, 2000);
        }
    }, [allStepsComplete, isLocked, setActiveTool]);
    
    // Celebration handler
    const handleStepComplete = () => {
        setShowCelebration(true);
        setTimeout(() => {
            setShowCelebration(false);
        }, 2500);
    };
    
    // AI Guidance
    const getAIGuidance = () => {
        switch(currentWizardStep) {
            case 1:
                return {
                    message: "Welcome! Let's start by setting up your business information. This will power all the AI tools in JetSuite, so accuracy is important. Take your time and fill in each field carefully.",
                    emoji: "👋"
                };
            case 2:
                return {
                    message: "Excellent! Now I'll extract your Business DNA from your website. This captures your brand's unique voice, colors, and style to ensure all AI-generated content matches your brand perfectly.",
                    emoji: "🧬"
                };
            case 3:
                return {
                    message: "Great progress! Let's connect your Google Business Profile. This unlocks powerful local SEO features and helps you manage your online reputation.",
                    emoji: "🗺️"
                };
            case 4:
                return {
                    message: "Almost done! Connect your social media accounts to schedule posts, auto-reply to messages, and manage everything from one dashboard. This step is optional but highly recommended.",
                    emoji: "📱"
                };
            case 5:
                return {
                    message: "Perfect! All steps complete. Now let's lock your profile to ensure consistency across all AI tools.",
                    emoji: "🔒"
                };
            case 6:
                return {
                    message: "🎊 Congratulations! Your business profile is complete and locked. You're ready to start using JetSuite's AI-powered growth tools. Redirecting you to your Command Center...",
                    emoji: "🚀"
                };
            default:
                return { message: "", emoji: "🤖" };
        }
    };
    
    // ========================================
    // HANDLERS - Business Info
    // ========================================
    
    const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setBusiness(prev => ({ ...prev, [name]: value }));
        setIsDirty(true);
    };
    
    const handleGenerateDescription = async () => {
        if (!business.business_name || !business.business_website) {
            setNotification({ message: 'Please enter business name and website first.', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
            return;
        }
        
        setIsGeneratingDescription(true);
        try {
            const description = await generateBusinessDescription(business.business_name, business.business_website, business.industry);
            setBusiness(prev => ({ ...prev, business_description: description }));
            setIsDirty(true);
        } catch (error) {
            setNotification({ message: 'Failed to generate description. Please try again.', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setIsGeneratingDescription(false);
        }
    };
    
    const handleSaveInfo = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e) e.preventDefault();
        
        if (!business.business_name || !business.business_website || !business.industry) {
            setNotification({ message: 'Please fill in all required fields.', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
            return;
        }
        
        if (locationType === 'physical' && !business.location) {
            setNotification({ message: 'Please enter your business location.', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
            return;
        }
        
        setIsSavingInfo(true);
        try {
            const { error } = await supabase
                .from('business_profiles')
                .update({
                    business_name: business.business_name,
                    business_website: business.business_website,
                    business_description: business.business_description,
                    industry: business.industry,
                    location_type: locationType,
                    city: locationType === 'physical' ? business.location?.split(',')[0]?.trim() : null,
                    state: locationType === 'physical' ? business.location?.split(',')[1]?.trim() : null,
                    is_complete: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profileData.business.id);
            
            if (error) throw error;
            
            setSaveSuccess('✓ Business information saved successfully!');
            setIsDirty(false);
            setTimeout(() => setSaveSuccess(''), 3000);
            
            onUpdate({
                ...profileData,
                business: {
                    ...profileData.business,
                    ...business,
                    is_complete: true,
                    location_type: locationType
                }
            });
            
            onBusinessUpdated();
            
            if (step1Completed && currentWizardStep === 1) {
                handleStepComplete();
            }
        } catch (error) {
            console.error('Error saving business info:', error);
            setNotification({ message: 'Failed to save. Please try again.', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setIsSavingInfo(false);
        }
    };
    
    // ========================================
    // HANDLERS - DNA
    // ========================================
    
    const handleExtractDna = async () => {
        if (!business.business_website) {
            setNotification({ message: 'Please enter your website URL first.', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
            return;
        }
        
        setExtractionStage('extracting');
        try {
            const dna = await extractWebsiteDna(business.business_website);
            setExtractedDna(dna);
            setExtractionStage('reviewing');
            
            const brandProfile = await extractBrandDnaProfile(business.business_website, dna);
            setDetailedDna(brandProfile);
        } catch (error) {
            console.error('DNA extraction failed:', error);
            setNotification({ message: 'Failed to extract DNA. Please try again.', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
            setExtractionStage('idle');
        }
    };
    
    const handleSaveDna = async () => {
        if (!detailedDna) return;
        
        setExtractionStage('saving');
        try {
            const { error } = await supabase
                .from('business_profiles')
                .update({
                    brand_dna_profile: detailedDna,
                    is_dna_approved: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profileData.business.id);
            
            if (error) throw error;
            
            onUpdate({
                ...profileData,
                business: {
                    ...profileData.business,
                    brand_dna_profile: detailedDna,
                    isDnaApproved: true
                }
            });
            
            setExtractionStage('idle');
            setIsDnaEditing(false);
            onBusinessUpdated();
            
            if (step2Completed && currentWizardStep === 2) {
                handleStepComplete();
            }
        } catch (error) {
            console.error('Error saving DNA:', error);
            setNotification({ message: 'Failed to save DNA. Please try again.', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
            setExtractionStage('reviewing');
        }
    };
    
    const handleEditDna = () => {
        setEditableBrandProfile(detailedDna);
        setIsDnaEditing(true);
    };
    
    const handleCancelDnaEdit = () => {
        setEditableBrandProfile(null);
        setIsDnaEditing(false);
    };
    
    const handleRestartExtraction = () => {
        setExtractedDna(null);
        setDetailedDna(null);
        setExtractionStage('idle');
        setOpenSections([]);
    };
    
    const toggleSection = (key: string) => {
        setOpenSections(prev => 
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };
    
    const expandAll = () => {
        if (detailedDna) {
            setOpenSections(Object.keys(detailedDna));
        }
    };
    
    const collapseAll = () => {
        setOpenSections([]);
    };
    
    // ========================================
    // HANDLERS - GBP
    // ========================================
    
    const handleGoogleBusinessChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setGoogleBusiness(prev => ({ ...prev, status: e.target.value as GbpStatus }));
        setIsDirty(true);
    };
    
    const handleGbpSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm) return;
        
        setIsSearchingGbp(true);
        setSearchError('');
        try {
            const results = await searchGoogleBusiness(searchTerm);
            setSearchResults(results);
            if (results.length === 0) {
                setSearchError('No verified profiles found. Try a different search.');
            }
        } catch (error) {
            setSearchError('Search failed. Please try again.');
        } finally {
            setIsSearchingGbp(false);
        }
    };
    
    const handleGbpSelect = (result: BusinessSearchResult) => {
        setSelectedGbp(result);
    };
    
    const handleGbpCancel = () => {
        setSelectedGbp(null);
    };
    
    const handleGbpConfirm = async () => {
        if (!selectedGbp) return;
        
        try {
            const updatedGbp = {
                profileName: selectedGbp.name,
                address: selectedGbp.address,
                rating: selectedGbp.rating,
                reviewCount: selectedGbp.reviewCount,
                mapsUrl: selectedGbp.mapsUrl,
                status: 'Verified' as GbpStatus
            };
            
            const { error } = await supabase
                .from('business_profiles')
                .update({
                    google_business_profile: updatedGbp,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profileData.business.id);
            
            if (error) throw error;
            
            setGoogleBusiness(updatedGbp);
            onUpdate({
                ...profileData,
                googleBusiness: updatedGbp
            });
            
            setSelectedGbp(null);
            setSearchResults([]);
            setSearchTerm('');
            onBusinessUpdated();
            
            if (step3Completed && currentWizardStep === 3) {
                handleStepComplete();
            }
        } catch (error) {
            console.error('Error saving GBP:', error);
            setNotification({ message: 'Failed to connect GBP. Please try again.', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
        }
    };
    
    const handleGbpDisconnect = () => {
        setGoogleBusiness({
            profileName: '',
            mapsUrl: '',
            status: 'Not Created',
            address: '',
            rating: 0,
            reviewCount: 0
        });
    };
    
    // ========================================
    // HANDLERS - Locking
    // ========================================
    
    const handleLockProfile = async () => {
        setIsLocking(true);
        try {
            const { error } = await supabase
                .from('business_profiles')
                .update({
                    is_locked: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profileData.business.id);
            
            if (error) throw error;
            
            setIsLocked(true);
            onUpdate({
                ...profileData,
                business: {
                    ...profileData.business,
                    is_locked: true
                }
            });
            onBusinessUpdated();
        } catch (error) {
            console.error('Error locking profile:', error);
            setNotification({ message: 'Failed to lock profile. Please try again.', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setIsLocking(false);
        }
    };
    
    // ========================================
    // RENDER - DNA Content
    // ========================================
    
    const renderDnaContent = () => {
        if (extractionStage === 'extracting') {
            return <DnaExtractionLoading />;
        }
        
        if (extractionStage === 'idle' && !detailedDna) {
            return (
                <div className="text-center py-8">
                    <p className="text-brand-text-muted mb-6">
                        Extract your brand's unique DNA from your website to ensure all AI-generated content matches your brand.
                    </p>
                    <button 
                        onClick={handleExtractDna}
                        className="bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                        Extract Business DNA
                    </button>
                </div>
            );
        }
        
        if (detailedDna) {
            return (
                <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-brand-text">Brand DNA Profile</h3>
                        {!isDnaEditing && (
                            <div className="flex gap-2 text-sm font-semibold">
                                <button type="button" onClick={expandAll} className="hover:underline">Expand All</button>
                                <button type="button" onClick={collapseAll} className="hover:underline">Collapse All</button>
                            </div>
                        )}
                    </div>
                    
                    <DnaDetailedAnalysis 
                        dnaProfile={isDnaEditing ? editableBrandProfile! : detailedDna}
                        onUpdate={setEditableBrandProfile!}
                        isEditable={isDnaEditing}
                        openSections={openSections}
                        toggleSection={toggleSection}
                    />
                    
                    <div className="flex justify-between items-center pt-4">
                        {isDnaEditing ? (
                            <>
                                <button type="button" onClick={handleCancelDnaEdit} className="text-sm font-semibold text-brand-text-muted hover:underline">
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setDetailedDna(editableBrandProfile);
                                        handleSaveDna();
                                    }} 
                                    className="bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold py-3 px-6 rounded-lg shadow-lg"
                                >
                                    Save & Approve DNA
                                </button>
                            </>
                        ) : (
                            <>
                                <button type="button" onClick={handleRestartExtraction} className="text-sm font-semibold text-brand-text-muted hover:underline">
                                    Re-extract from Website
                                </button>
                                {!step2Completed ? (
                                    <button type="button" onClick={handleSaveDna} className="bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold py-3 px-6 rounded-lg shadow-lg">
                                        Approve & Continue
                                    </button>
                                ) : (
                                    <button type="button" onClick={handleEditDna} className="bg-accent-blue text-white font-bold py-3 px-6 rounded-lg shadow-lg">
                                        Edit Business DNA
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            );
        }
        
        return null;
    };
    
    // ========================================
    // RENDER - GBP Content
    // ========================================
    
    const renderGbpContent = () => {
        if (step3Completed && !isGbpSkipped && googleBusiness.status === 'Verified') {
            return (
                <div>
                    <p className="text-brand-text-muted mb-4">Your Google Business Profile is connected and verified.</p>
                    <GbpDashboard gbpData={googleBusiness} onDisconnect={handleGbpDisconnect} />
                </div>
            );
        }
        
        const onUpdateStatus = (s: GbpStatus) => {
            setGoogleBusiness(prev => ({ ...prev, status: s }));
        };
        
        switch (googleBusiness.status) {
            case 'Not Created':
                return <GbpNotCreatedGuide business={business} onUpdateStatus={onUpdateStatus} onSkip={() => {
                    setIsGbpSkipped(true);
                    if (currentWizardStep === 3) handleStepComplete();
                }} />;
            case 'Not Verified':
                return <GbpNotVerifiedGuide onUpdateStatus={onUpdateStatus} />;
            case 'Verified':
                return <GbpConnect 
                    profileData={profileData}
                    onSearch={handleGbpSearch}
                    searchResults={searchResults}
                    loading={isSearchingGbp}
                    error={searchError}
                    onSelect={handleGbpSelect}
                    selected={selectedGbp}
                    onConfirm={handleGbpConfirm}
                    onCancel={handleGbpCancel}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />;
            default:
                return <p className="text-brand-text-muted">Select a status to continue.</p>;
        }
    };
    
    // ========================================
    // RENDER - Current Step
    // ========================================
    
    const renderCurrentStep = () => {
        const guidance = getAIGuidance();
        
        if (showCelebration) {
            const stepNames = ["Business Information", "Business DNA", "Google Business Profile", "Social Accounts"];
            const nextStepNames = ["Business DNA", "Google Business Profile", "Social Accounts", "Lock Profile"];
            return (
                <StepCompletionCelebration 
                    stepName={stepNames[currentWizardStep - 1]}
                    onNext={() => setShowCelebration(false)}
                    nextStepName={currentWizardStep < 4 ? nextStepNames[currentWizardStep - 1] : undefined}
                />
            );
        }
        
        return (
            <>
                <AIGuidanceMessage message={guidance.message} emoji={guidance.emoji} />
                
                {/* STEP 1: BUSINESS INFORMATION */}
                {currentWizardStep === 1 && (
                    <WizardStepContainer title="Business Information" icon="🏢">
                        <p className="text-brand-text-muted mb-6">This information powers all JetSuite tools.</p>
                        {saveSuccess && <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4 text-sm font-semibold">{saveSuccess}</div>}
                        
                        <form onSubmit={handleSaveInfo} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-brand-text mb-1">
                                        Business Name <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        name="business_name" 
                                        value={business.business_name} 
                                        onChange={handleBusinessChange} 
                                        className="w-full bg-brand-light border border-brand-border rounded-lg p-2" 
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brand-text mb-1">
                                        Website URL <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="url" 
                                        name="business_website" 
                                        value={business.business_website} 
                                        onChange={handleBusinessChange} 
                                        placeholder="https://..." 
                                        className="w-full bg-brand-light border border-brand-border rounded-lg p-2" 
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1">Business Description</label>
                                <div className="flex items-center gap-2 mb-2">
                                    <button 
                                        type="button" 
                                        onClick={handleGenerateDescription} 
                                        disabled={isGeneratingDescription} 
                                        className="flex items-center gap-1 text-xs font-semibold bg-accent-purple/10 text-accent-purple px-2 py-1 rounded-md hover:bg-accent-purple/20"
                                    >
                                        {isGeneratingDescription ? (
                                            <><Loader /> Generating...</>
                                        ) : (
                                            <><SparklesIcon className="w-3 h-3"/> Generate with AI</>
                                        )}
                                    </button>
                                </div>
                                <textarea 
                                    name="business_description" 
                                    value={business.business_description} 
                                    onChange={handleBusinessChange} 
                                    rows={3} 
                                    maxLength={500} 
                                    className="w-full bg-brand-light border border-brand-border rounded-lg p-2"
                                />
                                <p className="text-right text-xs text-brand-text-muted">{business.business_description?.length || 0} / 500</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1">Business Category</label>
                                <input 
                                    list="business-categories" 
                                    name="industry" 
                                    value={business.industry} 
                                    onChange={handleBusinessChange} 
                                    className="w-full bg-brand-light border border-brand-border rounded-lg p-2" 
                                    required
                                />
                                <datalist id="business-categories">
                                    {BUSINESS_CATEGORIES.map(cat => <option key={cat} value={cat} />)}
                                </datalist>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-2">Business Location Type</label>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    {(['physical', 'online', 'home'] as const).map((type) => (
                                        <button 
                                            key={type} 
                                            type="button" 
                                            onClick={() => setLocationType(type)} 
                                            className={`p-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                                                locationType === type 
                                                    ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' 
                                                    : 'border-brand-border text-brand-text-muted hover:border-accent-blue/50'
                                            }`}
                                        >
                                            {type === 'physical' ? '🏢 Physical' : type === 'online' ? '🌐 Online' : '🏠 Home-Based'}
                                        </button>
                                    ))}
                                </div>
                                {locationType === 'physical' && (
                                    <div>
                                        <label className="block text-sm font-medium text-brand-text mb-1">
                                            Primary Location (City, State) <span className="text-red-500">*</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            name="location" 
                                            value={business.location || ''} 
                                            onChange={handleBusinessChange} 
                                            placeholder="e.g., Loganville, Georgia" 
                                            className="w-full bg-brand-light border border-brand-border rounded-lg p-2" 
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end pt-6">
                                <button 
                                    type="submit" 
                                    disabled={isSavingInfo} 
                                    className="bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                                >
                                    {isSavingInfo ? 'Saving...' : 'Save & Continue'} <ArrowRightIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </WizardStepContainer>
                )}
                
                {/* STEP 2: BUSINESS DNA */}
                {currentWizardStep === 2 && (
                    <WizardStepContainer title="Business DNA" icon="🧬">
                        {renderDnaContent()}
                    </WizardStepContainer>
                )}
                
                {/* STEP 3: GOOGLE BUSINESS PROFILE */}
                {currentWizardStep === 3 && (
                    <WizardStepContainer title="Google Business Profile" icon="🗺️">
                        {locationType !== 'physical' && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-yellow-800 font-semibold">
                                    ℹ️ Google Business Profile is primarily for businesses with physical locations.
                                </p>
                            </div>
                        )}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-brand-text mb-2">
                                What is the status of your Google Business Profile?
                            </label>
                            <div className="flex gap-2 mb-4">
                                <select 
                                    name="status" 
                                    value={googleBusiness.status} 
                                    onChange={handleGoogleBusinessChange} 
                                    className="flex-1 bg-brand-light border rounded-lg p-3"
                                >
                                    <option value="Not Created">I don't have a profile yet</option>
                                    <option value="Not Verified">I have a profile, but it's not verified</option>
                                    <option value="Verified">My profile is verified</option>
                                </select>
                                <button 
                                    type="button"
                                    onClick={() => handleSaveInfo()}
                                    disabled={isSavingInfo}
                                    className="bg-accent-blue text-white px-4 rounded-lg font-bold hover:bg-opacity-90 disabled:opacity-50"
                                >
                                    {isSavingInfo ? '...' : 'Save'}
                                </button>
                            </div>
                            {renderGbpContent()}
                        </div>
                    </WizardStepContainer>
                )}
                
                {/* STEP 4: SOCIAL ACCOUNTS */}
                {currentWizardStep === 4 && (
                    <WizardStepContainer title="Connect Social Accounts" icon="📱">
                        <p className="text-brand-text-muted mb-6">
                            Link your social accounts to schedule posts, auto-reply to messages, and manage your social presence from one place. This step is optional but highly recommended.
                        </p>
                        <SocialAccountsStep 
                            userId={profileData.user.id} 
                            onContinue={() => handleStepComplete()} 
                            onSkip={() => handleStepComplete()} 
                        />
                    </WizardStepContainer>
                )}
                
                {/* STEP 5: LOCK PROFILE */}
                {currentWizardStep === 5 && (
                    <div className="bg-brand-card p-8 rounded-xl shadow-lg border-2 border-dashed border-green-400 text-center">
                        <CheckCircleIcon className="w-16 h-16 mx-auto text-green-500 mb-4" />
                        <h2 className="text-3xl font-bold text-brand-text mb-2">🎉 Profile Ready to Lock!</h2>
                        <p className="text-brand-text-muted my-4 max-w-md mx-auto">
                            All foundational steps are complete. Locking this profile is crucial to ensure consistency across all AI tools.
                        </p>
                        
                        {isDirty ? (
                            <div className="space-y-4 max-w-xs mx-auto">
                                <p className="text-sm text-red-500 font-semibold">You have unsaved changes. Please save before locking.</p>
                                <button 
                                    onClick={handleSaveInfo}
                                    disabled={isSavingInfo}
                                    className="w-full bg-accent-blue text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
                                >
                                    {isSavingInfo ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={handleLockProfile}
                                disabled={isLocking}
                                className="bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold py-4 px-10 rounded-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                            >
                                {isLocking ? 'Locking Profile...' : '🔒 Lock Profile & Continue'}
                            </button>
                        )}
                    </div>
                )}
                
                {/* STEP 6: FINAL REDIRECT */}
                {currentWizardStep === 6 && (
                    <div className="text-center py-16">
                        <div className="text-8xl mb-6 animate-bounce">🎉</div>
                        <h2 className="text-4xl font-extrabold text-brand-text mb-4">Setup Complete!</h2>
                        <p className="text-xl text-brand-text-muted mb-8">Redirecting you to your Command Center...</p>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple mx-auto"></div>
                    </div>
                )}
            </>
        );
    };
    
    // ========================================
    // MAIN RENDER
    // ========================================
    
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {notification && (
                <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-xl flex items-center gap-3 transition-all duration-300 ${
                    notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                }`}>
                    <InfoIcon className="w-6 h-6" />
                    <p className="font-semibold">{notification.message}</p>
                    <button type="button" onClick={() => setNotification(null)}>
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
            )}
            
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-brand-text mb-2">Welcome to JetSuite</h1>
                <p className="text-lg text-brand-text-muted">Let's get your business profile set up in 4 easy steps</p>
            </div>
            
            {currentWizardStep <= 4 && <WizardProgress currentStep={currentWizardStep} totalSteps={4} />}
            
            {renderCurrentStep()}
        </div>
    );
};