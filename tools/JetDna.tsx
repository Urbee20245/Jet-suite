
import React, { useState } from 'react';
import type { Tool, ProfileData, BrandDnaProfile } from '../types';
import { extractBrandDnaProfile } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { InformationCircleIcon, CheckCircleIcon } from '../components/icons/MiniIcons';
import { HowToUse } from '../components/HowToUse';
import { TOOLS } from '../constants';

interface JetDnaProps {
  tool: Tool;
  profileData: ProfileData;
  onUpdate: (data: ProfileData) => void;
  setActiveTool: (tool: Tool) => void;
}

const DnaSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-brand-light p-4 rounded-lg border border-brand-border">
    <h3 className="text-lg font-bold text-accent-purple mb-3">{title}</h3>
    <div className="space-y-3 text-sm">{children}</div>
  </div>
);

const DnaField: React.FC<{ label: string; value: string | string[] | boolean | undefined }> = ({ label, value }) => {
    let displayValue: React.ReactNode = '-';

    if (Array.isArray(value)) {
        displayValue = value.length > 0 ? value.join(', ') : '-';
    } else if (typeof value === 'boolean') {
        displayValue = value ? 'Yes' : 'No';
    } else if (value) {
        displayValue = value;
    }

    return (
        <div>
            <p className="font-semibold text-brand-text-muted">{label}</p>
            <p className="text-brand-text">{displayValue}</p>
        </div>
    );
};


const DnaDisplay: React.FC<{ dna: BrandDnaProfile }> = ({ dna }) => (
  <div className="space-y-6">
    <DnaSection title="Brand Tone & Voice">
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

    <DnaSection title="Industry & Context">
        <DnaField label="Category Confirmation" value={dna.industry_context.category_confirmation} />
        <DnaField label="Service Focus Areas" value={dna.industry_context.service_focus_areas} />
        <DnaField label="Local Relevance Signals" value={dna.industry_context.local_relevance_signals} />
        <DnaField label="Professionalism Cues" value={dna.industry_context.professionalism_cues} />
    </DnaSection>
  </div>
);

export const JetDna: React.FC<JetDnaProps> = ({ tool, profileData, onUpdate, setActiveTool }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);

  if (!profileData.business.websiteUrl) {
    return (
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg text-center">
        <InformationCircleIcon className="w-12 h-12 mx-auto text-accent-blue" />
        <h2 className="text-2xl font-bold text-brand-text mt-4">Complete Your Profile</h2>
        <p className="text-brand-text-muted my-4 max-w-md mx-auto">
          Please provide your Business Name, Category, Location, and Website URL in your profile to use this tool. This information is required to extract your Brand DNA.
        </p>
        <button
          onClick={() => setActiveTool(TOOLS.find(t => t.id === 'businessdetails')!)}
          className="bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Go to Business Details
        </button>
      </div>
    );
  }

  const handleAnalyze = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await extractBrandDnaProfile(profileData.business);
      onUpdate({ ...profileData, brandDnaProfile: result });
    } catch (err) {
      setError('Failed to extract Brand DNA. The AI may be having trouble with this request. Please try again.');
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
        <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
            {!profileData.brandDnaProfile ? (
                 <>
                    <div className="bg-green-50 border-l-4 border-green-400 text-green-700 p-4 rounded-md mb-6">
                        <div className="flex">
                            <div className="py-1"><CheckCircleIcon className="w-6 h-6 mr-3"/></div>
                            <div>
                                <p className="font-bold">Using your active business profile</p>
                                <p className="text-sm">Ready to analyze the website for '{profileData.business.name}'.</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-brand-text-muted mb-6">{tool.description}</p>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <button onClick={handleAnalyze} disabled={loading} className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg">
                        {loading ? 'Analyzing...' : 'Analyze Brand DNA'}
                    </button>
                </>
            ) : (
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-text">Authoritative Brand DNA</h2>
                        <p className="text-brand-text-muted">This DNA profile is used across all JetSuite tools.</p>
                    </div>
                    <button onClick={handleAnalyze} disabled={loading} className="bg-white hover:bg-brand-light border border-brand-border text-brand-text font-semibold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50">
                        {loading ? 'Re-analyzing...' : 'Re-analyze DNA'}
                    </button>
                </div>
            )}
        </div>
        
        {loading && <Loader />}
        
        {profileData.brandDnaProfile && !loading && (
            <div className="mt-6 bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
                <DnaDisplay dna={profileData.brandDnaProfile} />
            </div>
        )}
    </div>
  );
};
