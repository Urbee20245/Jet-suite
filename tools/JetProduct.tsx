import React, { useState, useRef, useEffect } from 'react';
import type { Tool, ProfileData } from '../types';
import { generateImage } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { HowToUse } from '../components/HowToUse';
import { ArrowUpTrayIcon, XCircleIcon, ArrowDownTrayIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon, TrashIcon } from '../components/icons/MiniIcons';
import { JetProductIcon } from '../components/icons/ToolIcons';
import { getSupabaseClient } from '../integrations/supabase/client';
import { AnalysisLoadingState } from '../components/AnalysisLoadingState';

interface JetProductProps {
  tool: Tool;
  profileData: ProfileData;
}

type ImageSize = '1K' | '2K' | '4K';
type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

interface Style {
  name: string;
  prompt: string;
}

const MOCKUP_STYLES = {
    // PRODUCT & E-COMMERCE
    product: [
        { 
            name: "E-commerce White", 
            prompt: "Professional product photography on pure white background (#FFFFFF). Perfect studio lighting with softbox setup creating soft, even shadows. Product centered and properly aligned. Professional color accuracy. Retail-ready e-commerce photo. 8K resolution, razor sharp focus." 
        },
        { 
            name: "Multi-Angle", 
            prompt: "Professional e-commerce product photography showing the item from 3 different angles (front, side, 45-degree). Pure white background. Studio lighting. Product details clearly visible. High-end retail photography. 8K resolution." 
        },
        { 
            name: "3D Render Style", 
            prompt: "Hyper-realistic 3D render style product photography. Dramatic shadows and reflections. Perfect geometry. Studio lighting. Commercial CGI quality. Ultra-detailed. 8K resolution." 
        },
    ],
    
    // LIFESTYLE & SCENES
    lifestyle: [
        { 
            name: "Desk Scene", 
            prompt: "Professional lifestyle product photography on modern minimalist desk. Marble or wood surface, coffee cup, laptop, small plant. Natural window lighting. Product is hero, sharp focus. Warm workspace aesthetic. Magazine-quality. 8K." 
        },
        { 
            name: "Kitchen Scene", 
            prompt: "Lifestyle photography with product in modern, clean kitchen. Natural lighting. Marble countertop. Fresh ingredients nearby. Warm, homey atmosphere. Food photography style. Magazine-quality. 8K." 
        },
        { 
            name: "Outdoor Natural", 
            prompt: "Lifestyle product photography in natural outdoor setting. Wooden surface or stone. Greenery in soft background blur. Natural daylight. Fresh, organic feel. Environmental portrait style. 8K." 
        },
    ],
    
    // SOCIAL MEDIA
    social: [
        { 
            name: "Instagram Post", 
            prompt: "Eye-catching Instagram advertisement. Product against modern gradient background using brand colors. Bold, minimal text overlay space. Clean, contemporary. High engagement design. Mobile optimized. Square 1:1. Vibrant." 
        },
        { 
            name: "Story/Reels", 
            prompt: "Dynamic vertical format social content. Product with motion-inspired composition. Bold colors. Text space at top and bottom. Optimized for Instagram Stories, TikTok, Reels. Eye-catching, mobile-first. 9:16." 
        },
        { 
            name: "Carousel Slide", 
            prompt: "Clean social media carousel design. Product centered with negative space. Brand colors. Room for swipe prompts and text. Professional social marketing. Consistent style. Instagram carousel optimized." 
        },
    ],
    
    // HERO BANNERS
    hero: [
        { 
            name: "Website Hero", 
            prompt: "Website hero banner featuring product as focal point. Wide 16:9 format. Minimalist background with negative space for text on left. Dramatic side lighting. Product positioned right third. Premium, luxury aesthetic. Space for headline and CTA." 
        },
        { 
            name: "Landing Page", 
            prompt: "Full-width landing page banner. Product hero shot with cinematic lighting. Dramatic shadows and highlights. Sleek, modern. Ample space for marketing copy. Product off-center. Premium brand feel. High-conversion design style. 16:9 format." 
        },
    ],
    
    // ACTION & IN-USE
    action: [
        { 
            name: "Action Shot", 
            prompt: "Dynamic action photograph showing product being used. Sports/lifestyle photography style. Motion blur in background. Product in sharp focus. Natural outdoor lighting. Authentic, aspirational. Magazine-quality action. Energetic. 8K." 
        },
        { 
            name: "Hands-On Demo", 
            prompt: "Professional lifestyle showing hands using/holding product. Clean, modern. Product clearly visible and focused. Natural skin tones and lighting. Demonstrates scale and usability. Commercial product photography. Authentic, relatable." 
        },
    ],
    
    // RESTAURANT & FOOD
    restaurant: [
        { 
            name: "Menu Hero", 
            prompt: "Professional food photography of dish as hero shot. Overhead or 45-degree angle. Perfectly plated on elegant dishware. Natural window lighting with soft shadows. Restaurant-quality presentation. Food magazine editorial. Rich colors, mouthwatering. 8K." 
        },
        { 
            name: "Table Setting", 
            prompt: "Restaurant ambiance shot with dish on elegantly set table. Wine glass, cutlery, ambient candles or flowers. Warm, inviting lighting. Upscale dining atmosphere. Dish is hero. Fine dining photography style. Creates desire. High-end." 
        },
        { 
            name: "Chef's Special", 
            prompt: "Editorial food photography with dish on rustic wooden board or modern plate. Ingredients artfully scattered. Chef's hands in background blur. Professional kitchen atmosphere. Natural light. Food magazine cover quality. Artisanal feel. 8K." 
        },
    ],
    
    // AUTOMOTIVE
    automotive: [
        { 
            name: "Showroom", 
            prompt: "Professional automotive photography in pristine showroom. Dramatic studio lighting highlighting curves. Reflective floor mirror effect. Clean, modern environment. Vehicle at 3/4 front angle. Luxury automotive advertising. Showroom quality. 8K." 
        },
        { 
            name: "Lifestyle Drive", 
            prompt: "Lifestyle automotive photography in scenic location. Mountain road, coastal highway, or urban skyline. Golden hour lighting. Vehicle positioned heroically. Adventure and freedom. Automotive magazine editorial. Aspirational. 8K." 
        },
        { 
            name: "Detail Shot", 
            prompt: "Close-up automotive photography showcasing features. Dramatic lighting emphasizing lines and details. Wheel, grille, headlight, or interior detail. Luxury automotive advertising. Sharp focus. Shows craftsmanship. High-end dealership marketing. 8K." 
        },
    ],
    
    // SALON & BEAUTY
    beauty: [
        { 
            name: "Salon Glamour", 
            prompt: "Professional beauty salon photography. Before/after styling result or showcasing work. Bright, clean salon environment. Professional lighting. Subject polished and confident. Fashion magazine aesthetic. Glamorous, aspirational. Shows transformation. 8K." 
        },
        { 
            name: "Product Beauty", 
            prompt: "High-end beauty product photography. Clean, minimal background with luxury aesthetic. Soft, flattering lighting. Product bottles/packaging displayed elegantly. Professional beauty editorial. Cosmetic advertising quality. Sleek, modern. Premium and desirable. 8K." 
        },
    ],
    
    // FITNESS & GYM
    fitness: [
        { 
            name: "Gym Action", 
            prompt: "Dynamic fitness photography showing equipment or facility in use. Athlete in action with energy. Dramatic gym lighting. Motion and power captured. Professional sports photography. Motivational, inspirational. High-end gym marketing. Shows results. 8K." 
        },
        { 
            name: "Facility Tour", 
            prompt: "Professional gym interior photography. Clean, modern fitness facility. Equipment perfectly arranged. Bright, motivating lighting. Shows space, cleanliness, quality equipment. Wide angle showcasing full facility. High-end gym marketing. Makes viewer want to join. 8K." 
        },
    ],
    
    // REAL ESTATE
    realestate: [
        { 
            name: "Property Exterior", 
            prompt: "Professional real estate photography of property exterior. Golden hour lighting creating warm glow. Perfectly maintained landscaping. Clear blue sky. Wide angle showing full property. Architecture details sharp. Luxury real estate marketing. Premium and desirable. 8K." 
        },
        { 
            name: "Interior Luxury", 
            prompt: "High-end real estate interior photography. Beautifully staged room with natural light. Shows space, style, luxury. Wide angle but not distorted. Professional architectural photography. Clean, bright, aspirational. Makes viewer imagine living there. 8K." 
        },
    ],
    
    // RETAIL STOREFRONT
    retail: [
        { 
            name: "Storefront", 
            prompt: "Professional storefront photography. Clean, inviting exterior. Well-lit windows showing displays. Bright daylight or warm evening glow. Shows business pride and professionalism. Inviting entrance. Retail photography. Makes customers want to visit. 8K." 
        },
        { 
            name: "Interior Store", 
            prompt: "Professional retail interior photography. Well-organized, clean store layout. Products beautifully displayed. Bright, welcoming lighting. Shows professionalism and quality. Wide angle showcasing space. Retail marketing. Looks established and trustworthy." 
        },
    ],
};

