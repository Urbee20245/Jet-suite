import React, { useState } from 'react';
import type { Tool, ProfileData } from '../types';
import { findLeads } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { ResultDisplay } from '../components/ResultDisplay';
import { HowToUse } from '../components/HowToUse';
import { InformationCircleIcon } from '../components/icons/MiniIcons';
import { TOOLS } from '../constants';

interface JetLeadsProps {
  tool: Tool;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null) => void;
}

export const JetLeads: React.FC<JetLeadsProps> = ({ tool, profileData, setActiveTool }) => {
  // Extract data with fallbacks
  const service = profileData.business.industry;
  
  // Fallback logic for location: use business.location, or combine city/state
  const location = profileData.business.location || 
                   (profileData.business.city && profileData.business.state 
                    ? `${profileData.business.city}, ${profileData.business.state}` 
                    : profileData.business.city || profileData.business.state || '');

  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult('');
    try {
      const analysis = await findLeads(service, location);
      setResult(analysis);
    } catch (err) {
      setError('Failed to find leads. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // If critical info is missing, show a helpful setup screen
  if (!service || !location) {
    return (
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg text-center">
        <div className="w-16 h-16 bg-accent-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <InformationCircleIcon className="w-10 h-10 text-accent-blue" />
        </div>
        <h2 className="text-2xl font-bold text-brand-text mb-2">Lead Discovery Requires Location</h2>
        <p className="text-brand-text-muted mb-8 max-w-md mx-auto">
          To find people looking for your services, we need to know your **Business Category** and **Service Area**. 
          {!service && <span className="block mt-2 text-red-500 font-semibold">❌ Missing: Business Category</span>}
          {!location && <span className="block mt-2 text-red-500 font-semibold">❌ Missing: Service Area (City/State)</span>}
        </p>
        <button
          onClick={() => setActiveTool(TOOLS.find(t => t.id === 'businessdetails')!)}
          className="bg-gradient-to-r from-accent-blue to-accent-purple hover:opacity-90 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg"
        >
          Complete Business Details
        </button>
      </div>
    );
  }

  return (
    <div>
      {showHowTo && (
        <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
            <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Your service and area are automatically used from your active profile.</li>
                <li>Click 'Find Leads' to discover public posts from people looking for your services.</li>
                <li>AI scans social signals and forums to find high-intent prospects in your area.</li>
            </ul>
        </HowToUse>
      )}
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg border border-brand-border">
        <p className="text-brand-text-muted mb-2">{tool.description}</p>
        <p className="text-sm text-brand-text-muted mb-6">
          Replaces: <span className="text-accent-purple font-semibold">Lead Generation Service ($500-2,000/mo)</span>
        </p>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text-muted flex items-center">
                <span className="text-sm font-medium text-brand-text mr-2">Your Service:</span>
                <span className="font-semibold text-brand-text">{service}</span>
            </div>
            <div className="bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text-muted flex items-center">
                <span className="text-sm font-medium text-brand-text mr-2">Target Area:</span>
                <span className="font-semibold text-brand-text">{location}</span>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:opacity-90 text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-lg"
          >
            {loading ? 'Searching for Local Leads...' : 'Find High-Intent Leads'}
          </button>
        </form>
      </div>
      {loading && (
          <div className="mt-12">
              <Loader />
              <p className="text-center text-brand-text-muted animate-pulse">Our AI is scanning local data for new customer opportunities...</p>
          </div>
      )}
      {result && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ResultDisplay markdownText={result} />
          </div>
      )}
    </div>
  );
};