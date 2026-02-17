import React, { useState } from 'react';
import type { Tool, ProfileData, BrandDnaProfile, BusinessDna } from '../types';
import { extractBrandDnaProfile, extractWebsiteDna } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { InformationCircleIcon, CheckCircleIcon, SparklesIcon, BoltIcon, CheckIcon, ArrowRightIcon, ChartBarIcon } from '../components/icons/MiniIcons';
import { HowToUse } from '../components/HowToUse';
import { TOOLS } from '../constants';

interface JetDnaProps {
  tool: Tool;
  profileData: ProfileData;
  onUpdate: (data: ProfileData) => void;
  setActiveTool: (tool: Tool) => void;
}

const DnaSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
    <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4">
      <h3 className="text-base font-bold text-brand-text flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shrink-0">
          <ChartBarIcon className="w-3.5 h-3.5 text-white" />
        </span>
        {title}
      </h3>
    </div>
    <div className="px-6 py-4 space-y-3 text-sm">{children}</div>
  </div>
);

const DnaField: React.FC<{ label: string; value: string | string[] | boolean | undefined }> = ({ label, value }) => {
    let displayValue: React.ReactNode = (
      <span className="text-xs text-brand-text-muted italic">—</span>
    );

    if (Array.isArray(value) && value.length > 0) {
        displayValue = (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {value.map((v, i) => (
              <span key={i} className="bg-accent-blue/10 text-accent-blue border border-accent-blue/20 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {v}
              </span>
            ))}
          </div>
        );
    } else if (typeof value === 'boolean') {
        displayValue = (
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${value ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-brand-light text-brand-text-muted border-brand-border'}`}>
            {value ? <CheckIcon className="w-3 h-3" /> : null}
            {value ? 'Yes' : 'No'}
          </span>
        );
    } else if (value) {
        displayValue = <p className="text-brand-text">{value}</p>;
    }

    return (
        <div>
            <p className="font-semibold text-brand-text-muted text-xs uppercase tracking-wider mb-1">{label}</p>
            {displayValue}
        </div>
    );
};


const DnaDisplay: React.FC<{ dna: BrandDnaProfile }> = ({ dna }) => (
  <div className="space-y-4">
    <DnaSection title="Brand Tone &amp; Voice">
        <DnaField label="Primary Tone" value={dna.brand_tone.primary_tone} />
        <DnaField label="Secondary Modifiers" value={dna.brand_tone.secondary_modifiers} />
        <DnaField label="Writing Style" value={dna.brand_tone.writing_style} />
        <DnaField label="Emotional Positioning" value={dna.brand_tone.emotional_positioning} />
    </DnaSection>

    <DnaSection title="Visual Identity">
        <DnaField label="Primary Colors" value={dna.visual_identity.primary_colors} />
        <DnaField label="Secondary Colors" value={dna.visual_identity.secondary_colors} />
        <DnaField label="Color Mood" value={dna.visual_identity.color_mood} />
        <DnaField label="Typography Style" value={dna.visual_identity.typography_style} />
        <DnaField label="Layout Style" value={dna.visual_identity.layout_style} />
    </DnaSection>
    
    <DnaSection title="Logo Profile">
        <DnaField label="Has Logo?" value={dna.logo_profile.has_logo} />
        <DnaField label="Logo Style" value={dna.logo_profile.logo_style} />
        <DnaField label="Dominant Logo Colors" value={dna.logo_profile.dominant_colors} />
        <DnaField label="Is Reusable for Creatives?" value={dna.logo_profile.is_reusable} />
    </DnaSection>

    <DnaSection title="Brand Positioning">
        <DnaField label="Core Value Proposition" value={dna.brand_positioning.value_proposition} />
        <DnaField label="Primary Customer Intent" value={dna.brand_positioning.primary_customer_intent} />
        <DnaField label="Local vs. National" value={dna.brand_positioning.local_vs_national} />
        <DnaField label="Differentiation Signals" value={dna.brand_positioning.differentiation_signals} />
    </DnaSection>

     <DnaSection title="Audience Profile">
        <DnaField label="Target Audience" value={dna.audience_profile.target_audience} />
    </DnaSection>

    <DnaSection title="Industry &amp; Context">
        <DnaField label="Category Confirmation" value={dna.industry_context.category_confirmation} />
        <DnaField label="Service Focus Areas" value={dna.industry_context.service_focus_areas} />
        <DnaField label="Local Relevance Signals" value={dna.industry_context.local_relevance_signals} />
        <DnaField label="Professionalism Cues" value={dna.industry_context.professionalism_cues} />
    </DnaSection>
  </div>
);

const imageURLToBase64 = async (url: string): Promise<string> => {
    if (!url || url.startsWith('data:image')) return url;
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
        console.error("CORS error fetching image, returning empty string:", error);
        return ""; // Return empty string on failure
    }
};