const CATEGORY_LABELS: Record<keyof typeof MOCKUP_STYLES, { label: string; icon: string }> = {
    product: { label: "Product & E-commerce", icon: "📦" },
    lifestyle: { label: "Lifestyle Scenes", icon: "🏡" },
    social: { label: "Social Media", icon: "📱" },
    hero: { label: "Hero Banners", icon: "🎯" },
    action: { label: "Action & In-Use", icon: "⚡" },
    restaurant: { label: "Restaurant & Food", icon: "🍽️" },
    automotive: { label: "Automotive", icon: "🚗" },
    beauty: { label: "Salon & Beauty", icon: "💇" },
    fitness: { label: "Fitness & Gym", icon: "💪" },
    realestate: { label: "Real Estate", icon: "🏠" },
    retail: { label: "Retail Store", icon: "🏪" },
};

const FONT_OPTIONS = [
  { id: 'elegant-serif', name: 'Elegant Serif', description: 'Classic, sophisticated, high-end' },
  { id: 'bold-sans', name: 'Bold Sans-Serif', description: 'Modern, strong, impactful' },
  { id: 'minimal-clean', name: 'Minimal Clean', description: 'Simple, contemporary, professional' },
  { id: 'luxury-script', name: 'Luxury Script', description: 'Elegant, premium, refined' },
  { id: 'geometric-modern', name: 'Geometric Modern', description: 'Sharp, technical, contemporary' },
  { id: 'handwritten', name: 'Handwritten', description: 'Casual, authentic, friendly' },
  { id: 'condensed-bold', name: 'Condensed Bold', description: 'Compact, powerful, attention-grabbing' },
  { id: 'rounded-friendly', name: 'Rounded Friendly', description: 'Approachable, warm, inviting' },
];

