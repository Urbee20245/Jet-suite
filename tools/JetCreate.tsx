
import React, { useState, useEffect } from 'react';
import type { Tool, ProfileData, CampaignIdea, CreativeAssets, SocialPostAsset, AdCopyAsset } from '../types';
import { generateCampaignIdeas, generateCreativeAssets, generateImage } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { SparklesIcon, ArrowDownTrayIcon, ArrowPathIcon, InformationCircleIcon } from '../components/icons/MiniIcons';
import { TOOLS } from '../constants';

interface JetCreateProps {
  tool: Tool;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null) => void;
  // These are passed but not used per the prompt's requirements
  onUpdateProfile?: (data: ProfileData) => void; 
}

declare global {
    interface AIStudio { hasSelectedApiKey: () => Promise<boolean>; openSelectKey: () => Promise<void>; }
    interface Window { aistudio?: AIStudio; }
}

export const JetCreate: React.FC<JetCreateProps> = ({ tool, profileData, setActiveTool }) => {
    const [campaignIdeas, setCampaignIdeas] = useState<CampaignIdea[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<CampaignIdea | null>(null);
    const [customCampaignPrompt, setCustomCampaignPrompt] = useState('');
    const [assets, setAssets] = useState<CreativeAssets | null>(null);
    const [refinePrompt, setRefinePrompt] = useState('');

    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
    const [isLoadingAssets, setIsLoadingAssets] = useState(false);
    const [error, setError] = useState('');
    const [showWhy, setShowWhy] = useState(false);

    useEffect(() => {
        if (profileData.brandDnaProfile) {
            const fetchCampaigns = async () => {
                setIsLoadingCampaigns(true);
                setError('');
                try {
                    const ideas = await generateCampaignIdeas(profileData);
                    setCampaignIdeas(ideas);
                } catch (e) {
                    setError('Failed to generate campaign ideas. Please try again.');
                    console.error(e);
                } finally {
                    setIsLoadingCampaigns(false);
                }
            };
            fetchCampaigns();
        }
    }, [profileData]);

    const handleSelectCampaign = async (campaign: CampaignIdea, modifier?: string) => {
        setSelectedCampaign(campaign);
        setIsLoadingAssets(true);
        setError('');
        setAssets(null);
        try {
            const generatedAssets = await generateCreativeAssets(campaign, profileData, modifier);
            setAssets(generatedAssets);
        } catch (e) {
            setError('Failed to generate creative assets. Please try again.');
            console.error(e);
        } finally {
            setIsLoadingAssets(false);
        }
    };

    const handleCustomCampaign = () => {
        if (!customCampaignPrompt) return;
        const customCampaign: CampaignIdea = {
            id: 'custom',
            name: 'Custom Idea',
            description: customCampaignPrompt,
            channels: ['Social Media', 'Ads']
        };
        handleSelectCampaign(customCampaign);
    };

    const handleRefine = () => {
        if (selectedCampaign && refinePrompt) {
            handleSelectCampaign(selectedCampaign, refinePrompt);
        }
    };
    
    const handleAssetChange = (
        index: number,
        field: keyof SocialPostAsset | keyof AdCopyAsset,
        value: string,
        type: 'social' | 'ad'
    ) => {
        setAssets(assets => {
            if (!assets) return null;

            if (type === 'social') {
                const newSocialPosts = [...assets.social_posts];
                newSocialPosts[index] = {
                    ...newSocialPosts[index],
                    [field as keyof SocialPostAsset]: value,
                };
                return { ...assets, social_posts: newSocialPosts };
            } else {
                const newAdCopy = [...assets.ad_copy];
                newAdCopy[index] = {
                    ...newAdCopy[index],
                    [field as keyof AdCopyAsset]: value,
                };
                return { ...assets, ad_copy: newAdCopy };
            }
        });
    };

    if (!profileData.brandDnaProfile) {
        return (
            <div className="h-full flex items-center justify-center text-center p-8 bg-gradient-to-br from-brand-darker to-brand-dark">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl max-w-lg shadow-2xl shadow-accent-purple/10">
                    <h2 className="text-3xl font-bold text-white">Business Profile & Brand DNA Required</h2>
                    <p className="text-sm text-brand-text-muted mt-2">This helps JetCreate stay perfectly on-brand.</p>
                    
                    <p className="text-slate-300 my-6 leading-relaxed">
                        JetCreate uses your saved Business Profile and Brand DNA. Complete your Business Details to continue.
                    </p>

                    <button
                        onClick={() => setActiveTool(TOOLS.find(t => t.id === 'businessdetails')!)}
                        className="w-full bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-opacity duration-300 shadow-lg shadow-accent-purple/20"
                    >
                        Go to Business Details
                    </button>
                    
                    <div className="mt-6 relative">
                        <button onClick={() => setShowWhy(!showWhy)} className="text-accent-purple/70 hover:text-accent-purple text-sm font-semibold transition-colors">
                            Why this matters
                        </button>
                        {showWhy && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-brand-dark border border-slate-700 p-4 rounded-lg shadow-xl text-left text-xs text-slate-300">
                                 <div className="flex items-start gap-3">
                                    <InformationCircleIcon className="w-5 h-5 text-accent-purple flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-white mb-1">Brand Consistency is Key</h4>
                                        <p>JetCreate uses your saved Business Profile and Brand DNA to ensure every piece of content it generates is perfectly on-brand, saving you time and building a stronger brand identity.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="font-sans h-full w-full text-pomelli-text bg-pomelli-dark flex p-4 gap-4">
            {/* Left Panel: Campaigns */}
            <aside className="w-1/4 bg-pomelli-card rounded-2xl p-4 flex flex-col">
                <h2 className="font-bold text-lg mb-1">Campaign Ideas</h2>
                <p className="text-xs text-pomelli-text-muted mb-4">Using your saved Business Profile & Brand DNA</p>
                <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                    {isLoadingCampaigns ? <Loader /> : (
                        campaignIdeas.map(idea => (
                            <button key={idea.id} onClick={() => handleSelectCampaign(idea)} className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${selectedCampaign?.id === idea.id ? 'bg-pomelli-accent/10 border-pomelli-accent' : 'bg-pomelli-dark border-transparent hover:border-pomelli-text-muted/50'}`}>
                                <h3 className="font-semibold text-sm">{idea.name}</h3>
                                <p className="text-xs text-pomelli-text-muted mt-1">{idea.description}</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {idea.channels.map(ch => <span key={ch} className="text-[10px] bg-pomelli-text/10 px-1.5 py-0.5 rounded-full font-medium">{ch}</span>)}
                                </div>
                            </button>
                        ))
                    )}
                </div>
                 <div className="mt-4 pt-4 border-t border-pomelli-text-muted/10">
                    <textarea value={customCampaignPrompt} onChange={e => setCustomCampaignPrompt(e.target.value)} rows={2} placeholder="Or enter your own campaign idea..." className="w-full bg-pomelli-dark rounded-lg p-2 text-sm focus:ring-pomelli-accent focus:border-pomelli-accent"></textarea>
                    <button onClick={handleCustomCampaign} className="w-full mt-2 bg-pomelli-accent text-pomelli-accent-dark font-bold py-2 rounded-lg text-sm">Generate Custom Campaign</button>
                </div>
            </aside>

            {/* Main Panel: Assets */}
            <main className="w-3/4 bg-pomelli-card rounded-2xl flex flex-col">
                {!selectedCampaign ? (
                    <div className="flex-1 flex items-center justify-center text-center text-pomelli-text-muted">
                        <p>Select a campaign idea to get started</p>
                    </div>
                ) : isLoadingAssets ? (
                    <div className="flex-1 flex items-center justify-center"><Loader /></div>
                ) : assets ? (
                    <>
                        <header className="p-4 border-b border-pomelli-text-muted/10 flex justify-between items-center">
                            <div>
                                <h1 className="text-xl font-bold">{selectedCampaign.name}</h1>
                                <p className="text-sm text-pomelli-text-muted">{selectedCampaign.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="text" value={refinePrompt} onChange={e => setRefinePrompt(e.target.value)} placeholder="e.g., make it more promotional..." className="bg-pomelli-dark rounded-lg px-3 py-1.5 text-xs w-56"/>
                                <button onClick={handleRefine} title="Refine Campaign" className="p-2 bg-pomelli-dark rounded-lg hover:bg-pomelli-text/10"><ArrowPathIcon className="w-4 h-4"/></button>
                                <button title="Download Assets" className="p-2 bg-pomelli-dark rounded-lg hover:bg-pomelli-text/10"><ArrowDownTrayIcon className="w-4 h-4"/></button>
                            </div>
                        </header>
                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-4">
                            {/* Social Posts */}
                            <div className="space-y-4">
                                <h2 className="font-bold">Social Media Posts</h2>
                                {assets.social_posts.map((post, i) => (
                                    <div key={i} className="bg-pomelli-dark p-3 rounded-lg">
                                        <label className="text-xs font-semibold text-pomelli-text-muted">{post.platform}</label>
                                        <textarea value={post.copy} onChange={e => handleAssetChange(i, 'copy', e.target.value, 'social')} rows={4} className="w-full bg-transparent text-sm p-0 border-0 focus:ring-0 resize-none"></textarea>
                                        <p className="text-xs text-pomelli-text-muted mt-2"><strong>Visual:</strong> {post.visual_suggestion}</p>
                                    </div>
                                ))}
                            </div>
                            {/* Ad Copy */}
                            <div className="space-y-4">
                                 <h2 className="font-bold">Ad Copy</h2>
                                {assets.ad_copy.map((ad, i) => (
                                    <div key={i} className="bg-pomelli-dark p-3 rounded-lg">
                                        <label className="text-xs font-semibold text-pomelli-text-muted">Headline</label>
                                        <input type="text" value={ad.headline} onChange={e => handleAssetChange(i, 'headline', e.target.value, 'ad')} className="w-full bg-transparent font-semibold text-sm p-0 border-0 focus:ring-0 mb-2"/>
                                        
                                        <label className="text-xs font-semibold text-pomelli-text-muted">Description</label>
                                        <textarea value={ad.description} onChange={e => handleAssetChange(i, 'description', e.target.value, 'ad')} rows={3} className="w-full bg-transparent text-sm p-0 border-0 focus:ring-0 resize-none mb-2"></textarea>
                                        
                                        <label className="text-xs font-semibold text-pomelli-text-muted">Call to Action</label>
                                        <input type="text" value={ad.cta} onChange={e => handleAssetChange(i, 'cta', e.target.value, 'ad')} className="w-full bg-transparent font-semibold text-pomelli-accent text-sm p-0 border-0 focus:ring-0"/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : error ? (
                     <div className="flex-1 flex items-center justify-center text-center text-red-400">
                        <p>{error}</p>
                    </div>
                ) : null}
            </main>
        </div>
    );
};