export const JetDna: React.FC<JetDnaProps> = ({ tool, profileData, onUpdate, setActiveTool }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);

  if (!profileData.business.business_website) {
    return (
      <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
        <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-accent-blue" />
          <h2 className="font-bold text-brand-text text-sm">Complete Your Profile</h2>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent-blue/10 to-accent-purple/10 border border-accent-blue/20 flex items-center justify-center mb-4">
            <InformationCircleIcon className="w-8 h-8 text-accent-blue" />
          </div>
          <h2 className="text-2xl font-bold text-brand-text mt-2">Complete Your Profile</h2>
          <p className="text-brand-text-muted my-4 max-w-md mx-auto">
            Please provide your Business Name, Category, Location, and Website URL in your profile to use this tool. This information is required to extract your Brand DNA.
          </p>
          <button
            onClick={() => setActiveTool(TOOLS.find(t => t.id === 'businessdetails')!)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-2.5 px-6 rounded-xl hover:shadow-lg hover:shadow-accent-purple/20 active:scale-[0.99] transition-all duration-300"
          >
            <ArrowRightIcon className="w-4 h-4" />
            Go to Business Details
          </button>
        </div>
      </div>
    );
  }

  const handleAnalyze = async () => {
    setError('');
    setLoading(true);
    try {
      // 1. Extract both visual and detailed DNA
      const [websiteDnaResult, brandDnaProfileResult] = await Promise.all([
        extractWebsiteDna(profileData.business.business_website),
        extractBrandDnaProfile(profileData.business)
      ]);

      // 2. Process visual DNA
      const { logoUrl, faviconUrl, ...extractedVisual } = websiteDnaResult;
      const logoBase64 = logoUrl ? await imageURLToBase64(logoUrl) : '';
      const visualDna: BusinessDna = { ...extractedVisual, logo: logoBase64, faviconUrl };

      // 3. Save to database via API
      const response = await fetch('/api/business/save-dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: profileData.business.id,
          dna: visualDna,
          brandDnaProfile: brandDnaProfileResult,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save DNA to database');
      }

      // 4. Update parent state with persisted data
      const updatedBusinessProfile = {
        ...profileData.business,
        dna: visualDna,
        brand_dna_profile: brandDnaProfileResult,
        isDnaApproved: true,
        dnaLastUpdatedAt: new Date().toISOString(),
      };

      onUpdate({
        ...profileData,
        business: updatedBusinessProfile,
        brandDnaProfile: brandDnaProfileResult,
      });

      alert('Brand DNA extracted and saved successfully!');

    } catch (err: any) {
      setError(err.message || 'Failed to extract and save Brand DNA. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
        {showHowTo && (
            <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>This tool analyzes your live website to extract its core brand identity.</li>
                    <li>The result is saved as your authoritative Brand DNA for all other tools.</li>
                    <li>This is a one-time analysis to ensure consistency.</li>
                </ul>
            </HowToUse>
        )}

        <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
          <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shrink-0">
              <BoltIcon className="w-4 h-4 text-white" />
            </span>
            <h2 className="font-bold text-brand-text">
              {!profileData.brandDnaProfile ? 'Analyze Brand DNA' : 'Authoritative Brand DNA'}
            </h2>
          </div>

          <div className="p-6 sm:p-8">
            {!profileData.brandDnaProfile ? (
               <>
                  <div className="bg-green-50 border border-green-200/60 text-green-700 p-4 rounded-xl mb-6 flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        <span className="bg-green-500/10 text-green-600 border border-green-500/20 rounded-full p-1 flex">
                          <CheckCircleIcon className="w-5 h-5"/>
                        </span>
                      </div>
                      <div>
                          <p className="font-bold">Using your active business profile</p>
                          <p className="text-sm">Ready to analyze the website for '{profileData.business.business_name}'.</p>
                      </div>
                  </div>
                  <p className="text-brand-text-muted mb-6">{tool.description}</p>
                  {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-3 px-4 rounded-xl hover:shadow-lg hover:shadow-accent-purple/20 active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SparklesIcon className="w-4 h-4" />
                    {loading ? 'Analyzing...' : 'Analyze Brand DNA'}
                  </button>
              </>
            ) : (
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-brand-text-muted">This DNA profile is used across all JetSuite tools.</p>
                    </div>
                    <button
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-accent-blue to-accent-purple text-white font-semibold py-2 px-4 rounded-xl hover:shadow-lg hover:shadow-accent-purple/20 active:scale-[0.99] transition-all duration-300 disabled:opacity-50"
                    >
                      <ArrowRightIcon className="w-4 h-4" />
                      {loading ? 'Re-analyzing...' : 'Re-analyze DNA'}
                    </button>
                </div>
            )}
          </div>
        </div>
        
        {loading && <Loader />}
        
        {profileData.brandDnaProfile && !loading && (
            <div className="mt-6">
                <DnaDisplay dna={profileData.brandDnaProfile} />
            </div>
        )}
    </div>
  );
};
