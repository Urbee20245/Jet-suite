import React, { useState, useRef, useEffect } from 'react';
import type { Tool, ProfileData } from '../types';
import { generateImage, getTrendingImageStyles, generateYoutubeThumbnailPrompt } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { HowToUse } from '../components/HowToUse';
import { ArrowUpTrayIcon, XCircleIcon, SparklesIcon, ArrowDownTrayIcon, ArrowPathIcon } from '../components/icons/MiniIcons';
import { getSupabaseClient } from '../integrations/supabase/client';

interface JetImageProps {
  tool: Tool;
  profileData: ProfileData;
}

type ImageSize = '1K' | '2K' | '4K';
type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

interface Style {
  name: string;
  description: string;
  prompt: string;
}

export const JetImage: React.FC<JetImageProps> = ({ tool, profileData }) => {
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);
  const [activeTab, setActiveTab] = useState<'standard' | 'youtube'>('standard');

  // Input image for standard generator (image-to-image)
  const [inputImage, setInputImage] = useState<{ base64: string; mimeType: string; dataUrl: string; } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Input image for YouTube thumbnail (face/product shot)
  const [youtubeInputImage, setYoutubeInputImage] = useState<{ base64: string; mimeType: string; dataUrl: string; } | null>(null);
  const youtubeFileInputRef = useRef<HTMLInputElement>(null);

  // Trending styles
  const [trendingStyles, setTrendingStyles] = useState<Style[]>([]);
  const [isLoadingStyles, setIsLoadingStyles] = useState(true);
  const [isRefreshingStyles, setIsRefreshingStyles] = useState(false);
  
  // YouTube thumbnail
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [youtubeNiche, setYoutubeNiche] = useState('');
  const [youtubeEmotion, setYoutubeEmotion] = useState('');
  const [loadingYoutube, setLoadingYoutube] = useState(false);
  
  // MONTHLY CREDIT SYSTEM (60 generations per month)
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [creditsLimit, setCreditsLimit] = useState(60);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const MONTHLY_CREDIT_LIMIT = 60;

  // Load monthly credits
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoadingCredits(false);
      return;
    }
    
    const loadCredits = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoadingCredits(false);
          return;
        }

        const currentMonthYear = new Date().toISOString().slice(0, 7);

        const { data: creditRecord } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_id', user.id)
          .eq('month_year', currentMonthYear)
          .maybeSingle();

        if (creditRecord) {
          setCreditsUsed(creditRecord.credits_used);
          setCreditsLimit(creditRecord.credits_limit);
        } else {
          const { data: newRecord } = await supabase
            .from('user_credits')
            .insert({
              user_id: user.id,
              month_year: currentMonthYear,
              credits_used: 0,
              credits_limit: MONTHLY_CREDIT_LIMIT
            })
            .select()
            .single();

          if (newRecord) {
            setCreditsUsed(0);
            setCreditsLimit(MONTHLY_CREDIT_LIMIT);
          }
        }
      } catch (err) {
        console.error('[JetImage] Error loading credits:', err);
      } finally {
        setLoadingCredits(false);
      }
    };

    loadCredits();
  }, []);

  // Fetch trending styles
  const fetchStyles = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshingStyles(true);
    else setIsLoadingStyles(true);
    
    try {
      const cached = localStorage.getItem('jetimage_trending_styles');
      const now = new Date().getTime();

      if (cached && !forceRefresh) {
        const { timestamp, styles } = JSON.parse(cached);
        if (now - timestamp < 24 * 60 * 60 * 1000) { // 24 hours
          setTrendingStyles(styles);
          setIsLoadingStyles(false);
          return;
        }
      }

      const styles = await getTrendingImageStyles();
      setTrendingStyles(styles);
      localStorage.setItem('jetimage_trending_styles', JSON.stringify({ timestamp: now, styles }));
    } catch (e) {
      console.error("Failed to fetch trending styles:", e);
      setTrendingStyles([]);
    } finally {
      setIsLoadingStyles(false);
      setIsRefreshingStyles(false);
    }
  };

  useEffect(() => {
    fetchStyles();
  }, []);

  // Handle standard image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setInputImage({
          dataUrl: dataUrl,
          base64: dataUrl.split(',')[1],
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearInputImage = () => {
    setInputImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle YouTube thumbnail image upload
  const handleYoutubeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setYoutubeInputImage({
          dataUrl: dataUrl,
          base64: dataUrl.split(',')[1],
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearYoutubeInputImage = () => {
    setYoutubeInputImage(null);
    if (youtubeFileInputRef.current) {
      youtubeFileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (creditsUsed >= creditsLimit) {
      setError(`Monthly limit reached! You've used all ${creditsLimit} generations this month. Your limit resets on the 1st of next month.`);
      return;
    }
    
    if (!prompt) {
      setError('Please enter a prompt to describe the image you want to generate.');
      return;
    }
    
    setError('');
    setLoading(true);
    setGeneratedImageUrl(null);
    
    try {
      const base64Data = await generateImage(prompt, imageSize, aspectRatio, inputImage || undefined);
      setGeneratedImageUrl(`data:image/png;base64,${base64Data}`);
      
      // Increment credits
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const currentMonthYear = new Date().toISOString().slice(0, 7);
        const newCreditsUsed = creditsUsed + 1;
        
        await supabase
          .from('user_credits')
          .update({ 
            credits_used: newCreditsUsed,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('month_year', currentMonthYear);
        
        setCreditsUsed(newCreditsUsed);
      }
      
    } catch (err: any) {
      console.error(err);
      setError('Failed to generate image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleYoutubeGenerate = async () => {
    if (creditsUsed >= creditsLimit) {
      setError(`Monthly limit reached! You've used all ${creditsLimit} generations this month. Your limit resets on the 1st of next month.`);
      return;
    }
    
    if (!youtubeTitle) {
      setError('Please enter a video title.');
      return;
    }
    
    setError('');
    setLoadingYoutube(true);
    setGeneratedImageUrl(null);
    
    try {
      // Build the YouTube thumbnail prompt
      let thumbnailPrompt = `HIGH-CTR YOUTUBE THUMBNAIL (16:9 FORMAT):

Title text to display: "${youtubeTitle}"

VISUAL REQUIREMENTS:
- Bold, eye-catching text overlay with the video title
- High contrast colors for maximum visibility
- Emotion-triggering composition that stops scrolling
- Professional YouTube thumbnail quality
- Clear focal point (${youtubeInputImage ? 'person/product from uploaded image' : 'dramatic visual'})
- Vibrant, saturated colors
- Text should be LARGE and READABLE on mobile devices`;

      if (youtubeNiche) {
        thumbnailPrompt += `\n- Style: ${youtubeNiche} niche aesthetic`;
      }
      
      if (youtubeEmotion) {
        thumbnailPrompt += `\n- Emotion to trigger: ${youtubeEmotion}`;
      }
      
      thumbnailPrompt += `\n\nCRITICAL: Make this thumbnail irresistible to click. Use dramatic lighting, bold typography, and high-energy composition.`;

      // Generate image with YouTube thumbnail optimization (with or without input image)
      const base64Data = await generateImage(thumbnailPrompt, '4K', '16:9', youtubeInputImage || undefined);
      setGeneratedImageUrl(`data:image/png;base64,${base64Data}`);
      
      // Increment credits
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const currentMonthYear = new Date().toISOString().slice(0, 7);
        const newCreditsUsed = creditsUsed + 1;
        
        await supabase
          .from('user_credits')
          .update({ 
            credits_used: newCreditsUsed,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('month_year', currentMonthYear);
        
        setCreditsUsed(newCreditsUsed);
      }
      
    } catch (err: any) {
      console.error(err);
      setError('Failed to generate thumbnail. Please try again.');
    } finally {
      setLoadingYoutube(false);
    }
  };
  
  const handleDownload = () => {
    if (!generatedImageUrl) return;
    
    const a = document.createElement('a');
    a.href = generatedImageUrl;
    a.download = `${(activeTab === 'youtube' ? youtubeTitle : prompt).substring(0, 30).replace(/\s/g, '_') || 'jetimage'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const nextResetDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const creditsRemaining = creditsLimit - creditsUsed;

  return (
    <div>
      {showHowTo && (
        <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Generate up to {MONTHLY_CREDIT_LIMIT} AI images per month (resets monthly).</li>
            <li>Use trending styles or write custom prompts.</li>
            <li>Upload an image for image-to-image transformation.</li>
            <li>Create high-CTR YouTube thumbnails with built-in templates.</li>
            <li>Download unlimited times after generation.</li>
          </ul>
        </HowToUse>
      )}
      
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg border border-brand-border">
        <p className="text-brand-text-muted mb-6">{tool.description}</p>
        
        {/* Monthly Credit Counter */}
        {!loadingCredits && (
          <div className="mb-6 p-4 bg-gradient-to-r from-brand-light to-white border border-brand-border rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-semibold text-brand-text">Monthly Generations</span>
                <p className="text-xs text-brand-text-muted mt-0.5">Resets {nextResetDate}</p>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${creditsUsed >= creditsLimit ? 'text-red-500' : 'text-accent-purple'}`}>
                  {creditsUsed}
                </span>
                <span className="text-lg text-brand-text-muted"> / {creditsLimit}</span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  creditsUsed >= creditsLimit 
                    ? 'bg-gradient-to-r from-red-500 to-red-600' 
                    : 'bg-gradient-to-r from-accent-purple to-accent-pink'
                }`}
                style={{ width: `${Math.min((creditsUsed / creditsLimit) * 100, 100)}%` }}
              ></div>
            </div>
            
            <div className="mt-2 text-center">
              <p className={`text-sm font-medium ${creditsUsed >= creditsLimit ? 'text-red-600' : 'text-accent-purple'}`}>
                {creditsUsed >= creditsLimit 
                  ? '🚫 No generations remaining' 
                  : `✨ ${creditsRemaining} generations remaining this month`
                }
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-brand-border">
          <button
            onClick={() => setActiveTab('standard')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'standard'
                ? 'text-accent-purple border-accent-purple'
                : 'text-brand-text-muted border-transparent hover:text-brand-text'
            }`}
          >
            Standard Image Generator
          </button>
          <button
            onClick={() => setActiveTab('youtube')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'youtube'
                ? 'text-accent-purple border-accent-purple'
                : 'text-brand-text-muted border-transparent hover:text-brand-text'
            }`}
          >
            YouTube Thumbnail Generator
          </button>
        </div>

        {/* STANDARD IMAGE GENERATOR */}
        {activeTab === 'standard' && (
          <form onSubmit={handleSubmit}>
            {/* Upload Base Image */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-brand-text mb-2">Upload Base Image (Optional)</label>
              {inputImage ? (
                <div className="relative group w-32 h-32">
                  <img src={inputImage.dataUrl} alt="Input preview" className="w-full h-full object-cover rounded-lg border-2 border-brand-border" />
                  <button type="button" onClick={clearInputImage} className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 hover:text-red-700 transition-transform group-hover:scale-110">
                    <XCircleIcon className="w-7 h-7" />
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-brand-border rounded-lg p-6 text-center cursor-pointer hover:border-accent-purple hover:bg-brand-light transition-colors">
                  <ArrowUpTrayIcon className="w-8 h-8 mx-auto text-brand-text-muted" />
                  <p className="mt-2 text-sm text-brand-text">Click to upload</p>
                  <p className="text-xs text-brand-text-muted">PNG, JPG, GIF up to 10MB</p>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>
              )}
            </div>

            {/* Trending Styles */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-brand-text">Trending Styles</label>
                <button
                  type="button"
                  onClick={() => fetchStyles(true)}
                  disabled={isRefreshingStyles}
                  className="flex items-center gap-1 text-xs text-accent-purple hover:text-accent-purple/80 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${isRefreshingStyles ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              {isLoadingStyles ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="p-3 bg-brand-light border border-brand-border rounded-lg h-20 animate-pulse">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {trendingStyles.map(style => (
                    <button
                      type="button"
                      key={style.name}
                      onClick={() => setPrompt(style.prompt)}
                      className={`p-3 bg-brand-light border rounded-lg text-left hover:border-accent-purple transition-colors ${
                        prompt === style.prompt ? 'border-accent-purple bg-accent-purple/5' : 'border-brand-border'
                      }`}
                      title={style.prompt}
                    >
                      <p className="text-xs font-bold text-brand-text">{style.name}</p>
                      <p className="text-[10px] text-brand-text-muted mt-1 line-clamp-2">{style.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prompt */}
            <div className="mb-6">
              <label htmlFor="prompt" className="block text-sm font-medium text-brand-text mb-2">
                {inputImage ? 'Describe how to change the image' : 'Describe the image you want'}
              </label>
              <textarea
                id="prompt"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={inputImage ? "e.g., 'make this a watercolor painting'" : "e.g., 'A futuristic cityscape at sunset, neon lights'"}
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
              />
            </div>

            {/* Image Size */}
            <div className="mb-6">
              <span className="block text-sm font-medium text-brand-text mb-2">Image Size</span>
              <div className="flex space-x-2">
                {(['1K', '2K', '4K'] as ImageSize[]).map(size => (
                  <button
                    type="button"
                    key={size}
                    onClick={() => setImageSize(size)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      imageSize === size
                        ? 'bg-accent-purple text-white shadow'
                        : 'bg-brand-light text-brand-text-muted hover:bg-gray-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="mb-6">
              <span className="block text-sm font-medium text-brand-text mb-2">Aspect Ratio</span>
              <div className="flex space-x-2">
                {(['1:1', '16:9', '4:3', '3:4', '9:16'] as AspectRatio[]).map(ratio => (
                  <button
                    type="button"
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      aspectRatio === ratio
                        ? 'bg-accent-purple text-white shadow'
                        : 'bg-brand-light text-brand-text-muted hover:bg-gray-200'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            
            <button
              type="submit"
              disabled={loading || creditsUsed >= creditsLimit || loadingCredits}
              className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating Image...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Generate Image
                </>
              )}
            </button>

            {creditsUsed >= creditsLimit && (
              <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <p className="text-sm font-bold text-red-800">Monthly Limit Reached</p>
                    <p className="text-xs text-red-700 mt-1">
                      You've used all {creditsLimit} generations for {new Date().toLocaleDateString('en-US', { month: 'long' })}. 
                      Your limit will reset on {nextResetDate}.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}

        {/* YOUTUBE THUMBNAIL GENERATOR */}
        {activeTab === 'youtube' && (
          <div>
            {/* Upload Image for Thumbnail */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-brand-text mb-2">
                Upload Your Photo/Product (Optional)
              </label>
              <p className="text-xs text-brand-text-muted mb-2">Upload a face shot, product image, or logo to include in your thumbnail</p>
              {youtubeInputImage ? (
                <div className="relative group w-32 h-32">
                  <img src={youtubeInputImage.dataUrl} alt="YouTube thumbnail input" className="w-full h-full object-cover rounded-lg border-2 border-brand-border" />
                  <button type="button" onClick={clearYoutubeInputImage} className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 hover:text-red-700 transition-transform group-hover:scale-110">
                    <XCircleIcon className="w-7 h-7" />
                  </button>
                </div>
              ) : (
                <div onClick={() => youtubeFileInputRef.current?.click()} className="border-2 border-dashed border-red-200 rounded-lg p-6 text-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors">
                  <ArrowUpTrayIcon className="w-8 h-8 mx-auto text-red-500" />
                  <p className="mt-2 text-sm text-brand-text">Click to upload your photo</p>
                  <p className="text-xs text-brand-text-muted">PNG or JPG (face shot works best)</p>
                  <input type="file" ref={youtubeFileInputRef} onChange={handleYoutubeImageUpload} accept="image/*" className="hidden" />
                </div>
              )}
            </div>
          
            <div className="mb-6">
              <label htmlFor="youtubeTitle" className="block text-sm font-medium text-brand-text mb-2">
                Video Title <span className="text-red-500">*</span>
              </label>
              <input
                id="youtubeTitle"
                type="text"
                value={youtubeTitle}
                onChange={(e) => setYoutubeTitle(e.target.value)}
                placeholder="e.g., 'How I Made $10,000 in 30 Days'"
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="youtubeNiche" className="block text-sm font-medium text-brand-text mb-2">
                Niche/Category (Optional)
              </label>
              <input
                id="youtubeNiche"
                type="text"
                value={youtubeNiche}
                onChange={(e) => setYoutubeNiche(e.target.value)}
                placeholder="e.g., 'Finance', 'Gaming', 'Cooking'"
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="youtubeEmotion" className="block text-sm font-medium text-brand-text mb-2">
                Target Emotion (Optional)
              </label>
              <input
                id="youtubeEmotion"
                type="text"
                value={youtubeEmotion}
                onChange={(e) => setYoutubeEmotion(e.target.value)}
                placeholder="e.g., 'Excited', 'Shocked', 'Curious'"
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
              />
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            
            <button
              onClick={handleYoutubeGenerate}
              disabled={loadingYoutube || creditsUsed >= creditsLimit || loadingCredits}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {loadingYoutube ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating Thumbnail...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Generate YouTube Thumbnail
                </>
              )}
            </button>

            {creditsUsed >= creditsLimit && (
              <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <p className="text-sm font-bold text-red-800">Monthly Limit Reached</p>
                    <p className="text-xs text-red-700 mt-1">
                      Your limit will reset on {nextResetDate}.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {loading && <Loader />}
      
      {generatedImageUrl && (
        <div className="mt-6 bg-brand-card p-6 rounded-xl shadow-lg border border-brand-border">
          <h3 className="text-2xl font-bold mb-4 text-brand-text">Generated {activeTab === 'youtube' ? 'YouTube Thumbnail' : 'Image'}</h3>
          <img src={generatedImageUrl} alt={activeTab === 'youtube' ? youtubeTitle : prompt} className="rounded-lg w-full h-auto max-w-2xl mx-auto border border-brand-border" />
          
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 bg-accent-blue hover:bg-accent-blue/80 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Download Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
};