const FONT_STYLE_PROMPTS: Record<string, string> = {
  'elegant-serif': 'elegant serif typography with refined spacing and classic proportions',
  'bold-sans': 'bold modern sans-serif with high impact and strong presence',
  'minimal-clean': 'clean minimal typography with generous whitespace and contemporary feel',
  'luxury-script': 'luxury script font with sophisticated styling and premium aesthetic',
  'geometric-modern': 'geometric sans-serif with contemporary feel and technical precision',
  'handwritten': 'handwritten style font with authentic touch and organic feel',
  'condensed-bold': 'condensed bold typeface with strong presence and space efficiency',
  'rounded-friendly': 'rounded friendly typography with approachable feel and warm character',
};

const TEXT_SIZE_PROMPTS: Record<string, string> = {
  small: 'subtle, small text that complements without overpowering',
  medium: 'medium-sized, balanced text with clear readability',
  large: 'large, prominent text that dominates the composition',
};

const TEXT_POSITION_PROMPTS: Record<string, string> = {
  top: 'positioned at the top third of the composition',
  center: 'centered in the composition',
  bottom: 'positioned at the bottom third of the composition',
};

const addWatermark = async (base64Data: string): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return resolve(`data:image/png;base64,${base64Data}`);
    }

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const logo = new Image();
      logo.onload = () => {
        const padding = Math.max(20, img.width * 0.02);
        const logoHeight = Math.min(60, img.height * 0.08);
        const logoWidth = (logo.width / logo.height) * logoHeight;
        const x = canvas.width - logoWidth - padding;
        const y = canvas.height - logoHeight - padding;

        ctx.globalAlpha = 0.7;
        ctx.drawImage(logo, x, y, logoWidth, logoHeight);

        const fontSize = Math.max(14, img.height * 0.025);
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';

        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillText('Created by JetProduct', x - 10, y + logoHeight);
        
        resolve(canvas.toDataURL('image/png'));
      };
      logo.onerror = () => resolve(`data:image/png;base64,${base64Data}`);
      logo.src = '/Jetsuitewing.png';
    };
    img.onerror = () => resolve('');
    img.src = `data:image/png;base64,${base64Data}`;
  });
};

