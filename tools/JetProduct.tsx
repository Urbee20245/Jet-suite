import React, { useState, useRef, useEffect } from 'react';
import type { Tool, ProfileData } from '../types';
import { generateImage, getTrendingImageStyles } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { HowToUse } from '../components/HowToUse';
import { ArrowUpTrayIcon, XCircleIcon, SparklesIcon, ArrowDownTrayIcon, InformationCircleIcon, ChevronDownIcon, ChevronUpIcon } from '../components/icons/MiniIcons';
import { getCurrentDate } from '../utils/dateTimeUtils';
import { getSupabaseClient } from '../integrations/supabase/client';

interface JetProductProps {
  tool: Tool;
  profileData: ProfileData;
}

type ImageSize = '1K' | '2K' | '4K';
type DownloadFormat = 'png' | 'jpeg';
type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

interface Style {
  name: string;
  description: string;
  prompt: string;
}

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
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [watermarkedImageUrl, setWatermarkedImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);

  const [inputImage, setInputImage] = useState<{ base64: string; mimeType: string; dataUrl: string; } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const USAGE_LIMIT = 2;
  const [usage, setUsage] = useState({ count: 0, date: getCurrentDate() });

  const [trendingStyles, setTrendingStyles] = useState<Style[]>([]);
  const [isLoadingStyles, setIsLoadingStyles] = useState(true);
  
  // Product Mockup Specific States
  const [productName, setProductName] = useState('');
  const [headline, setHeadline] = useState('');
  const [price, setPrice] = useState('');

  // MONTHLY CREDIT SYSTEM
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [creditsLimit, setCreditsLimit] = useState(60);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const MONTHLY_CREDIT_LIMIT = 60;

  // Load monthly credits on component mount
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

        // Try to get existing record for this month
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
          // No record for this month - create new one
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
  }, [profileData.user.id]);

  useEffect(() => {
    const fetchStyles = async () => {
      setIsLoadingStyles(true);
      try {
        const cached = localStorage.getItem('jetimage_trending_styles');
        const now = new Date().getTime();

        if (cached) {
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
      }
    };

    fetchStyles();
  }, []);

  useEffect(() => {
    const savedUsage = localStorage.getItem('jetsuite_jetimage_download_usage');
    const today = getCurrentDate();
    if (savedUsage) {
      const parsed = JSON.parse(savedUsage);
      if (parsed.date === today) {
        setUsage(parsed);
      } else {
        const newUsage = { count: 0, date: today };
        localStorage.setItem('jetsuite_jetimage_download_usage', JSON.stringify(newUsage));
        setUsage(newUsage);
      }
    } else {
      const newUsage = { count: 0, date: today };
      localStorage.setItem('jetsuite_jetimage_download_usage', JSON.stringify(newUsage));
      setUsage(newUsage);
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const imageObject = {
          dataUrl: dataUrl,
          base64: dataUrl.split(',')[1],
          mimeType: file.type,
        };
        setInputImage(imageObject);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (creditsUsed >= creditsLimit) {
      setError(`Monthly limit reached! You've used all ${creditsLimit} generations this month. Your limit resets on the 1st of next month.`);
      return;
    }
    
    if (!inputImage) {
      setError('Please upload a product or business image first.');
      return;
    }
    if (!prompt) {
      setError('Please select a mockup style or enter a custom prompt.');
      return;
    }
    
    setError('');
    setLoading(true);
    setWatermarkedImageUrl(null);
    setOriginalImageUrl(null);
    
    try {
      const brandDna = profileData.brandDnaProfile;
      const brandColors = brandDna?.visual_identity?.primary_colors?.join(', ') || 'professional business colors';
      const tone = brandDna?.brand_tone?.primary_tone || 'professional';
      
      let finalPrompt = `Generate a high-quality, professional product mockup. 
Product context: ${prompt}. 
Brand DNA: Use colors ${brandColors} and a ${tone} tone. 
Focus on photorealism and commercial quality.`;

      if (productName || headline || price) {
        finalPrompt += '\n\nTEXT OVERLAYS TO INCLUDE:';
        if (productName) {
          finalPrompt += `\n- Product Name: "${productName}" (display prominently in elegant typography)`;
        }
        if (headline) {
          finalPrompt += `\n- Headline: "${headline}" (bold, attention-grabbing text)`;
        }
        if (price) {
          finalPrompt += `\n- Price: "${price}" (clear, readable pricing display)`;
        }
        finalPrompt += '\n\nPlace text overlays naturally with proper contrast and readability. Use brand colors for text where appropriate.';
      }

      const base64Data = await generateImage(finalPrompt, imageSize, aspectRatio, inputImage);
      setOriginalImageUrl(`data:image/png;base64,${base64Data}`);
      const watermarkedUrl = await addWatermark(base64Data);
      setWatermarkedImageUrl(watermarkedUrl);
      
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
      setError('Failed to generate mockup. Please try again or refine your prompt.');
    } finally {
      setLoading(false);
    }
  };
  
  const triggerDownload = (url: string, extension: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prompt.substring(0, 30).replace(/\s/g, '_') || 'jetproduct'}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownload = (format: DownloadFormat) => {
    if (usage.count >= USAGE_LIMIT) {
      setError(`Daily download limit of ${USAGE_LIMIT} reached. Please try again tomorrow.`);
      return;
    }
    if (!originalImageUrl) return;

    const newCount = usage.count + 1;
    const newUsage = { ...usage, count: newCount };
    setUsage(newUsage);
    localStorage.setItem('jetsuite_jetimage_download_usage', JSON.stringify(newUsage));

    if (format === 'jpeg') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const jpegUrl = canvas.toDataURL('image/jpeg', 0.9);
          triggerDownload(jpegUrl, 'jpeg');
        }
      };
      img.src = originalImageUrl;
    } else {
      triggerDownload(originalImageUrl, 'png');
    }
  };

  const downloadsRemaining = USAGE_LIMIT - usage.count;
  const nextResetDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const creditsRemaining = creditsLimit - creditsUsed;

  return (
    <div>
      {showHowTo && (
        <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Upload your product image to use as the base.</li>
            <li>Select a mockup style (e.g., 'Studio Shot', 'Lifestyle Scene').</li>
            <li>Add optional text overlays like product name, headline, and price.</li>
            <li>Generate professional, on-brand mockups instantly.</li>
          </ul>
        </HowToUse>
      )}
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <p className="text-brand-text-muted mb-2">{tool.description}</p>
        <p className="text-sm text-brand-text-muted mb-6">
          Replaces: <span className="text-accent-purple font-semibold">Product Photography & Designer ($1,000-3,000/mo)</span>
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-brand-text mb-2">1. Upload Product Image <span className="text-red-500">*</span></label>
            {inputImage ? (
              <div className="relative group w-32 h-32">
                <img src={inputImage.dataUrl} alt="Input preview" className="w-full h-full object-cover rounded-lg border-2 border-brand-border" />
                <button type="button" onClick={clearInputImage} className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 hover:text-red-700 transition-transform group-hover:scale-110"><XCircleIcon className="w-7 h-7" /></button>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-brand-border rounded-lg p-6 text-center cursor-pointer hover:border-accent-purple hover:bg-brand-light transition-colors">
                <ArrowUpTrayIcon className="w-8 h-8 mx-auto text-brand-text-muted" />
                <p className="mt-2 text-sm text-brand-text">Click to upload or drag & drop</p>
                <p className="text-xs text-brand-text-muted">PNG, JPG, GIF up to 10MB</p>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" required />
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-brand-text mb-2">2. Select Mockup Style <span className="text-red-500">*</span></label>
            {isLoadingStyles ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {[...Array(5)].map((_, i) => (<div key={i} className="p-3 bg-brand-light border border-brand-border rounded-lg h-24 animate-pulse"><div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div><div className="h-2 bg-gray-200 rounded w-full"></div><div className="h-2 bg-gray-200 rounded w-5/6 mt-1"></div></div>))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {trendingStyles.map(style => (<button type="button" key={style.name} onClick={() => setPrompt(style.prompt)} className="p-3 bg-brand-light border border-brand-border rounded-lg text-left hover:border-accent-purple transition-colors h-full" title={style.description}><p className="text-xs font-bold text-brand-text">{style.name}</p><p className="text-[10px] text-brand-text-muted mt-1">{style.description}</p></button>))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="prompt" className="block text-sm font-medium text-brand-text mb-2">3. Refine Prompt (Optional)</label>
            <textarea id="prompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., 'place the product on a wooden table with soft studio lighting'" className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition" />
          </div>
          
          <div className="mb-6 p-4 bg-brand-light rounded-lg border border-brand-border">
            <h4 className="text-sm font-bold text-brand-text mb-3 flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-accent-purple"/> Text Overlays (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" value={productName} onChange={e => setProductName(e.target.value)} placeholder="Product Name" className="w-full bg-white border border-brand-border rounded-lg p-2 text-sm" />
                <input type="text" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Headline/Offer" className="w-full bg-white border border-brand-border rounded-lg p-2 text-sm" />
                <input type="text" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price (e.g., $49.99)" className="w-full bg-white border border-brand-border rounded-lg p-2 text-sm" />
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
                <span className="block text-sm font-medium text-brand-text mb-2">Image Size</span>
                <div className="flex space-x-2">
                {(['1K', '2K', '4K'] as ImageSize[]).map(size => (<button type="button" key={size} onClick={() => setImageSize(size)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${imageSize === size ? 'bg-accent-purple text-white shadow' : 'bg-brand-light text-brand-text-muted hover:bg-gray-200'}`}>{size}</button>))}
                </div>
            </div>
            <div>
                <span className="block text-sm font-medium text-brand-text mb-2">Aspect Ratio</span>
                <div className="flex space-x-2">
                {(['1:1', '16:9', '4:3', '3:4', '9:16'] as AspectRatio[]).map(ratio => (<button type="button" key={ratio} onClick={() => setAspectRatio(ratio)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${aspectRatio === ratio ? 'bg-accent-purple text-white shadow' : 'bg-brand-light text-brand-text-muted hover:bg-gray-200'}`}>{ratio}</button>))}
                </div>
            </div>
          </div>
          
          {/* Monthly Credit Counter */}
          {!loadingCredits && (
            <div className="mt-4 p-4 bg-gradient-to-r from-brand-light to-white border border-brand-border rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm font-semibold text-brand-text">Monthly Generations</span>
                  <p className="text-xs text-brand-text-muted mt-0.5">
                    Resets {nextResetDate}
                  </p>
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

          {error && <p className="text-red-500 text-sm my-4">{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading || !inputImage || !prompt || creditsUsed >= creditsLimit || loadingCredits} 
            className="w-full mt-6 bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating Mockup...
              </>
            ) : loadingCredits ? (
              'Loading...'
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" /> 
                Generate Professional Mockup
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
      </div>
      {loading && <Loader />}
      {watermarkedImageUrl && (
        <div className="mt-6 bg-brand-card p-6 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold mb-4 text-brand-text">Generated Preview</h3>
          <img src={watermarkedImageUrl} alt={prompt} className="rounded-lg w-full h-auto" />
          
          <div className="mt-6 bg-brand-light p-4 rounded-lg border border-brand-border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-brand-text">Download Clean Image</h4>
                <p className="text-sm text-brand-text-muted">This will use one of your daily credits.</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-brand-text">{downloadsRemaining} / {USAGE_LIMIT}</p>
                <p className="text-xs text-brand-text-muted">downloads left</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={() => handleDownload('png')} disabled={downloadsRemaining <= 0} className="flex items-center justify-center gap-2 bg-accent-blue hover:bg-accent-blue/80 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"><ArrowDownTrayIcon className="w-5 h-5" /> Download PNG</button>
              <button onClick={() => handleDownload('jpeg')} disabled={downloadsRemaining <= 0} className="flex items-center justify-center gap-2 bg-accent-blue hover:bg-accent-blue/80 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"><ArrowDownTrayIcon className="w-5 h-5" /> Download JPEG</button>
            </div>
            {downloadsRemaining <= 0 && <p className="text-red-500 text-xs text-center mt-3 font-semibold">You've reached your daily download limit.</p>}
          </div>
        </div>
      )}
    </div>
  );
};