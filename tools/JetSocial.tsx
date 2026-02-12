import React, { useState, useEffect } from 'react';
import type { Tool, ProfileData, SocialConnection } from '../types';
import { generateSocialPosts, generateImage } from '../services/geminiService';
import { getSocialConnections, createScheduledPost, verifyConnectionsOnLogin, PLATFORM_INFO } from '../services/socialMediaService';
import { Loader } from '../components/Loader';
import { HowToUse } from '../components/HowToUse';
import { InformationCircleIcon } from '../components/icons/MiniIcons';
import { SocialConnectionsManager } from '../components/SocialConnectionsManager';
import { SevenDayPlanner } from '../components/SevenDayPlanner';
import { SharePostModal } from '../components/SharePostModal';
import { TOOLS } from '../constants';
import { getTomorrowDate, getMinDate, getMaxDate } from '../utils/dateTimeUtils';
import { AnalysisLoadingState } from '../components/AnalysisLoadingState';

interface JetSocialProps {
  tool: Tool;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null) => void;
}

interface PostIdea {
    platform: string;
    post_text: string;
    hashtags: string;
    visual_suggestion: string;
}

interface GeneratedPost {
    platform: string;
    post_text: string;
    hashtags: string;
    visual_suggestion: string;
    generated_image?: string;
}

const socialPlatforms = ['Facebook', 'Instagram', 'X (Twitter)', 'LinkedIn', 'TikTok', 'Google Business Profile', 'WhatsApp', 'Telegram'];

const platformDetails: { [key: string]: { aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9", postUrl: string } } = {
    'Facebook': { aspectRatio: '1:1', postUrl: 'https://www.facebook.com/sharer/sharer.php?u=' },
    'Instagram': { aspectRatio: '1:1', postUrl: 'https://www.instagram.com' },
    'X (Twitter)': { aspectRatio: '16:9', postUrl: 'https://twitter.com/intent/tweet?text=' },
    'LinkedIn': { aspectRatio: '16:9', postUrl: 'https://www.linkedin.com/sharing/share-offsite/?url=' },
    'TikTok': { aspectRatio: '9:16', postUrl: 'https://www.tiktok.com/upload' },
    'Google Business Profile': { aspectRatio: '4:3', postUrl: 'https://business.google.com/posts' },
    'WhatsApp': { aspectRatio: '1:1', postUrl: 'https://wa.me/?text=' },
    'Telegram': { aspectRatio: '1:1', postUrl: 'https://t.me/share/url?url=&text=' },
};

// Map display names to internal platform IDs
const platformNameToPlatformId: { [key: string]: string } = {
  'Facebook': 'facebook',
  'Instagram': 'instagram',
  'X (Twitter)': 'twitter',
  'LinkedIn': 'linkedin',
  'TikTok': 'tiktok',
  'Google Business Profile': 'google_business',
  'WhatsApp': 'whatsapp',
  'Telegram': 'telegram',
};

type ViewMode = 'generate' | 'planner' | 'connections';
type WorkflowStage = 'input' | 'ideas' | 'final';
type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

// Auto safe-zones per platform (percentage of image width used as padding)
const PLATFORM_SAFE_ZONE: Record<string, number> = {
  'Facebook': 0.10,
  'Instagram': 0.12,
  'X (Twitter)': 0.06,
  'LinkedIn': 0.08,
  'TikTok': 0.18,
  'Google Business Profile': 0.10,
  'WhatsApp': 0.10,
  'Telegram': 0.10,
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const getLuminance01 = (r: number, g: number, b: number) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

/**
 * Sample the average brightness of a rectangle on the base image.
 * Returns 0 (dark) -> 1 (bright).
 */
const sampleBrightness = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  const sx = Math.floor(clamp(x, 0, ctx.canvas.width - 1));
  const sy = Math.floor(clamp(y, 0, ctx.canvas.height - 1));
  const sw = Math.floor(clamp(w, 1, ctx.canvas.width - sx));
  const sh = Math.floor(clamp(h, 1, ctx.canvas.height - sy));

  const img = ctx.getImageData(sx, sy, sw, sh).data;
  let total = 0;
  const pxCount = img.length / 4;

  // Lightweight sampling: stride every ~8 pixels for speed on large images
  const stride = Math.max(1, Math.floor(pxCount / 2000));

  for (let i = 0; i < img.length; i += 4 * stride) {
    total += getLuminance01(img[i], img[i + 1], img[i + 2]);
  }

  return total / Math.ceil(pxCount / stride);
};

const normalizeLogoSrc = (logoBase64: string) => {
  if (!logoBase64) return '';
  return logoBase64.startsWith('data:image') ? logoBase64 : `data:image/png;base64,${logoBase64}`;
};

/**
 * Create a monochrome (white or black) logo canvas while preserving alpha.
 */
const makeMonoLogoCanvas = (logoImg: HTMLImageElement, target: 'white' | 'black') => {
  const c = document.createElement('canvas');
  c.width = logoImg.width;
  c.height = logoImg.height;
  const cctx = c.getContext('2d')!;
  cctx.drawImage(logoImg, 0, 0);

  const imgData = cctx.getImageData(0, 0, c.width, c.height);
  const d = imgData.data;
  const v = target === 'white' ? 255 : 0;

  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a === 0) continue;
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
  }

  cctx.putImageData(imgData, 0, 0);
  return c;
};

