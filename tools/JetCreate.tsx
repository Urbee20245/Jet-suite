import React, { useState, useEffect } from 'react';
import type { Tool, ProfileData, CampaignIdea, CreativeAssets, SocialPostAsset, AdCopyAsset, SocialConnection } from '../types';
import { generateCampaignIdeas, generateCreativeAssets, generateImage } from '../services/geminiService';
import { getSocialConnections, createScheduledPost, PLATFORM_INFO } from '../services/socialMediaService';
import { Loader } from '../components/Loader';
import { 
    SparklesIcon, 
    ArrowDownTrayIcon, 
    ArrowPathIcon, 
    InformationCircleIcon,
    TrashIcon,
    PencilIcon,
    ChevronLeftIcon,
    PhotoIcon,
    CalendarDaysIcon,
    XMarkIcon,
    LockClosedIcon
} from '../components/icons/MiniIcons';
import { ALL_TOOLS } from '../constants';
import { getTomorrowDate, getMinDate, getMaxDate } from '../utils/dateTimeUtils';
import { HowToUse } from '../components/HowToUse';
import { AnalysisLoadingState } from '../components/AnalysisLoadingState';

interface JetCreateProps {
  tool: Tool;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null, articleId?: string) => void;
  onUpdateProfile?: (newProfileData: ProfileData, persist?: boolean) => void;
}

const handleDownloadImage = (imageUrl: string, filename: string) => {
    if (!imageUrl || !imageUrl.startsWith('data:image')) {
        alert('Image not yet generated or invalid format.');
        return;
    }
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href); // Clean up the object URL
};

