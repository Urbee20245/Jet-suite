business_name, websiteUrl -> business_website).">
import React, { useState, useEffect, useRef } from 'react';
import type { Tool, ProfileData, BusinessDna, GbpStatus, BrandDnaProfile, BusinessSearchResult } from '../../types';
import { extractWebsiteDna, extractBrandDnaProfile, searchGoogleBusiness, generateBusinessDescription, detectGbpOnWebsite } from '../../services/geminiService';
import { CheckCircleIcon, XMarkIcon, ChevronDownIcon, MapPinIcon, StarIcon, SparklesIcon, ArrowRightIcon, ChevronUpIcon, InformationCircleIcon as InfoIcon } from '../../components/icons/MiniIcons';
import { Loader } from '../../components/Loader';
import { SocialAccountsStep } from '../../components/SocialAccountsStep';
import { ALL_TOOLS } from '../../constants';
import { getSupabaseClient } from '../../integrations/supabase/client'; // Import centralized client function

// --- Types ---
interface BusinessDetailsProps { 
    profileData: ProfileData; 
    onUpdate: (data: ProfileData) => void; 
    setActiveTool: (tool: Tool | null) => void; 
    onBusinessUpdated: () => void; // NEW PROP
}
type ExtractionStage = 'idle' | 'extracting' | 'reviewing' | 'saving';