const calcLogoRect = (canvasW: number, canvasH: number, platform: string, position: LogoPosition) => {
  const safePct = PLATFORM_SAFE_ZONE[platform] ?? 0.10;
  const pad = canvasW * safePct;

  // logo size tuned for social posts: ~18% of width
  const size = canvasW * 0.18;
  let x = pad;
  let y = pad;

  if (position.includes('right')) x = canvasW - size - pad;
  if (position.includes('bottom')) y = canvasH - size - pad;

  if (position === 'center') {
    x = canvasW / 2 - size / 2;
    y = canvasH / 2 - size / 2;
  }

  return { x, y, size, pad };
};

const composeImageWithLogo = async (
  baseImageDataUrl: string,
  logoBase64: string,
  platform: string,
  position: LogoPosition
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas is not supported in this browser.'));
      return;
    }

    const bg = new Image();
    const logo = new Image();

    bg.onload = () => {
      canvas.width = bg.width;
      canvas.height = bg.height;
      ctx.drawImage(bg, 0, 0);

      const { x, y, size } = calcLogoRect(canvas.width, canvas.height, platform, position);

      // Determine whether we should use a white or black logo based on the area where it will sit
      const brightness = sampleBrightness(ctx, x, y, size, size);
      const target: 'white' | 'black' = brightness < 0.55 ? 'white' : 'black';

      logo.onload = () => {
        const monoLogo = makeMonoLogoCanvas(logo, target);

        ctx.save();
        ctx.globalAlpha = position === 'center' ? 0.35 : 1;

        // Soft shadow behind logo to help on busy backgrounds
        ctx.shadowColor = target === 'white' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)';
        ctx.shadowBlur = Math.max(2, canvas.width * 0.004);

        ctx.drawImage(monoLogo, x, y, size, size);

        ctx.restore();
        resolve(canvas.toDataURL('image/png'));
      };

      logo.onerror = () => reject(new Error('Failed to load logo image.'));
      logo.src = normalizeLogoSrc(logoBase64);
    };

    bg.onerror = () => reject(new Error('Failed to load base image.'));
    bg.src = baseImageDataUrl;
  });
};


