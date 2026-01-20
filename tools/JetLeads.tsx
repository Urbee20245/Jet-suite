import React, { useState, useEffect } from 'react';
import type { Tool, ProfileData } from '../types';
import { findLeads } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { ResultDisplay } from '../components/ResultDisplay';
import { HowToUse } from '../components/HowToUse';
import { InformationCircleIcon, MapPinIcon } from '../components/icons/MiniIcons';
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
  const profileLocation = profileData.business.location || 
                   (profileData.business.city && profileData.business.state 
                    ? `${profileData.business.city}, ${profileData.business.state}` 
                    : profileData.business.city || profileData.business.state || '');

  const [targetArea, setTargetArea] = useState(profileLocation);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);

  useEffect(() => {
    if (!targetArea) {
        setTargetArea(profileLocation);
    }
  }, [profileLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetArea) {
        setError('Please specify a target area.');
        return;
    }

    setError('');
    setLoading(true);
    setResult('');
    try {
      const analysis = await findLeads(service, targetArea);
      setResult(analysis);
    } catch (err) {
      setError('Failed to find leads. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // If critical info is missing, show a helpful setup screen
  if (!service) {
    return (
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg text-center">
        <div className="w-16 h-16 bg-accent-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <InformationCircleIcon className="w-10 h-10 text-accent-blue" />
        </div>
        <h2 className="text-2xl font-bold text-brand-text mb-2">Lead Discovery Requires Category</h2>
        <p className="text-brand-text-muted mb-8 max-w-md mx-auto">
          To find people looking for your services, we need to know your **Business Category**.
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
                <li>Your service is automatically used from your active profile.</li>
                <li>Enter the specific **Target Area** you want to find leads in.</li>
                <li>AI scans social signals and forums to find high-intent prospects in your area.</li>
            </ul>
        </HowToUse>
      )}
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg border border-brand-border">
        <p className="text-brand-text-muted mb-6">{tool.description}</p>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text-muted flex items-center">
                <span className="text-sm font-medium text-brand-text mr-2">Your Service:</span>
                <span className="font-semibold text-brand-text">{service}</span>
            </div>
            <div className="relative">
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1 ml-1">Target Service Area</label>
                <div className="flex items-center bg-brand-light border border-brand-border rounded-lg p-3 focus-within:ring-2 focus-within:ring-accent-purple transition-all">
                    <MapPinIcon className="w-4 h-4 text-accent-purple mr-2" />
                    <input 
                        type="text" 
                        value={targetArea} 
                        onChange={e => setTargetArea(e.target.value)} 
                        placeholder="e.g., Metro Atlanta or Online Forums" 
                        className="bg-transparent border-none p-0 text-brand-text font-semibold focus:ring-0 w-full"
                        required
                    />
                </div>
                {profileLocation && profileLocation !== targetArea && (
                    <p className="text-xs text-brand-text-muted mt-1 ml-1">
                        Profile location: {profileLocation}. You can override it here.
                    </p>
                )}
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