export const JetProduct: React.FC<JetProductProps> = ({ tool, profileData }) => {
  const [inputImage, setInputImage] = useState<{ base64: string; mimeType: string; dataUrl: string; } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize>('2K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);
  const [activeTab, setActiveTab] = useState<'standard' | 'youtube'>('standard');

  // Input image for standard generator (image-to-image)
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
  
  // TEXT OVERLAYS
  const [productName, setProductName] = useState('');
  const [headline, setHeadline] = useState('');
  const [price, setPrice] = useState('');

  // TEXT STYLING CONTROLS
  const [textFont, setTextFont] = useState('elegant-serif');
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [textColor, setTextColor] = useState('');
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('center');
  const [textVariationSeed, setTextVariationSeed] = useState(0);

  // MONTHLY CREDIT SYSTEM (60 generations per month)
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [creditsLimit, setCreditsLimit] = useState(60);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const MONTHLY_CREDIT_LIMIT = 60;

  // Load monthly credits on mount
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

        const currentMonthYear = new Date().toISOString().slice(0, 7); // "YYYY-MM"

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
        console.error('[JetProduct] Error loading credits:', err);
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
    const filename = `${(activeTab === 'youtube' ? youtubeTitle : prompt).substring(0, 30).replace(/\s/g, '_') || 'jetimage'}.png`;
    
    // Use the original image URL if available, otherwise use the watermarked one
    const urlToDownload = generatedImageUrl; 
    
    a.href = urlToDownload;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // --- FIX #2: Create handleRejectAndRegenerate function ---
  const handleRejectAndRegenerate = async () => {
    // Clear current results
    setGeneratedImageUrl(null);
    setOriginalImageUrl(null);
    setError('');
    
    // Increment text variation seed to get different results on regeneration
    setTextVariationSeed(prev => prev + 1);
    
    // Trigger regeneration
    // Use the correct handler based on the active tab
    if (activeTab === 'standard') {
        await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    } else if (activeTab === 'youtube') {
        await handleYoutubeGenerate();
    }
  };
  // --- END FIX #2 ---

  const nextResetDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const creditsRemaining = creditsLimit - creditsUsed;

  if (loading || loadingYoutube) {
    const title = activeTab === 'standard' ? 'Generating Custom Image' : 'Generating YouTube Thumbnail';
    const message = activeTab === 'standard' 
        ? 'Our AI is creating your image based on your prompt and brand DNA. This can take up to 5 minutes.'
        : 'Our AI is designing a high-CTR thumbnail based on your video title and style preferences. This can take up to 5 minutes.';
    
    return <AnalysisLoadingState title={title} message={message} durationEstimateSeconds={300} />;
  }

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
      
      {!loadingCredits && (
        <div className={`mb-4 flex items-center justify-between p-3 rounded-xl border ${
            creditsUsed >= creditsLimit 
                ? 'bg-red-50 border-red-300' 
                : 'bg-accent-purple/5 border-accent-purple/30'
        }`}>
            <div className="flex items-center gap-2">
                <SparklesIcon className={`w-5 h-5 ${creditsUsed >= creditsLimit ? 'text-red-500' : 'text-accent-purple'}`} />
                <span className="text-sm font-semibold text-brand-text">
                    AI Generations Remaining:
                </span>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${creditsUsed >= creditsLimit ? 'text-red-600' : 'text-accent-purple'}`}>
                    {creditsRemaining}
                </span>
                <span className="text-sm text-brand-text-muted">/ {creditsLimit}</span>
            </div>
        </div>
      )}
      {loadingCredits && (
        <div className="mb-4 h-12 w-full bg-brand-light rounded-xl animate-pulse"></div>
      )}
      
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
                <JetProductIcon className="w-8 h-8 text-accent-purple" />
                <div>
                    <p className="text-brand-text-muted mb-1">{tool.description}</p>
                </div>
            </div>
        </div>
        
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
                  <ArrowUpTrayIcon className="w-10 h-10 mx-auto text-brand-text-muted" />
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
      
      {generatedImageUrl && (
        <div className="mt-6 bg-brand-card p-6 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold mb-4 text-brand-text">Generated Image</h3>
          <img src={generatedImageUrl} alt={activeTab === 'youtube' ? youtubeTitle : prompt} className="rounded-lg w-full h-auto max-w-xl mx-auto border border-brand-border" />
          
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 bg-accent-blue hover:bg-accent-blue/80 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Download Image
            </button>
            <button
              onClick={handleRejectAndRegenerate}
              disabled={loading || loadingYoutube}
              className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg disabled:opacity-50"
            >
              <TrashIcon className="w-5 h-5" />
              Reject & Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};