export const JetSocial: React.FC<JetSocialProps> = ({ tool, profileData, setActiveTool }) => {
  const { industry: businessType } = profileData.business;

  // Business DNA logo (base64)
  const businessLogoBase64 = profileData.business?.dna?.logo || '';

  // Logo overlay controls
  const [useLogoOverlay, setUseLogoOverlay] = useState(false);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('bottom-right');
  const [originalGeneratedImage, setOriginalGeneratedImage] = useState<string | null>(null);
  const [composingLogo, setComposingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  
  // Get userId directly from profileData (more reliable than localStorage)
  const userId = profileData.user.id;

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('generate');
  
  // Workflow state
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>('input');
  
  // Generate posts state
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Friendly');
  const [postIdeas, setPostIdeas] = useState<PostIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<PostIdea | null>(null);
  const [finalPost, setFinalPost] = useState<GeneratedPost | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Facebook']);
  const [copySuccess, setCopySuccess] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);
  
  // Social connections state
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  
  // Schedule post state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [scheduling, setScheduling] = useState(false);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (userId) {
      loadConnections();
    }
  }, [userId]);

  const loadConnections = async () => {
    try {
      setConnectionsLoading(true);
      // Verify and auto-refresh expired tokens on load
      const data = await verifyConnectionsOnLogin(userId);
      setConnections(data);
    } catch (err) {
      console.error('Error loading connections:', err);
    } finally {
      setConnectionsLoading(false);
    }
  };

  const handlePlatformChange = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  // STAGE 1: Generate 3 post ideas
  const handleGenerateIdeas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) {
      setError('Please fill out the Topic/Offer.');
      return;
    }
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one social media platform.');
      return;
    }
    
    setError('');
    setLoading(true);
    setPostIdeas([]);
    
    try {
      // Single call requesting exactly 3 unique ideas across selected platforms
      const result = await generateSocialPosts(businessType, topic, tone, selectedPlatforms, 3);

      const allPosts: PostIdea[] = (result.posts || []).map((post: any) => ({
        platform: post.platform,
        post_text: post.post_text,
        hashtags: post.hashtags,
        visual_suggestion: post.visual_suggestion,
      }));

      // Take the first 3 unique ideas (by post_text) — never duplicate
      const seen = new Set<string>();
      const uniqueIdeas: PostIdea[] = [];
      for (const idea of allPosts) {
        const key = idea.post_text.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueIdeas.push(idea);
        }
        if (uniqueIdeas.length >= 3) break;
      }

      setPostIdeas(uniqueIdeas);
      setWorkflowStage('ideas');
    } catch (err) {
      setError('Failed to generate ideas. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // STAGE 2: User selects an idea and we generate the full post with image
  const handleSelectIdea = async (idea: PostIdea) => {
    setSelectedIdea(idea);
    setGeneratingImage(true);
    setError('');
    
    try {
      const aspectRatio = platformDetails[idea.platform].aspectRatio;
      const base64Data = await generateImage(idea.visual_suggestion, '1K', aspectRatio);
      const imageUrl = `data:image/png;base64,${base64Data}`;

      // Reset logo overlay state for this new image
      setOriginalGeneratedImage(imageUrl);
      setUseLogoOverlay(false);
      setLogoPosition('bottom-right');
      setLogoError('');
      
      setFinalPost({
        ...idea,
        generated_image: imageUrl
      });
      setWorkflowStage('final');
    } catch (err: any) {
      console.error(err);
      setError(`Failed to generate image. Please try again.`);
    } finally {
      setGeneratingImage(false);
    }
  };


  const applyLogoOverlay = async (position: LogoPosition) => {
    if (!finalPost?.generated_image) return;
    if (!businessLogoBase64) {
      setLogoError('No logo found in your Business DNA. Please add one in Business Details.');
      return;
    }
  
    const baseImage = originalGeneratedImage || finalPost.generated_image;
  
    try {
      setComposingLogo(true);
      setLogoError('');
      const composed = await composeImageWithLogo(baseImage, businessLogoBase64, finalPost.platform, position);
  
      setFinalPost(prev => (prev ? { ...prev, generated_image: composed } : prev));
    } catch (err: any) {
      console.error(err);
      setLogoError('Failed to apply your logo. Please try again.');
    } finally {
      setComposingLogo(false);
    }
  };
  
  const handleToggleLogoOverlay = async (checked: boolean) => {
    setUseLogoOverlay(checked);
  
    if (!finalPost) return;
  
    if (!checked) {
      // Restore original
      if (originalGeneratedImage) {
        setFinalPost(prev => (prev ? { ...prev, generated_image: originalGeneratedImage } : prev));
      }
      return;
    }
  
    // Ensure we preserve a pristine copy
    if (!originalGeneratedImage && finalPost.generated_image) {
      setOriginalGeneratedImage(finalPost.generated_image);
    }
  
    await applyLogoOverlay(logoPosition);
  };
  
  const handleSelectLogoPosition = async (position: LogoPosition) => {
    setLogoPosition(position);
    if (!useLogoOverlay) return;
    await applyLogoOverlay(position);
  };

  const handleStartOver = () => {
    setWorkflowStage('input');
    setPostIdeas([]);
    setSelectedIdea(null);
    setFinalPost(null);
    setTopic('');
    setError('');

    // Reset logo overlay state
    setUseLogoOverlay(false);
    setLogoPosition('bottom-right');
    setOriginalGeneratedImage(null);
    setComposingLogo(false);
    setLogoError('');
  };

  const handleCopyAndPost = (platform: string, text: string, hashtags: string) => {
    const fullText = `${text}\n\n${hashtags}`;
    navigator.clipboard.writeText(fullText.trim());
    setCopySuccess(`Content copied to clipboard!`);
    setTimeout(() => setCopySuccess(''), 2000);

    if (platform === 'WhatsApp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(fullText.trim())}`, '_blank', 'noopener,noreferrer');
      return;
    }
    if (platform === 'Telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(' ')}&text=${encodeURIComponent(fullText.trim())}`, '_blank', 'noopener,noreferrer');
      return;
    }

    const postUrl = platformDetails[platform].postUrl;
    if (platform === 'X (Twitter)' || platform === 'Facebook' || platform === 'LinkedIn') {
      window.open(postUrl + encodeURIComponent(fullText.trim()), '_blank');
    } else {
      window.open(postUrl, '_blank');
    }
  };

  const handleSchedulePost = () => {
    setScheduledDate(getTomorrowDate());
    setShowScheduleModal(true);
  };

  const confirmSchedulePost = async () => {
    if (!finalPost || !scheduledDate || !userId) {
      setError('Please select a date to schedule the post');
      return;
    }

    const platformId = platformNameToPlatformId[finalPost.platform];
    const platformConnections = connections.filter(c => c.platform === platformId);

    if (platformConnections.length === 0) {
      setError(`Please connect your ${finalPost.platform} account first`);
      setShowScheduleModal(false);
      setViewMode('connections');
      return;
    }

    try {
      setScheduling(true);
      setError('');

      const platformTargets = platformConnections.map(conn => ({
        platform: conn.platform,
        connection_id: conn.id,
      }));

      await createScheduledPost(userId, {
        post_text: finalPost.post_text,
        hashtags: finalPost.hashtags,
        visual_suggestion: finalPost.visual_suggestion,
        image_url: finalPost.generated_image,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        timezone: 'America/New_York',
        platforms: platformTargets,
        status: 'scheduled',
      });

      setCopySuccess('Post scheduled successfully!');
      setTimeout(() => setCopySuccess(''), 3000);
      setShowScheduleModal(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setScheduling(false);
    }
  };

  const handleDownloadText = () => {
    if (!finalPost) return;
    
    const content = `${finalPost.platform} Post

${finalPost.post_text}

${finalPost.hashtags}

---
Visual: ${finalPost.visual_suggestion}
---

Generated by JetSuite - ${new Date().toLocaleDateString()}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${finalPost.platform}_Post_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setCopySuccess(`Post text downloaded!`);
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const handleDownloadImage = () => {
    if (!finalPost || !finalPost.generated_image) return;

    const link = document.createElement('a');
    link.href = finalPost.generated_image;
    link.download = `${finalPost.platform}_Image_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setCopySuccess(`Image downloaded!`);
    setTimeout(() => setCopySuccess(''), 2000);
  };

  if (!businessType) {
    return (
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg text-center">
        <InformationCircleIcon className="w-12 h-12 mx-auto text-accent-blue" />
        <h2 className="text-2xl font-bold text-brand-text mt-4">Set Your Business Category</h2>
        <p className="text-brand-text-muted my-4 max-w-md mx-auto">
          Please add a category to your business profile (e.g., "Coffee Shop") to generate relevant social media posts.
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

  return (
    <div>
      {/* View Mode Tabs */}
      <div className="bg-brand-card p-2 rounded-xl shadow-lg mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('generate')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
              viewMode === 'generate'
                ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white'
                : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-light'
            }`}
          >
            ✍️ Generate Posts
          </button>
          <button
            onClick={() => setViewMode('planner')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
              viewMode === 'planner'
                ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white'
                : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-light'
            }`}
          >
            📅 7-Day Planner
          </button>
          <button
            onClick={() => setViewMode('connections')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
              viewMode === 'connections'
                ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white'
                : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-light'
            }`}
          >
            🔗 Connections {connections.length > 0 && `(${connections.length})`}
          </button>
        </div>
      </div>

      {/* Connections View */}
      {viewMode === 'connections' && userId && (
        <SocialConnectionsManager
          userId={userId}
          onConnectionsChange={loadConnections}
        />
      )}

      {/* Planner View */}
      {viewMode === 'planner' && userId && (
        <SevenDayPlanner
          userId={userId}
          connections={connections}
          onNeedConnections={() => setViewMode('connections')}
        />
      )}

      {/* Generate Posts View */}
      {viewMode === 'generate' && (
        <>
          {showHowTo && workflowStage === 'input' && (
            <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Enter a topic or offer for your post.</li>
                <li>Select the social media platforms you want to post on.</li>
                <li>Click 'Generate Post Ideas' to see 3 concepts.</li>
                <li>Choose your favorite idea - we'll generate the image for you.</li>
                <li>Schedule, download, or post immediately!</li>
              </ul>
            </HowToUse>
          )}

          {/* STAGE 1: Input Form */}
          {workflowStage === 'input' && (
            <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
              <p className="text-brand-text-muted mb-6">{tool.description}</p>
              
              <form onSubmit={handleGenerateIdeas}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text-muted flex items-center">
                    <span className="text-sm font-medium text-brand-text mr-2">Business Type:</span>
                    <span className="font-semibold text-brand-text">{businessType}</span>
                  </div>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Topic / Offer (e.g., New Fall Latte)"
                    className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-brand-text mb-2">Platforms</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {socialPlatforms.map(platform => (
                      <label
                        key={platform}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition ${
                          selectedPlatforms.includes(platform)
                            ? 'bg-accent-purple/10 border-accent-purple'
                            : 'bg-brand-light border-brand-border'
                        } border`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPlatforms.includes(platform)}
                          onChange={() => handlePlatformChange(platform)}
                          className="form-checkbox h-4 w-4 text-accent-purple rounded focus:ring-accent-purple/50"
                        />
                        <span className="text-brand-text text-sm font-medium">{platform}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="tone" className="block text-sm font-medium text-brand-text mb-2">Tone</label>
                  <select
                    id="tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
                  >
                    <option>Friendly</option>
                    <option>Professional</option>
                    <option>Urgent</option>
                    <option>Playful</option>
                    <option>Informative</option>
                  </select>
                </div>
                
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {loading ? 'Generating Ideas...' : '✨ Generate Post Ideas'}
                </button>
              </form>
            </div>
          )}

          {loading && (
            <AnalysisLoadingState 
              title="Generating Post Ideas"
              message="Our AI is creating 3 unique post concepts for you to choose from. This takes about 30 seconds."
              durationEstimateSeconds={30}
            />
          )}

          {/* STAGE 2: Show 3 Ideas */}
          {workflowStage === 'ideas' && postIdeas.length > 0 && (
            <div className="space-y-6">
              <div className="bg-brand-card p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-brand-text mb-2">Choose Your Favorite Idea</h2>
                <p className="text-brand-text-muted">Select one of these concepts and we'll generate the full post with image for you.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {postIdeas.map((idea, index) => (
                  <div key={index} className="bg-brand-card p-6 rounded-xl shadow-lg border-2 border-transparent hover:border-accent-purple transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-accent-purple">Idea #{index + 1}</h3>
                      <span className="text-sm font-semibold bg-accent-purple/10 text-accent-purple px-3 py-1 rounded-full">
                        {idea.platform}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-brand-text mb-2">Post Copy:</h4>
                      <p className="text-brand-text-muted text-sm line-clamp-4">{idea.post_text}</p>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-brand-text mb-2">Hashtags:</h4>
                      <p className="text-accent-cyan text-xs">{idea.hashtags}</p>
                    </div>
                    
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-brand-text mb-2">Image Concept:</h4>
                      <p className="text-brand-text-muted text-xs italic">
                        📷 {idea.visual_suggestion}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleSelectIdea(idea)}
                      disabled={generatingImage}
                      className="w-full bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-3 px-4 rounded-lg transition duration-300 hover:shadow-lg disabled:opacity-50"
                    >
                      {generatingImage ? 'Generating...' : '✅ Select This One'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleStartOver}
                  className="bg-slate-700 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  ← Start Over
                </button>
              </div>
            </div>
          )}

          {generatingImage && (
            <AnalysisLoadingState 
              title="Generating Your Image"
              message="Creating a professional image based on your selected concept. This takes about 20-30 seconds."
              durationEstimateSeconds={25}
            />
          )}

          {/* STAGE 3: Final Post with Image */}
          {workflowStage === 'final' && finalPost && (
            <div className="space-y-6">
              {copySuccess && (
                <div className="bg-green-100 text-green-800 text-sm font-semibold p-3 rounded-lg text-center shadow">
                  {copySuccess}
                </div>
              )}

              <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-accent-purple">{finalPost.platform} Post</h2>
                  <button
                    onClick={handleStartOver}
                    className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold py-2 px-4 rounded-lg transition"
                  >
                    ← Create Another
                  </button>
                </div>

                {/* Post Content */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-brand-text mb-2">Post Text:</h3>
                  <p className="text-brand-text-muted whitespace-pre-wrap bg-brand-light p-4 rounded-lg">
                    {finalPost.post_text}
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-brand-text mb-2">Hashtags:</h3>
                  <p className="text-accent-cyan text-sm">{finalPost.hashtags}</p>
                </div>

                {/* Generated Image */}
                {finalPost.generated_image && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-brand-text">Generated Image:</h3>
                      {composingLogo && (
                        <span className="text-xs font-semibold text-brand-text-muted">Applying logo…</span>
                      )}
                    </div>

                    {/* Image preview with clickable logo placement placeholders */}
                    <div className="relative rounded-lg overflow-hidden shadow-lg">
                      <img
                        src={finalPost.generated_image}
                        alt="Generated post visual"
                        className="w-full h-auto"
                      />

                      {/* Placeholder locations (only show when user enabled logo overlay and a logo exists) */}
                      {useLogoOverlay && businessLogoBase64 && (
                        <>
                          {/* Top Left */}
                          <button
                            type="button"
                            onClick={() => handleSelectLogoPosition('top-left')}
                            className="absolute top-3 left-3 w-16 h-16 border-2 border-dashed border-white/80 bg-black/20 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                            title="Place logo: Top Left"
                          >
                            Logo
                          </button>

                          {/* Top Right */}
                          <button
                            type="button"
                            onClick={() => handleSelectLogoPosition('top-right')}
                            className="absolute top-3 right-3 w-16 h-16 border-2 border-dashed border-white/80 bg-black/20 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                            title="Place logo: Top Right"
                          >
                            Logo
                          </button>

                          {/* Bottom Left */}
                          <button
                            type="button"
                            onClick={() => handleSelectLogoPosition('bottom-left')}
                            className="absolute bottom-3 left-3 w-16 h-16 border-2 border-dashed border-white/80 bg-black/20 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                            title="Place logo: Bottom Left"
                          >
                            Logo
                          </button>

                          {/* Bottom Right */}
                          <button
                            type="button"
                            onClick={() => handleSelectLogoPosition('bottom-right')}
                            className="absolute bottom-3 right-3 w-16 h-16 border-2 border-dashed border-white/80 bg-black/20 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                            title="Place logo: Bottom Right"
                          >
                            Logo
                          </button>

                          {/* Center */}
                          <button
                            type="button"
                            onClick={() => handleSelectLogoPosition('center')}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-dashed border-white/80 bg-black/20 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                            title="Place logo: Center (watermark)"
                          >
                            Watermark
                          </button>
                        </>
                      )}
                    </div>

                    {/* Branding Controls */}
                    <div className="mt-4 bg-brand-light border border-brand-border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-brand-text">Add Your Logo</p>
                          <p className="text-xs text-brand-text-muted mt-1">
                            Auto safe-zones per platform + auto white/black contrast for readability.
                          </p>
                        </div>

                        <label className="inline-flex items-center gap-2 select-none">
                          <input
                            type="checkbox"
                            checked={useLogoOverlay}
                            onChange={(e) => handleToggleLogoOverlay(e.target.checked)}
                            className="form-checkbox h-4 w-4 text-accent-purple rounded focus:ring-accent-purple/50"
                            disabled={composingLogo || !businessLogoBase64}
                          />
                          <span className="text-sm font-semibold text-brand-text">
                            {useLogoOverlay ? 'On' : 'Off'}
                          </span>
                        </label>
                      </div>

                      {!businessLogoBase64 && (
                        <div className="mt-3 text-xs text-yellow-300">
                          No logo found in your Business DNA. Add one in <span className="font-semibold">Business Details</span>.
                        </div>
                      )}

                      {logoError && (
                        <div className="mt-3 text-xs text-red-400">
                          {logoError}
                        </div>
                      )}

                      {/* Position buttons */}
                      <div className={`mt-4 grid grid-cols-2 md:grid-cols-5 gap-2 ${useLogoOverlay ? '' : 'opacity-50 pointer-events-none'}`}>
                        {(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'] as LogoPosition[]).map((pos) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => handleSelectLogoPosition(pos)}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                              logoPosition === pos
                                ? 'bg-accent-purple/20 border-accent-purple text-accent-purple'
                                : 'bg-brand-card border-brand-border text-brand-text-muted hover:text-brand-text'
                            }`}
                          >
                            {pos === 'center' ? 'Center' : pos.replace('-', ' ').replace('top', 'Top').replace('bottom', 'Bottom').replace('left', 'Left').replace('right', 'Right')}
                          </button>
                        ))}
                      </div>

                      <p className="text-[11px] text-brand-text-muted mt-3">
                        Tip: You can also click the <span className="font-semibold">Logo</span> placeholder boxes directly on the image.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-brand-text">Ready to Post?</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {finalPost.platform === 'WhatsApp' || finalPost.platform === 'Telegram' ? (
                      <button
                        onClick={() => setShowShareModal(true)}
                        className="bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-3 px-4 rounded-lg transition duration-300 hover:shadow-lg"
                      >
                        📤 Share to {finalPost.platform}
                      </button>
                    ) : (
                      <button
                        onClick={handleSchedulePost}
                        className="bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-3 px-4 rounded-lg transition duration-300 hover:shadow-lg"
                      >
                        📅 Schedule to Connected Accounts
                      </button>
                    )}
                    <button
                      onClick={() => handleCopyAndPost(finalPost.platform, finalPost.post_text, finalPost.hashtags)}
                      className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
                    >
                      📋 Copy & Post Now
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={handleDownloadText}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-300"
                    >
                      📄 Download Post Text
                    </button>
                    <button
                      onClick={handleDownloadImage}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-300"
                    >
                      🖼️ Download Image
                    </button>
                  </div>

                  <button
                    onClick={() => setShowShareModal(true)}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-300"
                  >
                    📤 Share to WhatsApp / Telegram
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && finalPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card p-6 rounded-xl shadow-2xl max-w-md w-full">
            <h3 className="text-xl font-bold text-brand-text mb-4">
              Schedule {finalPost.platform} Post
            </h3>

            {error && (
              <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-text mb-2">Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={getMinDate()}
                max={getMaxDate(7)}
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-accent-purple"
              />
              <p className="text-xs text-brand-text-muted mt-1">
                Schedule up to 7 days in advance
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-text mb-2">Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-accent-purple"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setError('');
                }}
                className="flex-1 bg-brand-light text-brand-text px-4 py-2 rounded-lg font-semibold hover:bg-opacity-80 transition"
                disabled={scheduling}
              >
                Cancel
              </button>
              <button
                onClick={confirmSchedulePost}
                disabled={scheduling || !scheduledDate}
                className="flex-1 bg-gradient-to-r from-accent-blue to-accent-purple text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scheduling ? 'Scheduling...' : 'Confirm Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal (WhatsApp / Telegram) */}
      {finalPost && (
        <SharePostModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          postText={finalPost.post_text}
          hashtags={finalPost.hashtags}
          platform={finalPost.platform}
          imageUrl={finalPost.generated_image}
        />
      )}
    </div>
  );
};