// --- Helper Functions ---
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => resolve(reader.result as string); reader.onerror = error => reject(error); });
const isBase64 = (str: string) => str.startsWith('data:image');
const imageURLToBase64 = async (url: string): Promise<string> => { if (!url || isBase64(url)) return url; try { const response = await fetch(url); if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`); const blob = await response.blob(); return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onloadend = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(blob); }); } catch (error) { console.error("CORS error fetching image:", error); return ""; } };

// --- Sub-components for DNA Workflow ---

const DnaExtractionLoading: React.FC = () => {
    const steps = ["Connecting to website...", "Scanning for logo...", "Extracting brand colors...", "Detecting fonts...", "Analyzing brand style...", "Searching for Google Business Profile...", "Compiling results..."];
    const [currentStep, setCurrentStep] = useState(0);
    useEffect(() => { const interval = setInterval(() => { setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev)); }, 2000); return () => clearInterval(interval); }, []);
    return (<div className="text-center p-8 bg-brand-light rounded-xl border-2 border-dashed border-brand-border"><h3 className="text-xl font-bold text-brand-text">Analyzing Your Website...</h3><p className="text-brand-text-muted my-2">This usually takes 2-5 minutes.</p><div className="w-full max-w-xs mx-auto my-6"><div className="relative pt-1"><div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-accent-purple/20"><div style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-accent-purple transition-all duration-500"></div></div></div><ul className="text-left text-sm text-brand-text-muted space-y-2">{steps.map((step, index) => (<li key={step} className={`flex items-center transition-opacity duration-300 ${index <= currentStep ? 'opacity-100' : 'opacity-40'}`}>{index < currentStep ? <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" /> : <div className="w-4 h-4 mr-2"><Loader /></div>}{step}</li>))}</ul></div><p className="text-xs text-brand-text-muted">Please don't close this page.</p></div>);
};

const DnaDetailedAnalysis: React.FC<{ dnaProfile: BrandDnaProfile, onUpdate: (newProfile: BrandDnaProfile) => void, isEditable: boolean, openSections: string[], toggleSection: (key: string) => void }> = ({ dnaProfile, onUpdate, isEditable, openSections, toggleSection }) => {
    const handleFieldChange = (section: keyof BrandDnaProfile, field: any, value: any) => { onUpdate({ ...dnaProfile, [section]: { ...dnaProfile[section], [field]: value } }); };
    return (<div className="space-y-3">{Object.entries(dnaProfile).map(([sectionKey, sectionValue]) => (<div key={sectionKey} className="border border-brand-border rounded-lg overflow-hidden bg-white"><button onClick={() => toggleSection(sectionKey)} className="w-full flex justify-between items-center p-3 bg-brand-light hover:bg-brand-border transition-colors"><h4 className="font-semibold text-brand-text capitalize">{sectionKey.replace(/_/g, ' ')}</h4><ChevronDownIcon className={`w-5 h-5 text-brand-text-muted transition-transform ${openSections.includes(sectionKey) ? 'rotate-180' : ''}`} /></button>{openSections.includes(sectionKey) && (<div className="p-4 space-y-4">{Object.entries(sectionValue).map(([fieldKey, fieldValue]) => (<div key={fieldKey}><label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">{fieldKey.replace(/_/g, ' ')}</label><textarea value={Array.isArray(fieldValue) ? fieldValue.join(', ') : String(fieldValue)} onChange={e => handleFieldChange(sectionKey as keyof BrandDnaProfile, fieldKey, Array.isArray(fieldValue) ? e.target.value.split(',').map(s => s.trim()) : e.target.value)} disabled={!isEditable} rows={Array.isArray(fieldValue) ? 1 : String(fieldValue).length > 80 ? 3 : 1} className="mt-1 w-full bg-white border border-brand-border rounded-md p-2 text-sm disabled:bg-brand-light disabled:opacity-80 resize-none"/></div>))}</div>)}</div>))}</div>);
};

const DnaReviewAndSaved: React.FC<{ visualDna: BusinessDna; detailedDna: BrandDnaProfile; isEditable: boolean; onVisualDnaChange: (newDna: BusinessDna) => void; onDetailedDnaChange: (newProfile: BrandDnaProfile) => void; onSave: () => void; onCancel?: () => void; onRestart: () => void; onEdit: () => void; dnaLastUpdatedAt?: string; detectedGbp: BusinessSearchResult | null; isGbpConfirmed: boolean; onConfirmGbp: () => void; onRejectGbp: () => void; }> = ({ visualDna, detailedDna, isEditable, onVisualDnaChange, onDetailedDnaChange, onSave, onCancel, onRestart, onEdit, dnaLastUpdatedAt, detectedGbp, isGbpConfirmed, onConfirmGbp, onRejectGbp }) => {
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) { onVisualDnaChange({ ...visualDna, logo: await toBase64(e.target.files[0]) }); } };
    const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) { onVisualDnaChange({ ...visualDna, faviconUrl: await toBase64(e.target.files[0]) }); } };
    const handleColorChange = (index: number, newColor: string) => { const newColors = [...visualDna.colors]; newColors[index] = newColor; onVisualDnaChange({ ...visualDna, colors: newColors }); };
    const removeColor = (index: number) => { onVisualDnaChange({ ...visualDna, colors: visualDna.colors.filter((_, i) => i !== index) }); }
    const addColor = () => { onVisualDnaChange({ ...visualDna, colors: [...visualDna.colors, '#ffffff'] }); }
    
    const sectionKeys = detailedDna ? Object.keys(detailedDna) : [];
    const [openSections, setOpenSections] = useState<string[]>(['brand_tone', 'visual_identity']);
    const toggleSection = (key: string) => setOpenSections(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);
    const expandAll = () => setOpenSections(sectionKeys);
    const collapseAll = () => setOpenSections([]);

    return (<div className="space-y-6"><div><h3 className="text-xl font-bold text-brand-text">{isEditable ? 'Your Business DNA - Review & Approve' : 'Your Approved Business DNA'}</h3><p className="text-brand-text-muted">{isEditable ? 'We extracted the following from your website. Review and make any changes before saving.' : 'This brand identity is active across all JetSuite tools.'}</p>{!isEditable && dnaLastUpdatedAt && <p className="text-xs text-brand-text-muted mt-1">Last saved: {new Date(dnaLastUpdatedAt).toLocaleString()}</p>}</div><div className="grid grid-cols-1 lg:grid-cols-5 gap-4"><div className="lg:col-span-2 bg-white p-4 rounded-lg border border-brand-border"><h4 className="font-semibold mb-2 flex items-center gap-2">Logo {visualDna.logo && <CheckCircleIcon className="w-4 h-4 text-green-500" />}</h4>{!visualDna.logo ? <div className="text-center p-4 border-2 border-dashed rounded-lg"><p className="text-sm text-brand-text-muted mb-2">No logo detected.</p>{isEditable && <button onClick={() => logoInputRef.current?.click()} className="text-sm font-semibold text-accent-blue hover:underline">Upload manually</button>}</div> : <div className="space-y-2"><p className="text-xs text-brand-text-muted">Preview:</p><div className="flex gap-2"><div className="flex-1 bg-gray-100 p-2 rounded"><img src={visualDna.logo} className="h-24 mx-auto object-contain"/></div><div className="flex-1 bg-brand-dark p-2 rounded"><img src={visualDna.logo} className="h-24 mx-auto object-contain"/></div></div>{isEditable &&<button onClick={() => logoInputRef.current?.click()} className="text-sm font-semibold text-accent-blue hover:underline mt-2">Upload different logo</button>}</div>}<input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" /></div><div className="lg:col-span-3 bg-white p-4 rounded-lg border border-brand-border"><div className="pb-4 border-b border-brand-border"><h4 className="font-semibold mb-2">Typography</h4><div className="flex items-center justify-between"><div className="w-1/2"><div style={{fontFamily: visualDna.fonts}} className="text-4xl truncate">{visualDna.fonts ? 'Aa' : ''}</div><p className="text-sm font-semibold mt-1 truncate">{visualDna.fonts || 'Default'}</p></div>{isEditable && <input type="text" value={visualDna.fonts} onChange={e => onVisualDnaChange({...visualDna, fonts: e.target.value})} className="w-1/2 text-sm p-2 border rounded"/>}</div></div><div className="pt-4"><h4 className="font-semibold mb-2">Brand Colors</h4><div className="flex flex-wrap gap-3 items-center">{visualDna.colors.map((color, i) => <div key={i} className="relative group text-center">{isEditable ? <input type="color" value={color} onChange={e => handleColorChange(i, e.target.value)} className="w-12 h-12 rounded-full border-2 border-white shadow-md cursor-pointer" /> : <div style={{backgroundColor: color}} className="w-12 h-12 rounded-full border-2 border-white shadow-md"></div>}<p className="text-xs font-mono mt-1">{color}</p>{isEditable &&<button onClick={() => removeColor(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100"><XMarkIcon className="w-3 h-3"/></button>}</div>)}{isEditable &&<button onClick={addColor} className="w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center text-2xl text-brand-text-muted hover:bg-gray-200">+</button>}</div></div><div className="pt-4 border-t border-brand-border mt-4"><h4 className="font-semibold mb-2">Favicon</h4>{visualDna.faviconUrl ? <div className="flex items-center gap-3"><img src={visualDna.faviconUrl} alt="Favicon" className="w-8 h-8"/><p className="text-sm text-brand-text-muted truncate">{visualDna.faviconUrl}</p>{isEditable && <button onClick={() => faviconInputRef.current?.click()} className="text-sm font-semibold text-accent-blue hover:underline ml-auto">Change</button>}</div> : <div className="text-center p-2"><p className="text-sm text-brand-text-muted mb-2">No favicon detected.</p>{isEditable && <button onClick={() => faviconInputRef.current?.click()} className="text-sm font-semibold text-accent-blue hover:underline">Upload favicon</button>}</div>}<input type="file" ref={faviconInputRef} onChange={handleFaviconUpload} accept="image/png, image/x-icon, image/svg+xml" className="hidden" /></div></div></div>{isEditable && detectedGbp && <GbpDetectedCard detectedGbp={detectedGbp} isConfirmed={isGbpConfirmed} onConfirm={onConfirmGbp} onReject={onRejectGbp} />}<div><div className="flex justify-between items-center mb-2"><h3 className="text-lg font-bold text-brand-text">Extracted Brand DNA Profile</h3>{!isEditable && <div className="flex gap-2 text-sm font-semibold"><button onClick={expandAll} className="hover:underline">Expand All</button><button onClick={collapseAll} className="hover:underline">Collapse All</button></div>}</div>{detailedDna && <DnaDetailedAnalysis dnaProfile={detailedDna} onUpdate={onDetailedDnaChange} isEditable={isEditable} openSections={openSections} toggleSection={toggleSection} />}</div><div className="flex justify-between items-center pt-4">{isEditable ? <><button onClick={onCancel} className="text-sm font-semibold text-brand-text-muted hover:underline">Cancel</button><button onClick={onSave} className="bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold py-3 px-6 rounded-lg shadow-lg">Save Changes</button></> : <><button onClick={onRestart} className="text-sm font-semibold text-brand-text-muted hover:underline">Re-extract from Website</button><button onClick={onEdit} className="bg-accent-blue text-white font-bold py-3 px-6 rounded-lg shadow-lg">Edit Business DNA</button></>}</div></div>);
};

// --- Sub-components for GBP Workflow ---
const GbpDetectedCard: React.FC<{ detectedGbp: BusinessSearchResult; isConfirmed: boolean; onConfirm: () => void; onReject: () => void; }> = ({ detectedGbp, isConfirmed, onConfirm, onReject }) => (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4 rounded-r-lg mb-4">
        <div className="flex items-start justify-between">
            <div className="flex items-start">
                <InfoIcon className="w-6 h-6 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="font-bold">Google Business Profile Detected</p>
                    <p className="text-sm">We found a potential match for your business during DNA extraction:</p>
                    <div className="mt-2 bg-white p-3 rounded-lg border border-yellow-200">
                        <p className="font-semibold text-brand-text">{detectedGbp.name}</p>
                        <p className="text-xs text-brand-text-muted">{detectedGbp.address}</p>
                        <p className="text-xs text-brand-text-muted flex items-center gap-1 mt-1">
                            <StarIcon className="w-3 h-3 text-yellow-400" /> {detectedGbp.rating} ({detectedGbp.reviewCount} reviews)
                        </p>
                    </div>
                </div>
            </div>
            <button onClick={onReject} className="text-sm font-semibold text-red-500 hover:underline">Ignore</button>
        </div>
        <div className="mt-4 flex justify-end gap-3">
            <button onClick={onConfirm} className={`text-sm font-bold py-2 px-4 rounded-lg transition-colors ${isConfirmed ? 'bg-green-500 text-white' : 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'}`}>
                {isConfirmed ? '✓ Confirmed' : 'Confirm & Connect'}
            </button>
        </div>
    </div>
);
const GbpDashboard: React.FC<{ gbpData: ProfileData['googleBusiness'], onDisconnect: () => void }> = ({ gbpData, onDisconnect }) => ( <div className="bg-brand-light p-6 rounded-lg border border-brand-border space-y-4"> <div><p className="font-bold text-brand-text">{gbpData.profileName}</p><p className="text-sm text-brand-text-muted">{gbpData.address}</p></div> <div className="grid grid-cols-2 gap-4 text-center"><div className="bg-white p-3 rounded-lg border"><p className="font-bold text-xl flex items-center justify-center gap-1"><StarIcon className="w-5 h-5 text-yellow-400"/> {gbpData.rating}</p><p className="text-xs text-brand-text-muted">Rating</p></div><div className="bg-white p-3 rounded-lg border"><p className="font-bold text-xl">{gbpData.reviewCount}</p><p className="text-xs text-brand-text-muted">Total Reviews</p></div></div> <div className="flex gap-4 pt-2"><a href={gbpData.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-accent-blue hover:underline">View on Maps</a><button onClick={onDisconnect} className="text-sm font-semibold text-red-500 hover:underline ml-auto">Disconnect</button></div> </div> );
const GbpNotCreatedGuide: React.FC<{ business: ProfileData['business'], onUpdateStatus: (status: GbpStatus) => void, onSkip: () => void }> = ({ business, onUpdateStatus, onSkip }) => ( <div className="bg-brand-light p-6 rounded-lg border border-brand-border space-y-4"> <h4 className="font-bold text-brand-text">Create Your Google Business Profile</h4> <p className="text-sm text-brand-text-muted">A Google Business Profile is essential for local search. Follow these steps:</p> <ol className="space-y-3 text-sm"> <li><span className="font-bold">1. Go to Google:</span> Click below to open Google Business Profile.<br/><a href="https://business.google.com/create" target="_blank" rel="noopener noreferrer" className="inline-block mt-1 bg-blue-500 text-white font-semibold py-1 px-3 rounded-md text-xs hover:bg-blue-600">Open Google</a></li> <li><span className="font-bold">2. Enter Info:</span> Use your business name ({business.business_name}), category, etc.</li> <li><span className="font-bold">3. Verify:</span> Google will send a postcard or call. This can take 5-14 days.</li> </ol> <div className="flex justify-between items-center pt-2"> <button onClick={onSkip} className="text-sm font-semibold text-brand-text-muted hover:underline">Skip for now</button> <button onClick={() => onUpdateStatus('Not Verified')} className="text-sm font-semibold text-accent-blue hover:underline">I've created my profile &rarr;</button> </div> </div> );
const GbpNotVerifiedGuide: React.FC<{ onUpdateStatus: (status: GbpStatus) => void }> = ({ onUpdateStatus }) => ( <div className="bg-brand-light p-6 rounded-lg border border-brand-border space-y-4"> <h4 className="font-bold text-brand-text">Verify Your Google Business Profile</h4> <p className="text-sm text-brand-text-muted">Your profile won't appear in search results until verified.</p> <ol className="space-y-3 text-sm"> <li><span className="font-bold">1. Go to your Dashboard:</span> Click to open your profile.<br/><a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="inline-block mt-1 bg-blue-500 text-white font-semibold py-1 px-3 rounded-md text-xs hover:bg-blue-600">Open My Profile</a></li> <li><span className="font-bold">2. Find Prompt:</span> Look for the 'Get verified' or 'Verify now' prompt.</li> <li><span className="font-bold">3. Enter Code:</span> Enter the verification code when it arrives by mail.</li> </ol> <button onClick={() => onUpdateStatus('Verified')} className="text-sm font-semibold text-accent-blue hover:underline">I've verified my profile! &rarr;</button> </div> );
const GbpConnect: React.FC<{ profileData: ProfileData, onConnect: (gbp: Partial<ProfileData['googleBusiness']>) => void }> = ({ profileData, onConnect }) => { const [searchTerm, setSearchTerm] = useState(''); const [results, setResults] = useState<BusinessSearchResult[]>([]); const [selected, setSelected] = useState<BusinessSearchResult | null>(null); const [loading, setLoading] = useState(false); const handleSearch = async (e: React.FormEvent) => { e.preventDefault(); if (!searchTerm) return; setLoading(true); setResults([]); setSelected(null); const res = await searchGoogleBusiness(searchTerm); setResults(res); setLoading(false); }; if (selected) return ( <div className="bg-brand-light p-6 rounded-lg border text-center"><h4 className="font-bold">Is this your business?</h4><div className="bg-white my-4 p-4 rounded-lg border"><p className="font-bold">{selected.name}</p><p className="text-sm text-brand-text-muted">{selected.address}</p></div><div className="flex gap-4 justify-center"><button onClick={() => setSelected(null)} className="text-sm font-semibold">No, search again</button><button onClick={() => onConnect({ profileName: selected.name, address: selected.address, rating: selected.rating, reviewCount: selected.reviewCount })} className="bg-accent-blue text-white font-bold py-2 px-4 rounded-lg">Yes, connect</button></div></div> ); return ( <div className="bg-brand-light p-6 rounded-lg border space-y-4"> <h4 className="font-bold text-brand-text">Connect Your Google Business Profile</h4> <form onSubmit={handleSearch} className="space-y-4"> <div><label className="text-xs font-semibold">1. Paste Google Share or Maps URL</label><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="https://share.google/... or https://maps.app.goo.gl/..." className="w-full bg-white border-brand-border rounded-lg p-2 text-sm mt-1" /></div> <div className="text-center text-xs font-semibold">OR</div> <div><label className="text-xs font-semibold">2. Search by Name & Location</label><input type="text" onChange={e => setSearchTerm(e.target.value)} placeholder={`${profileData.business.business_name}, ${profileData.business.location}`} className="w-full bg-white border-brand-border rounded-lg p-2 text-sm mt-1" /></div> <button type="submit" disabled={loading || !searchTerm} className="w-full bg-accent-blue text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">{loading ? '...' : 'Find & Connect'}</button> {loading && <Loader />} <div className="space-y-2 mt-4">{results.map(r => <button key={r.name+r.address} onClick={() => setSelected(r)} className="w-full text-left p-3 bg-white hover:bg-gray-50 rounded-lg border"><p className="font-semibold">{r.name}</p><p className="text-xs text-brand-text-muted">{r.address}</p></button>)}</div> </form> </div> ); };
const CompletionCard: React.FC<{ onNext: () => void }> = ({ onNext }) => ( <div className="bg-brand-card p-8 rounded-xl shadow-lg border-2 border-dashed border-green-400 mt-8 text-center glow-card glow-card-rounded-xl"> <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500" /> <h2 className="text-2xl font-bold text-brand-text mt-4">🎉 Business Profile Complete!</h2> <p className="text-brand-text-muted my-4 max-w-md mx-auto">Great work! Your business identity is set up. Now let's analyze your local presence and find growth opportunities.</p> <button onClick={onNext} className="bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-3 px-8 rounded-lg transition-opacity duration-300 text-lg shadow-lg shadow-accent-purple/20 flex items-center gap-2 mx-auto">Continue to JetBiz <ArrowRightIcon className="w-5 h-5" /></button> <button className="text-sm text-brand-text-muted hover:underline mt-4">Stay here and review my details</button> </div> );

const StepCard: React.FC<{ number: number; title: string; badge: string; badgeColor: string; isComplete: boolean; isLocked?: boolean; children: React.ReactNode; defaultOpen: boolean; onLockedClick: (step: number) => void; }> = ({ number, title, badge, badgeColor, isComplete, isLocked = false, children, defaultOpen, onLockedClick }) => { 
    const statusBorderColor = isLocked ? 'border-gray-300' : isComplete ? 'border-green-400' : 'border-blue-400'; 
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const handleClick = () => {
        if (isLocked) {
            onLockedClick(number);
        } else {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div className={`bg-brand-card rounded-xl shadow-lg border-l-4 ${statusBorderColor} transition-all duration-300 ${isLocked ? 'opacity-60' : ''}`}>
            <button onClick={handleClick} className="w-full flex items-center justify-between p-6 sm:p-8 text-left">
                <div className="flex items-center gap-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${isLocked ? 'bg-gray-400' : isComplete ? 'bg-green-500' : 'bg-blue-500'}`}>
                        {isComplete ? <CheckCircleIcon className="w-5 h-5" /> : number}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-brand-text flex items-center gap-3">
                            {number}. {title} 
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                        </h2>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isComplete && <CheckCircleIcon className="w-6 h-6 text-green-500"/>}
                    {isOpen ? <ChevronUpIcon className="w-5 h-5 text-brand-text-muted" /> : <ChevronDownIcon className="w-5 h-5 text-brand-text-muted" />}
                </div>
            </button>
            
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-6 sm:p-8 pt-0">
                    <div className={isLocked ? 'pointer-events-none' : ''}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};
const ProgressBar: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => (<div className="w-full mb-8"><div className="flex justify-between items-center text-sm font-semibold text-brand-text-muted mb-1"><span>Profile Setup {currentStep === totalSteps && 'Complete!'}</span><span>Step {currentStep} of {totalSteps}</span></div><div className="w-full bg-brand-light rounded-full h-2.5"><div className="bg-gradient-to-r from-accent-blue to-accent-purple h-2.5 rounded-full transition-all duration-500" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div></div></div>);

// --- Main Component ---
const BUSINESS_CATEGORIES = [ "Accounting", "Advertising Agency", "Attorney / Law Firm", "Auto Repair", "Bakery", "Bank", "Beauty Salon", "Car Dealer", "Chiropractor", "Church", "Cleaning Service", "Construction Company", "Consultant", "Contractor", "Dentist", "Doctor", "Electrician", "Event Planner", "Financial Services", "Fitness Center", "Florist", "HVAC Contractor", "Insurance Agency", "Insurance & Financial Services", "Interior Designer", "Landscaper", "Lawyer", "Marketing Agency", "Medical Practice", "Moving Company", "Painter", "Photographer", "Plumber", "Real Estate Agency", "Restaurant", "Retail Store", "Roofing Contractor", "Salon / Spa", "Software Company", "Tax Preparation", "Veterinarian", "Web Design" ];

export const BusinessDetails: React.FC<BusinessDetailsProps> = ({ profileData, onUpdate, setActiveTool, onBusinessUpdated }) => {
  const [business, setBusiness] = useState(profileData.business);
  const [googleBusiness, setGoogleBusiness] = useState(profileData.googleBusiness);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [extractionStage, setExtractionStage] = useState<ExtractionStage>('idle');
  const [editableDna, setEditableDna] = useState<BusinessDna | null>(null);
  const [editableBrandProfile, setEditableBrandProfile] = useState<BrandDnaProfile | null>(null);
  const [analysisError, setAnalysisError] = useState('');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [isGbpSkipped, setIsGbpSkipped] = useState(false);
  const [isDnaEditing, setIsDnaEditing] = useState(false);
  const [detectedGbp, setDetectedGbp] = useState<BusinessSearchResult | null>(null);
  const [isGbpConfirmed, setIsGbpConfirmed] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
  
  // Get userId from localStorage
  const [userId, setUserId] = useState<string>('');
  
  useEffect(() => {
    const storedUserId = localStorage.getItem('jetsuite_userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);
  
  useEffect(() => { setBusiness(profileData.business); setGoogleBusiness(profileData.googleBusiness); }, [profileData]);
  useEffect(() => { setIsDirty(JSON.stringify(profileData.business) !== JSON.stringify(business) || JSON.stringify(profileData.googleBusiness) !== JSON.stringify(googleBusiness)); }, [business, googleBusiness, profileData]);

  const step1Completed = !!business.business_name && !!business.business_website;
  const step2Completed = business.isDnaApproved;
  const step3Completed = (googleBusiness.status === 'Verified' && !!googleBusiness.placeId) || isGbpSkipped; // GBP is now step 3
  const step4Completed = true; // Social Accounts is now step 4 (optional, always considered complete)
  const allStepsComplete = step1Completed && step2Completed && step3Completed && step4Completed;
  const currentStep = (step1Completed ? 1 : 0) + (step2Completed ? 1 : 0) + (step3Completed ? 1 : 0) + (step4Completed ? 1 : 0);
  
  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setBusiness(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleGoogleBusinessChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const newStatus = e.target.value as GbpStatus; setIsGbpSkipped(false); setGoogleBusiness(prev => ({...prev, status: newStatus}));};
  
  const handleAnalyzeDna = async () => { if (!step1Completed) return; setAnalysisError(''); setExtractionStage('extracting'); setDetectedGbp(null); setIsGbpConfirmed(false); try { const [websiteDnaResult, brandDnaProfileResult, gbpResult] = await Promise.all([extractWebsiteDna(business.business_website), extractBrandDnaProfile(business), detectGbpOnWebsite(business.business_website, business.business_name)]); const { logoUrl, faviconUrl, ...extracted } = websiteDnaResult; const logoBase64 = logoUrl ? await imageURLToBase64(logoUrl) : ''; setEditableDna({ ...extracted, logo: logoBase64, faviconUrl }); setEditableBrandProfile(brandDnaProfileResult); setSuggestedCategory(brandDnaProfileResult.industry_context.category_confirmation); if (gbpResult) { setDetectedGbp(gbpResult); } setExtractionStage('reviewing'); } catch (e) { console.error("Analysis failed:", e); setAnalysisError('Extraction failed. One or more analyses could not be completed. Check your API key or try again.'); setExtractionStage('idle'); } };
  const handleInitialSaveDna = () => { if (!editableDna || !editableBrandProfile) return; setExtractionStage('saving'); let newGbpData = profileData.googleBusiness; if (detectedGbp && isGbpConfirmed) { newGbpData = { ...profileData.googleBusiness, profileName: detectedGbp.name, address: detectedGbp.address, rating: detectedGbp.rating, reviewCount: detectedGbp.reviewCount, status: 'Verified' as GbpStatus, placeId: `detected_${Date.now()}` }; } setTimeout(() => { const updatedBusiness = { ...business, dna: editableDna, isDnaApproved: true, dnaLastUpdatedAt: new Date().toISOString() }; onUpdate({ ...profileData, business: updatedBusiness, brandDnaProfile: editableBrandProfile, googleBusiness: newGbpData }); setExtractionStage('idle'); setDetectedGbp(null); setIsGbpConfirmed(false); }, 1000); };
  const handleUpdateDna = () => { if (!editableDna || !editableBrandProfile) return; const updatedBusiness = { ...business, dna: editableDna, isDnaApproved: true, dnaLastUpdatedAt: new Date().toISOString() }; onUpdate({ ...profileData, business: updatedBusiness, brandDnaProfile: editableBrandProfile }); setIsDnaEditing(false); };

  const handleSaveInfo = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    
    try {
        // Sync to Database via API route
        const locationParts = business.location.split(',').map(s => s.trim());
        const city = locationParts[0] || '';
        const state = locationParts[1] || '';

        const response = await fetch('/api/business/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: profileData.user.id,
                businessName: business.business_name,
                websiteUrl: business.business_website,
                industry: business.industry,
                city: city,
                state: state,
                isPrimary: true,
                isComplete: true,
                businessDescription: business.business_description, // Pass description
            }),
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                const text = await response.text();
                throw new Error(`Server returned non-JSON error (Status: ${response.status}). Raw response: ${text.substring(0, 100)}...`);
            }
            throw new Error(errorData.message || errorData.error || 'API route failed to save business profile.');
        }

        // Update local state
        onUpdate({ ...profileData, business }); 
        setSaveSuccess('Business Information saved!'); 
        setTimeout(() => setSaveSuccess(''), 3000); 
        
        // CRITICAL FIX: Call callback to refresh business list in parent
        onBusinessUpdated();

    } catch (err: any) {
        console.error('[BusinessDetails] Database save failed:', err);
        alert(`Failed to save business details. Check your connection. Details: ${err.message}`);
    }
  };

  const handleGbpConnect = (gbp: Partial<ProfileData['googleBusiness']>) => { const newGbp = { ...googleBusiness, ...gbp, status: 'Verified' as GbpStatus, placeId: `manual_${Date.now()}` }; setGoogleBusiness(newGbp); onUpdate({...profileData, googleBusiness: newGbp}); };
  const handleGbpDisconnect = () => { const newGbp = { profileName: '', mapsUrl: '', status: 'Not Created' as GbpStatus, placeId: undefined, rating: undefined, reviewCount: undefined, address: undefined }; setGoogleBusiness(newGbp); onUpdate({...profileData, googleBusiness: newGbp});};
  const handleGenerateDescription = async () => { if (!business.business_website) { alert("Please enter your Website URL first."); return; } setIsGeneratingDescription(true); try { const desc = await generateBusinessDescription(business.business_website); setBusiness(b => ({ ...b, business_description: desc })); } catch (e) { alert("Failed to generate description. Check your API key."); } finally { setIsGeneratingDescription(false); }};
  
  const renderDnaContent = () => {
    if (business.isDnaApproved && profileData.brandDnaProfile) {
        return <DnaReviewAndSaved visualDna={isDnaEditing ? editableDna! : business.dna} detailedDna={isDnaEditing ? editableBrandProfile! : profileData.brandDnaProfile} isEditable={isDnaEditing} onVisualDnaChange={setEditableDna} onDetailedDnaChange={setEditableBrandProfile} onSave={handleUpdateDna} onCancel={() => setIsDnaEditing(false)} onRestart={handleAnalyzeDna} onEdit={() => { setEditableDna(JSON.parse(JSON.stringify(business.dna))); setEditableBrandProfile(JSON.parse(JSON.stringify(profileData.brandDnaProfile!))); setIsDnaEditing(true); }} dnaLastUpdatedAt={business.dnaLastUpdatedAt} detectedGbp={null} isGbpConfirmed={false} onConfirmGbp={()=>{}} onRejectGbp={()=>{}}/>;
    }
    switch (extractionStage) {
      case 'idle': return (<><p className="text-brand-text-muted mb-4">Analyze your website to automatically pull your logo, colors, fonts, and full brand profile.</p>{analysisError && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm font-semibold">{analysisError}<div className="mt-2"><button onClick={handleAnalyzeDna} className="font-bold underline">Try again</button></div></div>}<div className="text-center p-4 rounded-xl"><p className="text-brand-text-muted mb-4">We'll analyze: <a href={business.business_website} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent-blue">{business.business_website}</a></p><button type="button" onClick={handleAnalyzeDna} className="bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-opacity duration-300 text-lg shadow-lg">Extract Business DNA</button></div></>);
      case 'extracting': return <DnaExtractionLoading />;
      case 'reviewing': return (editableDna && editableBrandProfile) ? <DnaReviewAndSaved visualDna={editableDna} detailedDna={editableBrandProfile} isEditable={true} onSave={handleInitialSaveDna} onRestart={handleAnalyzeDna} onVisualDnaChange={setEditableDna} onDetailedDnaChange={setEditableBrandProfile} onEdit={() => {}} onCancel={() => setExtractionStage('idle')} detectedGbp={detectedGbp} isGbpConfirmed={isGbpConfirmed} onConfirmGbp={() => setIsGbpConfirmed(true)} onRejectGbp={() => setDetectedGbp(null)}/> : <Loader />;
      case 'saving': return <div className="text-center p-8"><Loader /><p className="mt-2 font-semibold">Saving your Business DNA...</p></div>;
      default: return null;
    }
  };
  const renderGbpContent = () => { if (step3Completed && !isGbpSkipped) { return (<div>{googleBusiness.placeId?.startsWith('detected_') && (<p className="text-brand-text-muted mb-4">Your Google Business Profile was automatically detected and connected during Business DNA extraction.</p>)}<GbpDashboard gbpData={googleBusiness} onDisconnect={handleGbpDisconnect} /></div>); } const onUpdateStatus = (s: GbpStatus) => { const newGbp = {...googleBusiness, status: s}; setGoogleBusiness(newGbp); }; switch (googleBusiness.status) { case 'Not Created': return <GbpNotCreatedGuide business={business} onUpdateStatus={onUpdateStatus} onSkip={() => setIsGbpSkipped(true)} />; case 'Not Verified': return <GbpNotVerifiedGuide onUpdateStatus={onUpdateStatus} />; case 'Verified': return <GbpConnect profileData={profileData} onConnect={handleGbpConnect} />; default: return <p className="text-brand-text-muted">Select a status to continue.</p>; } };
  const renderSocialContent = () => { if (step4Completed) { return <SocialAccountsStep userId={userId} onContinue={() => {}} onSkip={() => {}} />; } return <div className="text-center p-4"><Loader /><p className="text-sm text-brand-text-muted mt-2">Loading...</p></div>; };

  const handleLockedClick = (stepNumber: number) => {
    let message = '';
    switch (stepNumber) {
        case 2:
            message = 'Please complete Step 1 (Business Information) first.';
            break;
        case 3:
            message = 'Please complete Step 2 (Business DNA) first.';
            break;
        case 4:
            message = 'Please complete Step 3 (Google Business Profile) first.';
            break;
        default:
            message = 'This step is locked until the previous step is complete.';
    }
    setNotification({ message, type: 'info' });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
        {notification && (
            <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-xl flex items-center gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                <InfoIcon className="w-6 h-6" />
                <p className="font-semibold">{notification.message}</p>
                <button onClick={() => setNotification(null)}><XMarkIcon className="w-5 h-5" /></button>
            </div>
        )}
        <div><h1 className="text-3xl font-extrabold text-brand-text">Business Details</h1><p className="text-lg text-brand-text-muted mt-1">Complete these steps to set up your business profile.</p></div>
        <ProgressBar currentStep={currentStep} totalSteps={4} />
        
        <StepCard number={1} title="Business Information" badge={step1Completed ? "✓ Complete" : "Required"} badgeColor={step1Completed ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"} isComplete={step1Completed} defaultOpen={!step1Completed} onLockedClick={handleLockedClick}>
            <p className="text-brand-text-muted mb-6">This info powers all JetSuite tools.</p>
            {saveSuccess && <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4 text-sm font-semibold">{saveSuccess}</div>}
            <form onSubmit={handleSaveInfo} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-brand-text mb-1">Business Name <span className="text-red-500">*</span></label><input type="text" name="business_name" value={business.business_name} onChange={handleBusinessChange} className="w-full bg-brand-light border border-brand-border rounded-lg p-2"/></div>
                    <div><label className="block text-sm font-medium text-brand-text mb-1">Website URL <span className="text-red-500">*</span></label><input type="url" name="business_website" value={business.business_website} onChange={handleBusinessChange} placeholder="https://..." className="w-full bg-brand-light border border-brand-border rounded-lg p-2"/></div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-text mb-1">Business Description</label>
                    <div className="flex items-center gap-2 mb-2">
                        <button type="button" onClick={handleGenerateDescription} disabled={isGeneratingDescription} className="flex items-center gap-1 text-xs font-semibold bg-accent-purple/10 text-accent-purple px-2 py-1 rounded-md hover:bg-accent-purple/20">
                            {isGeneratingDescription ? <><Loader /> Generating...</> : <><SparklesIcon className="w-3 h-3"/> Generate with AI</>}
                        </button>
                        <span className="text-xs text-brand-text-muted">or write your own below</span>
                    </div>
                    <textarea name="business_description" value={business.business_description} onChange={handleBusinessChange} rows={3} maxLength={500} placeholder="Use AI to generate one..." className="w-full bg-brand-light border border-brand-border rounded-lg p-2"/>
                    <p className="text-right text-xs text-brand-text-muted">{business.business_description?.length || 0} / 500</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-text mb-1">Business Category</label>
                    {suggestedCategory && <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg mb-2 flex justify-between items-center text-sm"><p>💡 Suggested: <span className="font-bold">{suggestedCategory}</span></p><div><button type="button" onClick={() => { setBusiness(b => ({ ...b, industry: suggestedCategory })); setSuggestedCategory(null); }} className="font-semibold text-blue-600 px-2">Accept</button><button onClick={() => setSuggestedCategory(null)} className="text-gray-500">x</button></div></div>}
                    <input list="business-categories" name="industry" value={business.industry} onChange={handleBusinessChange} className="w-full bg-brand-light border border-brand-border rounded-lg p-2"/>
                    <datalist id="business-categories">{BUSINESS_CATEGORIES.map(cat => <option key={cat} value={cat} />)}</datalist>
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-text mb-1">Primary Location (City, State)</label>
                    <input type="text" name="location" value={business.location} onChange={handleBusinessChange} className="w-full bg-brand-light border border-brand-border rounded-lg p-2"/>
                </div>
                {isDirty && <div className="flex justify-end pt-2"><button type="submit" className="bg-accent-blue text-white font-bold py-2 px-4 rounded-lg">Save Changes</button></div>}
            </form>
        </StepCard>

        <StepCard number={2} title="Business DNA" badge={step1Completed ? (step2Completed ? "✓ Complete" : "Ready") : "Requires Step 1"} badgeColor={step1Completed ? (step2Completed ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800") : "bg-gray-200 text-gray-700"} isComplete={step2Completed} isLocked={!step1Completed} defaultOpen={step1Completed && !step2Completed} onLockedClick={handleLockedClick}>
            {!step1Completed ? <p className="text-center font-semibold">Complete Step 1 first.</p> : renderDnaContent()}
        </StepCard>

        <StepCard number={3} title="Google Business Profile" badge={step3Completed ? (isGbpSkipped ? "Skipped" : "✓ Connected") : "Recommended"} badgeColor={step3Completed ? (isGbpSkipped ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800") : "bg-blue-100 text-blue-800"} isComplete={step3Completed} isLocked={!step2Completed} defaultOpen={step2Completed && !step3Completed} onLockedClick={handleLockedClick}>
            <div className="mb-6 bg-gradient-to-r from-accent-blue/10 to-accent-purple/10 border border-accent-purple/30 rounded-lg p-4">
                <h3 className="font-semibold text-accent-purple mb-3 flex items-center"><span className="text-lg mr-2">🎯</span>Why Connect Your GBP?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-brand-text-muted">
                    <div className="flex items-start"><span className="text-green-500 mr-2 mt-0.5">✓</span><span>Run local SEO audits with <strong className="text-brand-text">JetBiz</strong></span></div>
                    <div className="flex items-start"><span className="text-green-500 mr-2 mt-0.5">✓</span><span>Auto-fetch reviews for <strong className="text-brand-text">JetReply & JetTrust</strong></span></div>
                    <div className="flex items-start"><span className="text-green-500 mr-2 mt-0.5">✓</span><span>Get hyper-local content from <strong className="text-brand-text">JetCreate</strong></span></div>
                    <div className="flex items-start"><span className="text-green-500 mr-2 mt-0.5">✓</span><span>Improve your <strong className="text-brand-text">Growth Score</strong> accuracy</span></div>
                </div>
            </div>
            <div className="flex justify-between items-start mb-4">
                <div><p className="text-brand-text-muted">Critical for local visibility and map rankings.</p></div>
                {step3Completed && !isGbpSkipped && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Connected</span>}
            </div>
            <div className="mt-4">
                <label className="block text-sm font-medium text-brand-text mb-2">What is the status of your Google Business Profile?</label>
                <select name="status" value={googleBusiness.status} onChange={handleGoogleBusinessChange} className="w-full bg-brand-light border rounded-lg p-3 mb-4" disabled={step3Completed && !isGbpSkipped}>
                    <option value="Not Created">I don't have a profile yet</option>
                    <option value="Not Verified">I have a profile, but it's not verified</option>
                    <option value="Verified">My profile is verified</option>
                </select>
                {renderGbpContent()}
            </div>
        </StepCard>

        <StepCard number={4} title="Connect Social Accounts" badge="Optional" badgeColor="bg-purple-100 text-purple-800" isComplete={step4Completed} isLocked={!step3Completed} defaultOpen={step3Completed && !step4Completed} onLockedClick={handleLockedClick}>
            {!userId ? <div className="text-center p-4"><Loader /><p className="text-sm text-brand-text-muted mt-2">Loading...</p></div> : renderSocialContent()}
        </StepCard>

        {allStepsComplete && <CompletionCard onNext={() => setActiveTool(ALL_TOOLS['jetbiz'])} />}
    </div>
  );
};