const ScheduleModal: React.FC<{
    asset: SocialPostAsset | AdCopyAsset;
    connections: SocialConnection[];
    userId: string;
    onClose: () => void;
    onSuccess: (message: string) => void;
}> = ({ asset, connections, userId, onClose, onSuccess }) => {
    const [selectedConnectionIds, setSelectedConnectionIds] = useState<string[]>([]);
    const [date, setDate] = useState(getTomorrowDate());
    const [time, setTime] = useState('09:00');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSchedule = async (postNow = false) => {
        if (selectedConnectionIds.length === 0) {
            setError('Please select at least one social account to post to.');
            return;
        }
        setIsSubmitting(true);
        setError('');

        try {
            const postData = {
                post_text: 'copy' in asset ? asset.copy : `${asset.headline}\n\n${asset.description}`,
                hashtags: '', // Hashtags are part of the copy in JetCreate
                visual_suggestion: 'visual_suggestion' in asset ? asset.visual_suggestion : '',
                image_url: asset.imageUrl || null,
                scheduled_date: postNow ? new Date().toISOString().split('T')[0] : date,
                scheduled_time: postNow ? new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : time,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                platforms: selectedConnectionIds.map(connId => {
                    const conn = connections.find(c => c.id === connId)!;
                    return { platform: conn.platform, connection_id: conn.id };
                }),
                status: 'scheduled' as const,
            };

            await createScheduledPost(userId, postData);
            onSuccess(`Post successfully scheduled for ${postNow ? 'now' : `${date} at ${time}`}!`);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to schedule post.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-brand-card p-6 rounded-xl shadow-2xl max-w-lg w-full my-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-brand-text">Schedule Post</h3>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-brand-text-muted" /></button>
                </div>

                <div className="bg-brand-light p-4 rounded-lg mb-4 border border-brand-border">
                    <p className="text-xs font-semibold text-brand-text-muted mb-1">Content Preview:</p>
                    <p className="text-sm text-brand-text line-clamp-3">
                        {'copy' in asset ? asset.copy : `${asset.headline}\n\n${asset.description}`}
                    </p>
                </div>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-text mb-2">1. Select Accounts to Post To</label>
                        <div className="space-y-2">
                            {connections.length > 0 ? connections.map(conn => (
                                <label key={conn.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-brand-border cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedConnectionIds.includes(conn.id)}
                                        onChange={() => setSelectedConnectionIds(prev => 
                                            prev.includes(conn.id) ? prev.filter(id => id !== conn.id) : [...prev, conn.id]
                                        )}
                                        className="h-4 w-4 rounded border-gray-300 text-accent-purple focus:ring-accent-purple"
                                    />
                                    <span className="text-lg">{PLATFORM_INFO[conn.platform]?.icon || '🔗'}</span>
                                    <span className="text-sm font-semibold text-brand-text">{PLATFORM_INFO[conn.platform]?.name}</span>
                                    <span className="text-xs text-brand-text-muted ml-auto">@{conn.platform_username}</span>
                                </label>
                            )) : <p className="text-sm text-brand-text-muted">No social accounts connected. Connect them in JetSocial.</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-brand-text mb-2">2. Select Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} min={getMinDate()} max={getMaxDate(30)} className="w-full bg-white border border-brand-border rounded-lg p-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-text mb-2">3. Select Time</label>
                            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-white border border-brand-border rounded-lg p-2 text-sm" />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button onClick={() => handleSchedule(true)} disabled={isSubmitting} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50">Post Now</button>
                    <button onClick={() => handleSchedule(false)} disabled={isSubmitting} className="flex-1 bg-accent-blue hover:bg-accent-blue/80 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50">Schedule Post</button>
                </div>
            </div>
        </div>
    );
};
// --- End ScheduleModal Definition ---


export const JetCreate: React.FC<JetCreateProps> = ({ tool, profileData, setActiveTool }) => {
    const [campaignIdeas, setCampaignIdeas] = useState<CampaignIdea[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<CampaignIdea | null>(null);
    const [customCampaignPrompt, setCustomCampaignPrompt] = useState('');
    const [assets, setAssets] = useState<CreativeAssets | null>(null);
    const [refinePrompt, setRefinePrompt] = useState('');
    const [generatingImageFor, setGeneratingImageFor] = useState<string | null>(null);

    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
    const [isLoadingAssets, setIsLoadingAssets] = useState(false);
    const [error, setError] = useState('');
    const [hasStartedGeneration, setHasStartedGeneration] = useState(false);

    const [connections, setConnections] = useState<SocialConnection[]>([]);
    const [schedulingAsset, setSchedulingAsset] = useState<SocialPostAsset | AdCopyAsset | null>(null);
    const [scheduleSuccess, setScheduleSuccess] = useState('');

    const [showHowTo, setShowHowTo] = useState(true);

    const isProfileLocked = profileData.business.is_complete;

    useEffect(() => {
        if (profileData.user.id) {
            const loadConnections = async () => {
                try {
                    const userConnections = await getSocialConnections(profileData.user.id);
                    setConnections(userConnections);
                } catch (e) {
                    console.error("Failed to load social connections", e);
                }
            };
            loadConnections();
        }
    }, [profileData.user.id]);

    // Generate campaign images using Business DNA
    const generateBrandedImage = async (basePrompt: string, aspectRatio: "1:1" | "16:9" | "4:3"): Promise<string> => {
        const brandDna = profileData.brandDnaProfile;
        const business = profileData.business;
        
        // 1. Force the color palette using hex codes
        const colorPalette = brandDna?.visual_identity?.primary_colors?.join(', ') || 'professional business colors';
        const style = brandDna?.visual_identity?.layout_style || 'modern and clean';
        const tone = brandDna?.brand_tone?.primary_tone || 'professional';
        
        // 2. Strict branded prompt
        const brandedPrompt = `STRICT BRAND GUIDELINES: 
Use this exact color palette: ${colorPalette}. 
Visual style: ${style}, ${tone} tone.
Primary focus: ${basePrompt}.
Business: ${business.business_name}.
DESIGN RULES: Incorporate the provided business logo into the composition. Ensure the final result is high-end, editorial, and looks designed by a professional agency. NO generic stock photos.`;

        // 3. Prepare logo if available
        const logoData = business.dna?.logo;
        const inputImage = (logoData && logoData.startsWith('data:image')) ? {
            base64: logoData.split(',')[1],
            mimeType: logoData.split(';')[0].split(':')[1]
        } : undefined;

        try {
            // Pass the logo as a reference image to the AI
            const base64Image = await generateImage(brandedPrompt, '1K', aspectRatio, inputImage);
            return `data:image/png;base64,${base64Image}`;
        } catch (error) {
            console.error('Failed to generate branded image:', error);
            return '';
        }
    };

    const generateCampaignImage = async (campaign: CampaignIdea) => {
        try {
            return await generateBrandedImage(`A premium marketing campaign visual for "${campaign.name}"`, '16:9');
        } catch (e) {
            console.error('Error generating idea image:', e);
            return '';
        }
    };

    const handleStartGeneration = async () => {
        if (!profileData.brandDnaProfile || !isProfileLocked) return;

        setHasStartedGeneration(true);
        setIsLoadingCampaigns(true);
        setError('');

        try {
            const ideas = await generateCampaignIdeas(profileData);

            // Generate images for all campaigns with individual try-catch to prevent blocking the whole list
            const ideasWithImages = await Promise.all(
                ideas.map(async (idea) => {
                    let imageUrl = '';
                    try {
                        imageUrl = await generateCampaignImage(idea);
                    } catch (e) {
                        console.error(`Failed to generate image for idea ${idea.id}`, e);
                    }
                    return { ...idea, imageUrl };
                })
            );

            setCampaignIdeas(ideasWithImages);
        } catch (e) {
            setError('Failed to generate campaign ideas. Please try again.');
            console.error(e);
        } finally {
            setIsLoadingCampaigns(false);
        }
    };

    const handleSelectCampaign = async (campaign: CampaignIdea, modifier?: string) => {
        setSelectedCampaign(campaign);
        setIsLoadingAssets(true);
        setError('');
        setAssets(null);
        try {
            const generatedAssets = await generateCreativeAssets(campaign, profileData, modifier);
            
            // Add IDs to assets for tracking
            const assetsWithIds: CreativeAssets = {
                social_posts: generatedAssets.social_posts.map((post, i) => ({
                    ...post,
                    id: `social_${Date.now()}_${i}`
                })),
                ad_copy: generatedAssets.ad_copy.map((ad, i) => ({
                    ...ad,
                    id: `ad_${Date.now()}_${i}`
                }))
            };
            
            setAssets(assetsWithIds);
        } catch (e) {
            setError('Failed to generate creative assets. Please try again.');
            console.error(e);
        } finally {
            setIsLoadingAssets(false);
        }
    };

    const handleCustomCampaign = async () => {
        if (!customCampaignPrompt) return;
        const customCampaign: CampaignIdea = {
            id: 'custom',
            name: 'Custom Campaign',
            description: customCampaignPrompt,
            channels: ['Social Media', 'Ads']
        };
        
        // Generate image for custom campaign
        try {
            customCampaign.imageUrl = await generateCampaignImage(customCampaign);
        } catch (e) {
            console.error('Custom campaign image error:', e);
        }
        
        handleSelectCampaign(customCampaign);
    };

    const handleRefine = () => {
        if (selectedCampaign && refinePrompt) {
            handleSelectCampaign(selectedCampaign, refinePrompt);
            setRefinePrompt('');
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

    const handleDeleteAsset = (index: number, type: 'social' | 'ad') => {
        setAssets(assets => {
            if (!assets) return null;
            
            if (type === 'social') {
                return {
                    ...assets,
                    social_posts: assets.social_posts.filter((_, i) => i !== index)
                };
            } else {
                return {
                    ...assets,
                    ad_copy: assets.ad_copy.filter((_, i) => i !== index)
                };
            }
        });
    };

    const handleDownloadAsset = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleRegenerateImage = async (index: number, type: 'social' | 'ad') => {
        if (!assets || !selectedCampaign) return;
        
        const item = type === 'social' ? assets.social_posts[index] : assets.ad_copy[index];
        const itemId = item.id;
        setGeneratingImageFor(itemId || '');
        
        try {
            const description = type === 'social' 
                ? (item as SocialPostAsset).visual_suggestion 
                : `${(item as AdCopyAsset).headline} - ${(item as AdCopyAsset).description}`;
            
            const imageUrl = await generateBrandedImage(description, type === 'social' ? '1:1' : '4:3');
            
            setAssets(assets => {
                if (!assets) return null;
                
                if (type === 'social') {
                    const newPosts = [...assets.social_posts];
                    newPosts[index] = { ...newPosts[index], imageUrl };
                    return { ...assets, social_posts: newPosts };
                } else {
                    const newAds = [...assets.ad_copy];
                    newAds[index] = { ...newAds[index], imageUrl };
                    return { ...assets, ad_copy: newAds };
                }
            });
        } catch (error) {
            console.error('Failed to generate image:', error);
        } finally {
            setGeneratingImageFor(null);
        }
    };

    const handleDownloadAllAssets = () => {
        if (!assets || !selectedCampaign) return;
        
        let content = `CAMPAIGN: ${selectedCampaign.name}\n`;
        content += `Description: ${selectedCampaign.description}\n\n`;
        content += `=== SOCIAL MEDIA POSTS ===\n\n`;
        
        assets.social_posts.forEach((post, i) => {
            content += `${i + 1}. ${post.platform}\n`;
            content += `${post.copy}\n`;
            content += `Visual: ${post.visual_suggestion}\n\n`;
        });
        
        content += `\n=== AD COPY ===\n\n`;
        assets.ad_copy.forEach((ad, i) => {
            content += `${i + 1}. ${ad.headline}\n`;
            content += `${ad.description}\n`;
            content += `CTA: ${ad.cta}\n\n`;
        });
        
        handleDownloadAsset(content, `${selectedCampaign.name.replace(/\s+/g, '_')}_assets.txt`);
    };

    // 1. BLOCKING STATE: If profile is not locked, we must stop and ask the user to confirm DNA.
    if (!isProfileLocked) {
        return (
            <div className="h-full flex items-center justify-center text-center p-8 bg-gradient-to-br from-brand-darker to-brand-dark">
                <div className="bg-brand-card p-8 rounded-2xl max-w-lg shadow-xl border border-brand-border">
                    <LockClosedIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <h2 className="text-2xl font-bold text-brand-text mb-2">Profile Confirmation Required</h2>
                    <p className="text-sm text-brand-text-muted mb-6">
                        Before JetCreate can generate on-brand campaigns, you must verify your **Logo and Brand Colors** 
                        and click **"Lock Profile"** in your Business Details.
                    </p>

                    <button
                        onClick={() => {
                            const businessDetailsTool = Object.values(ALL_TOOLS).find(t => t.id === 'businessdetails');
                            if (businessDetailsTool) setActiveTool(businessDetailsTool);
                        }}
                        className="w-full bg-gradient-to-r from-accent-purple via-accent-pink to-accent-blue hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        Review & Lock Profile
                    </button>
                    
                    <div className="mt-6 p-4 bg-brand-light rounded-lg text-left text-xs text-brand-text-muted">
                        <p className="font-semibold text-brand-text mb-2 flex items-center gap-2">
                            <SparklesIcon className="w-3 h-3 text-accent-purple" />
                            Why is this required?
                        </p>
                        <p>
                            To ensure your campaigns use your specific color scheme and logo, we need you to 
                            officially approve the extracted Brand DNA. This prevents generic AI results.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // 2. BLOCKING STATE: If DNA extraction was somehow skipped but profile is locked.
    if (!profileData.brandDnaProfile) {
        return (
            <div className="h-full flex items-center justify-center text-center p-8 bg-gradient-to-br from-brand-darker to-brand-dark">
                <div className="bg-brand-card p-8 rounded-2xl max-w-lg shadow-xl border border-brand-border">
                    <SparklesIcon className="w-16 h-16 mx-auto mb-4 text-accent-purple" />
                    <h2 className="text-2xl font-bold text-brand-text mb-2">Business DNA Required</h2>
                    <p className="text-sm text-brand-text-muted mb-6">
                        JetCreate uses your Business DNA to generate perfectly on-brand campaigns.
                        Complete your Business Details to unlock this tool.
                    </p>

                    <button
                        onClick={() => {
                            const businessDetailsTool = Object.values(ALL_TOOLS).find(t => t.id === 'businessdetails');
                            if (businessDetailsTool) setActiveTool(businessDetailsTool);
                        }}
                        className="w-full bg-gradient-to-r from-accent-purple via-accent-pink to-accent-blue hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        Complete Business Details
                    </button>
                </div>
            </div>
        );
    }

    // 3. PRE-GENERATION STATE: Show explanation and button before generating
    if (!hasStartedGeneration && campaignIdeas.length === 0) {
        return (
            <div className="h-full flex items-center justify-center p-8 bg-gradient-to-br from-brand-darker to-brand-dark">
                <div className="bg-brand-card p-8 rounded-2xl max-w-2xl w-full shadow-xl border border-brand-border">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-accent-purple/20 to-accent-pink/20 mb-4">
                            <SparklesIcon className="w-10 h-10 text-accent-purple" />
                        </div>
                        <h1 className="text-3xl font-bold text-brand-text mb-2">Campaign Idea Generator</h1>
                        <p className="text-brand-text-muted">
                            Create AI-powered marketing campaigns tailored to your brand
                        </p>
                    </div>

                    {/* Feature Explanation and How-To Sections (Stacked) */}
                    <div className="grid grid-cols-1 gap-6">
                        {/* Feature Explanation */}
                        <div className="bg-brand-light rounded-xl p-6 border border-brand-border">
                            <h3 className="font-bold text-brand-text mb-4 flex items-center gap-2">
                                <InformationCircleIcon className="w-5 h-5 text-accent-blue" />
                                What this feature does
                            </h3>
                            <div className="space-y-4 text-sm text-brand-text-muted">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-accent-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-bold text-accent-purple">1</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-brand-text">AI-Generated Campaign Ideas</p>
                                        <p>Using your Business DNA, our AI creates unique marketing campaign concepts tailored to your brand identity, industry, and target audience.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-accent-pink/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-bold text-accent-pink">2</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-brand-text">Ready-to-Use Creative Assets</p>
                                        <p>For each campaign, get social media posts and ad copy optimized for platforms like Instagram, Facebook, LinkedIn, and more.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-bold text-accent-blue">3</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-brand-text">Branded Imagery</p>
                                        <p>Generate custom campaign images that incorporate your logo and brand colors for a cohesive visual identity.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-bold text-green-600">4</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-brand-text">Schedule & Post</p>
                                        <p>Once you're happy with your content, schedule it directly to your connected social media accounts or download for later use.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* How to Use */}
                        <div className="bg-gradient-to-r from-accent-purple/5 to-accent-pink/5 rounded-xl p-6 border border-accent-purple/20">
                            <h3 className="font-bold text-brand-text mb-3">How to use</h3>
                            <ol className="space-y-2 text-sm text-brand-text-muted list-decimal list-inside">
                                <li>Click the button below to generate campaign ideas based on your business</li>
                                <li>Select a campaign idea or create your own custom campaign</li>
                                <li>Review and edit the generated social posts and ad copy</li>
                                <li>Generate branded images for your assets</li>
                                <li>Schedule posts to your social accounts or download them</li>
                            </ol>
                        </div>
                    </div>

                    {/* Business DNA Status */}
                    <div className="flex items-center justify-center gap-2 mb-6 text-sm mt-6">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-brand-text-muted">
                            Using <span className="font-semibold text-brand-text">{profileData.business.business_name}</span> Brand DNA
                        </span>
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={handleStartGeneration}
                        className="w-full bg-gradient-to-r from-accent-purple via-accent-pink to-accent-blue hover:opacity-90 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg"
                    >
                        <SparklesIcon className="w-6 h-6" />
                        Generate Campaign Ideas
                    </button>

                    <p className="text-center text-xs text-brand-text-muted mt-4">
                        This process may take a few minutes as we craft personalized campaigns for your business.
                    </p>
                </div>
            </div>
        );
    }

    // 4. LOADING STATE
    if (isLoadingCampaigns) {
        return (
            <AnalysisLoadingState 
                title="Generating Campaign Ideas"
                message="Our AI is brainstorming on-brand campaign ideas based on your Business DNA. This can take up to 5 minutes."
                durationEstimateSeconds={300}
            />
        );
    }
    
    if (isLoadingAssets) {
        return (
            <AnalysisLoadingState 
                title="Generating Creative Assets"
                message="Drafting social posts, ad copy, and visual suggestions for your selected campaign. This can take up to 5 minutes."
                durationEstimateSeconds={300}
            />
        );
    }

    return (
        <div className="h-full w-full bg-brand-darker flex flex-col">
            {scheduleSuccess && (
                <div className="fixed top-20 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all animate-in fade-in slide-in-from-top-4">
                    {scheduleSuccess}
                </div>
            )}
            {schedulingAsset && (
                <ScheduleModal
                    asset={schedulingAsset}
                    connections={connections}
                    userId={profileData.user.id}
                    onClose={() => setSchedulingAsset(null)}
                    onSuccess={(message) => {
                        setScheduleSuccess(message);
                        setTimeout(() => setScheduleSuccess(''), 3000);
                    }}
                />
            )}
            
            {/* How To Use Instructions */}
            {showHowTo && (
                <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Select a campaign idea from the left panel or create a custom prompt.</li>
                        <li>The AI generates social posts and ad copy based on your Brand DNA.</li>
                        <li>Use the <ArrowPathIcon className="w-4 h-4 inline-block" /> icon to regenerate text or the <PhotoIcon className="w-4 h-4 inline-block" /> icon to generate images for individual assets.</li>
                        <li>Use the <CalendarDaysIcon className="w-4 h-4 inline-block" /> icon to schedule posts to your social media calendar.</li>
                        <li>Download campaign images using the <ArrowDownTrayIcon className="w-4 h-4 inline-block" /> icon.</li>
                    </ul>
                </HowToUse>
            )}

            {/* Header with Back Button */}
            <header className="bg-brand-card border-b border-brand-border px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setActiveTool(null)}
                        className="flex items-center gap-2 text-brand-text-muted hover:text-brand-text transition-colors group"
                    >
                        <ChevronLeftIcon className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        <span className="font-medium">Dashboard</span>
                    </button>
                    <div className="h-6 w-px bg-brand-border"></div>
                    <div>
                        <h1 className="text-xl font-bold text-brand-text">JetCreate</h1>
                        <p className="text-xs text-brand-text-muted">
                            AI-powered campaign creation
                        </p>
                        <p className="text-xs text-brand-text-muted">
                            Replaces: <span className="text-accent-purple font-semibold">Graphic Designer ($1,000-3,000/mo)</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-brand-text-muted">
                    <div className="w-2 h-2 rounded-full bg-accent-purple animate-pulse"></div>
                    <span>Using {profileData.business.business_name} Brand DNA</span>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
                {/* Left Panel: Campaign Ideas */}
                <aside className="w-full lg:w-80 lg:flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
                    <div className="bg-brand-card rounded-xl p-4 border border-brand-border shadow-sm flex-shrink-0">
                        <h2 className="font-bold text-lg text-brand-text mb-1">Campaign Ideas</h2>
                        <p className="text-xs text-brand-text-muted mb-4">Generated for your business</p>
                        
                        <div className="space-y-3 pr-1">
                            {campaignIdeas.map(idea => (
                                    <button 
                                        key={idea.id} 
                                        onClick={() => handleSelectCampaign(idea)} 
                                        className={`w-full text-left rounded-lg border-2 transition-all overflow-hidden glow-card glow-card-rounded-lg group relative ${
                                            selectedCampaign?.id === idea.id 
                                                ? 'bg-gradient-to-br from-accent-purple/10 to-accent-pink/10 border-accent-purple shadow-lg' 
                                                : 'bg-brand-light border-brand-border hover:border-accent-purple/50'
                                        }`}
                                    >
                                        {idea.imageUrl && (
                                            <div className="w-full h-32 overflow-hidden bg-slate-100 relative">
                                                <img 
                                                    src={idea.imageUrl} 
                                                    alt={idea.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                {/* Download Button Overlay */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent selecting campaign
                                                        handleDownloadImage(idea.imageUrl!, `${idea.name.replace(/\s+/g, '_')}_preview.png`);
                                                    }}
                                                    className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/70"
                                                    title="Download Campaign Image"
                                                >
                                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        <div className="p-3">
                                            <h3 className="font-semibold text-sm text-brand-text mb-1">{idea.name}</h3>
                                            <p className="text-xs text-brand-text-muted line-clamp-2">{idea.description}</p>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {idea.channels.map(ch => (
                                                    <span key={ch} className="text-[10px] bg-accent-purple/10 text-accent-purple px-2 py-0.5 rounded-full font-medium">
                                                        {ch}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            }
                        </div>
                    </div>

                    {/* Custom Campaign Input */}
                    <div className="bg-brand-card rounded-xl p-4 border border-brand-border shadow-sm flex-shrink-0">
                        <h3 className="font-semibold text-sm text-brand-text mb-2">Custom Campaign</h3>
                        <textarea 
                            value={customCampaignPrompt} 
                            onChange={e => setCustomCampaignPrompt(e.target.value)} 
                            rows={3} 
                            placeholder="Describe your campaign idea..." 
                            className="w-full bg-brand-light border border-brand-border rounded-lg p-2 text-sm text-brand-text placeholder:text-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent resize-none"
                        />
                        <button 
                            onClick={handleCustomCampaign} 
                            disabled={!customCampaignPrompt.trim()}
                            className="w-full mt-2 bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold py-2 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <SparklesIcon className="w-4 h-4" />
                            Generate Campaign
                        </button>
                    </div>
                </aside>

                {/* Main Panel: Creative Assets */}
                <main className="flex-1 bg-brand-card rounded-xl border border-brand-border shadow-sm flex flex-col overflow-hidden">
                    {!selectedCampaign ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-brand-text-muted">
                            <SparklesIcon className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Select a campaign to get started</p>
                            <p className="text-sm mt-2">Choose from the ideas on the left, or create your own</p>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex items-center justify-center text-center p-8">
                            <div>
                                <p className="text-red-500 mb-4">{error}</p>
                                <button
                                    onClick={() => handleSelectCampaign(selectedCampaign)}
                                    className="bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    ) : assets ? (
                        <>
                            {/* Asset Header */}
                            <header className="p-6 border-b border-brand-border flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gradient-to-r from-brand-light/50 to-transparent">
                                <div>
                                    <h1 className="text-2xl font-bold text-brand-text">{selectedCampaign.name}</h1>
                                    <p className="text-sm text-brand-text-muted mt-1">{selectedCampaign.description}</p>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <input 
                                        type="text" 
                                        value={refinePrompt} 
                                        onChange={e => setRefinePrompt(e.target.value)} 
                                        placeholder="Refine: e.g., more formal..." 
                                        className="flex-1 sm:w-64 bg-brand-light border border-brand-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent-purple focus:border-transparent"
                                    />
                                    <button 
                                        onClick={handleRefine} 
                                        disabled={!refinePrompt.trim()}
                                        title="Regenerate with refinement" 
                                        className="p-2 bg-brand-light border border-brand-border rounded-lg hover:bg-accent-purple hover:text-white hover:border-accent-purple transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ArrowPathIcon className="w-5 h-5"/>
                                    </button>
                                    <button 
                                        onClick={handleDownloadAllAssets}
                                        title="Download all assets" 
                                        className="p-2 bg-brand-light border border-brand-border rounded-lg hover:bg-accent-blue hover:text-white hover:border-accent-blue transition-all"
                                    >
                                        <ArrowDownTrayIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </header>

                            {/* Assets Grid */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Social Posts */}
                                    <div className="space-y-4">
                                        <h2 className="font-bold text-lg text-brand-text flex items-center gap-2">
                                            <SparklesIcon className="w-5 h-5 text-accent-purple" />
                                            Social Media Posts
                                        </h2>
                                        {assets.social_posts.map((post, i) => (
                                            <div key={post.id || i} className="bg-brand-light rounded-lg p-4 border border-brand-border hover:border-accent-purple/50 transition-colors group">
                                                {/* Action Bar */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <label className="text-xs font-semibold text-brand-text-muted uppercase tracking-wide">
                                                        {post.platform}
                                                    </label>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setSchedulingAsset(post)} title="Schedule post" className="p-1.5 rounded hover:bg-green-500 hover:text-white transition-colors"><CalendarDaysIcon className="w-4 h-4" /></button>
                                                        <button onClick={() => handleRegenerateImage(i, 'social')} disabled={generatingImageFor === post.id} title="Generate image" className="p-1.5 rounded hover:bg-accent-purple hover:text-white transition-colors disabled:opacity-50">{generatingImageFor === post.id ? (<div className="w-4 h-4"><Loader /></div>) : (<PhotoIcon className="w-4 h-4" />)}</button>
                                                        <button onClick={() => handleDownloadAsset(post.copy, `${post.platform}_post.txt`)} title="Download" className="p-1.5 rounded hover:bg-accent-blue hover:text-white transition-colors"><ArrowDownTrayIcon className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDeleteAsset(i, 'social')} title="Delete" className="p-1.5 rounded hover:bg-red-500 hover:text-white transition-colors"><TrashIcon className="w-4 h-4" /></button>
                                                    </div>
                                                </div>

                                                {/* Image Preview */}
                                                {post.imageUrl && (
                                                    <div className="mb-3 rounded-lg overflow-hidden bg-slate-200 aspect-square">
                                                        <img src={post.imageUrl} alt={`${post.platform} post`} className="w-full h-full object-cover" />
                                                    </div>
                                                )}

                                                {/* Editable Copy */}
                                                <textarea 
                                                    value={post.copy} 
                                                    onChange={e => handleAssetChange(i, 'copy', e.target.value, 'social')} 
                                                    rows={4} 
                                                    className="w-full bg-white border border-brand-border rounded-lg p-3 text-sm text-brand-text focus:ring-2 focus:ring-accent-purple focus:border-transparent resize-none"
                                                />
                                                
                                                <div className="mt-3 p-2 bg-accent-blue/5 rounded border-l-2 border-accent-blue">
                                                    <p className="text-xs text-brand-text-muted">
                                                        <strong className="text-accent-blue">Visual Suggestion:</strong> {post.visual_suggestion}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Ad Copy */}
                                    <div className="space-y-4">
                                        <h2 className="font-bold text-lg text-brand-text flex items-center gap-2">
                                            <SparklesIcon className="w-5 h-5 text-accent-pink" />
                                            Ad Copy
                                        </h2>
                                        {assets.ad_copy.map((ad, i) => (
                                            <div key={ad.id || i} className="bg-brand-light rounded-lg p-4 border border-brand-border hover:border-accent-pink/50 transition-colors group">
                                                {/* Action Bar */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <label className="text-xs font-semibold text-brand-text-muted uppercase tracking-wide">
                                                        Ad Variant {i + 1}
                                                    </label>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setSchedulingAsset(ad)} title="Schedule post" className="p-1.5 rounded hover:bg-green-500 hover:text-white transition-colors"><CalendarDaysIcon className="w-4 h-4" /></button>
                                                        <button onClick={() => handleRegenerateImage(i, 'ad')} disabled={generatingImageFor === ad.id} title="Generate image" className="p-1.5 rounded hover:bg-accent-purple hover:text-white transition-colors disabled:opacity-50">{generatingImageFor === ad.id ? (<div className="w-4 h-4"><Loader /></div>) : (<PhotoIcon className="w-4 h-4" />)}</button>
                                                        <button onClick={() => handleDownloadAsset(`${ad.headline}\n\n${ad.description}\n\nCTA: ${ad.cta}`, `ad_${i + 1}.txt`)} title="Download" className="p-1.5 rounded hover:bg-accent-blue hover:text-white transition-colors"><ArrowDownTrayIcon className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDeleteAsset(i, 'ad')} title="Delete" className="p-1.5 rounded hover:bg-red-500 hover:text-white transition-colors"><TrashIcon className="w-4 h-4" /></button>
                                                    </div>
                                                </div>

                                                {/* Image Preview */}
                                                {ad.imageUrl && (
                                                    <div className="mb-3 rounded-lg overflow-hidden bg-slate-200 aspect-video">
                                                        <img src={ad.imageUrl} alt={`Ad ${i + 1}`} className="w-full h-full object-cover" />
                                                    </div>
                                                )}

                                                {/* Editable Fields */}
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-xs font-semibold text-brand-text-muted block mb-1">Headline</label>
                                                        <input 
                                                            type="text" 
                                                            value={ad.headline} 
                                                            onChange={e => handleAssetChange(i, 'headline', e.target.value, 'ad')} 
                                                            className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 font-semibold text-brand-text focus:ring-2 focus:ring-accent-pink focus:border-transparent"
                                                        />
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="text-xs font-semibold text-brand-text-muted block mb-1">Description</label>
                                                        <textarea 
                                                            value={ad.description} 
                                                            onChange={e => handleAssetChange(i, 'description', e.target.value, 'ad')} 
                                                            rows={3} 
                                                            className="w-full bg-white border border-brand-border rounded-lg p-3 text-sm text-brand-text focus:ring-2 focus:ring-accent-pink focus:border-transparent resize-none"
                                                        />
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="text-xs font-semibold text-brand-text-muted block mb-1">Call to Action</label>
                                                        <input 
                                                            type="text" 
                                                            value={ad.cta} 
                                                            onChange={e => handleAssetChange(i, 'cta', e.target.value, 'ad')} 
                                                            className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 font-semibold text-accent-pink focus:ring-2 focus:ring-accent-pink focus:border-transparent"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : null}
                </main>
            </div>
        </div>
    );
};