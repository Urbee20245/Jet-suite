import React, { useState, useEffect } from 'react';
import type { Tool, ProfileData, KeywordAnalysisResult, KeywordSearchResult } from '../types';
import { findKeywords } from '../services/geminiService';
import { InformationCircleIcon, MapPinIcon, PlusIcon } from '../components/icons/MiniIcons';
import { JetKeywordsIcon } from '../components/icons/ToolIcons';
import { TOOLS } from '../constants';

// New Component Imports
import { ToolPageLayout } from '../components/ToolPageLayout';
import { ToolHeader } from '../components/ToolHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SectionTitle } from '../components/ui/SectionTitle';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';

interface JetKeywordsProps {
  tool: Tool;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null) => void;
}

const difficultyColor = (difficulty: string) => {
  switch (difficulty?.toLowerCase()) {
    case 'low':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const KeywordCategory: React.FC<{ title: string; keywords: KeywordSearchResult[] | undefined }> = ({ title, keywords }) => {
  if (!keywords || keywords.length === 0) return null;
  return (
    <Card level={2} className="h-full">
      <h4 className="text-lg font-semibold text-accent-purple mb-3">{title}</h4>
      <ul className="space-y-2">
        {keywords.map((kw, index) => (
          <Card key={index} level={3} className="flex justify-between items-center shadow-none">
            <span className="text-brand-text text-sm md:text-base break-all pr-2">{kw.keyword}</span>
            <div className="flex items-center space-x-3 flex-shrink-0">
              <span className="text-xs text-brand-text-muted font-mono hidden sm:inline">{kw.monthly_volume}</span>
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${difficultyColor(kw.difficulty)}`}>
                {kw.difficulty}
              </span>
            </div>
          </Card>
        ))}
      </ul>
    </Card>
  );
};

export const JetKeywords: React.FC<JetKeywordsProps> = ({ tool, profileData, setActiveTool }) => {
  const service = profileData.business.industry;
  
  const [targetLocation, setTargetLocation] = useState(
    profileData.business.location || profileData.googleBusiness.address || ''
  );
  
  const [descriptiveKeywords, setDescriptiveKeywords] = useState('');
  const [result, setResult] = useState<KeywordAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);

  useEffect(() => {
    if (!targetLocation) {
        setTargetLocation(profileData.business.location || profileData.googleBusiness.address || '');
    }
  }, [profileData]);

  // Suggestions based on category
  const getSuggestions = () => {
    const defaultSuggestions = ["local service", "professional company", "trusted expert", "near me", "best in town", "affordable prices", "high quality", "customer choice", "top rated", "certified"];
    
    const categoryMap: Record<string, string[]> = {
        "Web Design & Digital Marketing Agency": ["custom web design", "seo services", "ppc management", "social media marketing", "local seo", "responsive website", "ecommerce solutions", "branding services", "ui/ux design", "lead generation", "conversion optimization", "content marketing"],
        "Plumber": ["emergency plumbing", "drain cleaning", "leak repair", "water heater install", "pipe bursting", "clogged toilet", "commercial plumbing", "residential plumber", "water pressure fix", "sump pump service"],
        "HVAC Contractor": ["ac repair", "furnace maintenance", "hvac installation", "emergency heating", "air duct cleaning", "thermostat setup", "heat pump service", "central air fix", "indoor air quality", "hvac contractor"],
        "Attorney / Law Firm": ["legal advice", "litigation services", "family law", "personal injury", "corporate law", "criminal defense", "estate planning", "legal consultation", "court representation", "legal experts"],
        "Medical Practice": ["patient care", "health screening", "medical checkup", "primary care", "specialist doctor", "family medicine", "telehealth", "preventative care", "pediatrics", "internal medicine"]
    };

    return categoryMap[service] || defaultSuggestions;
  };

  const handleAddSuggestion = (suggestion: string) => {
    const current = descriptiveKeywords.split(',').map(s => s.trim()).filter(Boolean);
    if (!current.includes(suggestion)) {
        const newVal = [...current, suggestion].join(', ');
        setDescriptiveKeywords(newVal);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetLocation) {
        setError('Please specify a target location.');
        return;
    }

    const keywordArray = descriptiveKeywords.split(',').map(k => k.trim()).filter(Boolean);
    if (keywordArray.length < 3) {
      setError('Please enter at least 3 descriptive keywords.');
      return;
    }
    
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const keywords = await findKeywords(service, targetLocation, keywordArray.join(', '));
      setResult(keywords);
    } catch (err) {
      setError('Failed to find keywords. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!service) {
    return (
      <ToolPageLayout>
        <EmptyState
          icon={InformationCircleIcon}
          title="Set Your Business Category"
          description="Please set your business category in your profile to find relevant keywords."
          action={{
            label: 'Go to Business Details',
            onClick: () => setActiveTool(TOOLS.find(t => t.id === 'businessdetails')!),
          }}
        />
      </ToolPageLayout>
    );
  }

  return (
    <ToolPageLayout>
      <ToolHeader
        icon={JetKeywordsIcon}
        title={tool.name}
        description={tool.description || 'Discover the best local keywords to attract more customers online.'}
        badge="Analyze"
      />
      
      {showHowTo && (
        <Card level={2} className="bg-accent-purple/5 border-accent-purple/30">
          <div className="flex items-start gap-4">
            <InformationCircleIcon className="w-6 h-6 text-accent-purple flex-shrink-0" />
            <div>
              <h3 className="font-bold text-brand-text">How to Use {tool.name}</h3>
              <ul className="list-disc pl-5 space-y-1 mt-2 text-sm text-brand-text-muted">
                  <li>Your primary service is pulled from your profile.</li>
                  <li>Set a **Target Location** for specific results.</li>
                  <li>Use the suggestions below to quickly build your search.</li>
              </ul>
            </div>
            <Button variant="tertiary" size="sm" onClick={() => setShowHowTo(false)}>
                <XMarkIcon className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}
      
      <Card level={1}>
        <SectionTitle subtitle="Enter your target location and descriptive keywords">
          Keyword Research Input
        </SectionTitle>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card level={3} className="flex items-center shadow-none">
                <span className="text-sm font-medium text-brand-text mr-2">Primary Service:</span>
                <span className="font-semibold text-brand-text">{service}</span>
            </Card>
            <div className="relative">
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1 ml-1">Target Location (Required)</label>
                <div className="flex items-center bg-brand-light border border-brand-border rounded-lg p-3 focus-within:ring-2 focus-within:ring-accent-purple transition-all">
                    <MapPinIcon className="w-4 h-4 text-accent-purple mr-2" />
                    <input 
                        type="text" 
                        value={targetLocation} 
                        onChange={e => setTargetLocation(e.target.value)} 
                        placeholder="e.g., Metro Atlanta" 
                        className="bg-transparent border-none p-0 text-brand-text font-semibold focus:ring-0 w-full"
                        required
                    />
                </div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <label htmlFor="descriptive-keywords" className="text-sm font-medium text-brand-text">
                  Your Descriptive Keywords
                </label>
                <span className="text-xs text-brand-text-muted">Separated by commas</span>
            </div>
            
            {/* Suggestion Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
                {getSuggestions().map(suggestion => (
                    <Button
                        key={suggestion}
                        variant="tertiary"
                        size="sm"
                        onClick={() => handleAddSuggestion(suggestion)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-accent-purple/10 hover:border-accent-purple hover:text-accent-purple transition-all"
                    >
                        <PlusIcon className="w-3 h-3" />
                        {suggestion}
                    </Button>
                ))}
            </div>

            <textarea
              id="descriptive-keywords"
              rows={3}
              value={descriptiveKeywords}
              onChange={(e) => setDescriptiveKeywords(e.target.value)}
              placeholder="e.g., custom website design, local SEO services, high converting websites..."
              className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition resize-none"
            />
          </div>
          
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? 'Finding Keywords...' : 'Find Keywords'}
          </Button>
        </form>
      </Card>
      
      {loading && <LoadingSpinner text="Analyzing search data and competition..." size="lg" />}
      
      {result && (
        <Card level={1} className="animate-in fade-in slide-in-from-bottom-4">
            <SectionTitle subtitle={`Keywords found for ${targetLocation}`}>
                Keyword Analysis Results
            </SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <KeywordCategory title="Primary Keywords" keywords={result.primary_keywords} />
                <KeywordCategory title="Long-Tail Keywords" keywords={result.long_tail_keywords} />
                <KeywordCategory title="Question-Based Keywords" keywords={result.question_keywords} />
                <KeywordCategory title="Local Modifier Keywords" keywords={result.local_modifier_keywords} />
            </div>
        </Card>
      )}
    </ToolPageLayout>
  );
};