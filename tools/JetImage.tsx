import React, { useState, useRef, useEffect } from 'react';
import type { Tool, ProfileData } from '../types';
import { generateImage, getTrendingImageStyles, generateYoutubeThumbnailPrompt } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { HowToUse } from '../components/HowToUse';
import { ArrowUpTrayIcon, XCircleIcon, SparklesIcon, ArrowDownTrayIcon, InformationCircleIcon } from '../components/icons/MiniIcons';
import { getCurrentDate } from '../utils/dateTimeUtils';

interface JetImageProps {
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
      // Fallback if canvas is not supported
      return resolve(`data:image/png;base64,${base64Data}`);
    }

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const logo = new Image();
      logo.onload = () => {
        // Watermark styling
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

        // Add a subtle shadow for visibility on any background
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillText('Created by JetImage', x - 10, y + logoHeight);
        
        resolve(canvas.toDataURL('image/png'));
      };
      logo.onerror = () => resolve(`data:image/png;base64,${base64Data}`); // Fallback if logo fails
      logo.src = '/Jetsuitewing.png'; // Path to the logo in public folder
    };
    img.onerror = () => resolve(''); // Return empty if image fails to load
    img.src = `data:image/png;base64,${base64Data}`;
  });
};

export const JetImage: React.FC<JetImageProps> = ({ tool, profileData }) => {
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
  
  // YouTube Thumbnail State
  const [videoTitle, setVideoTitle] = useState('');
  const [videoTopic, setVideoTopic] = useState('');
  const [thumbnailInputImage, setThumbnailInputImage] = useState<{ base64: string; mimeType: string; dataUrl: string; } | null>(null);
  const thumbnailFileInputRef = useRef<HTMLInputElement>(null);
  const [showYoutubeGenerator, setShowYoutubeGenerator] = useState(false);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isThumbnail: boolean = false) => {
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
        if (isThumbnail) {
          setThumbnailInputImage(imageObject);
        } else {
          setInputImage(imageObject);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearInputImage = (isThumbnail: boolean = false) => {
    if (isThumbnail) {
      setThumbnailInputImage(null);
      if (thumbnailFileInputRef.current) {
        thumbnailFileInputRef.current.value = '';
      }
    } else {
      setInputImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) {
      setError('Please enter a prompt to describe the image you want to generate.');
      return;
    }
    setError('');
    setLoading(true);
    setWatermarkedImageUrl(null);
    setOriginalImageUrl(null);
    try {
      const base64Data = await generateImage(prompt, imageSize, aspectRatio, inputImage || undefined);
      setOriginalImageUrl(`data:image/png;base64,${base64Data}`);
      const watermarkedUrl = await addWatermark(base64Data);
      setWatermarkedImageUrl(watermarkedUrl);
    } catch (err: any) {
      console.error(err);
      setError('Failed to generate image. Please try again or refine your prompt.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGenerateThumbnail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle || !videoTopic) {
      setError('Please enter both the video title and topic.');
      return;
    }
    setError('');
    setLoading(true);
    setWatermarkedImageUrl(null);
    setOriginalImageUrl(null);
    setAspectRatio('16:9'); // Force 16:9 for thumbnails

    try {
        const brandDna = profileData.brandDnaProfile;
        const brandTone = brandDna?.brand_tone.primary_tone || 'professional';
        const brandColors = brandDna?.visual_identity.primary_colors || ['#3B82F6', '#8B5CF6'];

        const thumbnailRequest = {
            videoTitle,
            videoTopic,
            businessName: profileData.business.business_name,
            brandTone,
            brandColors,
        };

        const generatedPrompt = await generateYoutubeThumbnailPrompt(thumbnailRequest);
        setPrompt(generatedPrompt); // Set the generated prompt for the user to see/edit

        const base64Data = await generateImage(generatedPrompt, '2K', '16:9', thumbnailInputImage || undefined); // Use 2K for better thumbnail quality
        setOriginalImageUrl(`data:image/png;base64,${base64Data}`);
        const watermarkedUrl = await addWatermark(base64Data);
        setWatermarkedImageUrl(watermarkedUrl);

    } catch (err: any) {
        console.error(err);
        setError('Failed to generate thumbnail. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  const triggerDownload = (url: string, extension: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prompt.substring(0, 30).replace(/\s/g, '_') || 'jetimage'}.${extension}`;
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

  return (
    <div>
      {showHowTo && (
        <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Generate unlimited watermarked previews.</li>
            <li>Download up to {USAGE_LIMIT} clean, un-watermarked images per day.</li>
            <li>Use "Trending Styles" for inspiration or write your own prompt.</li>
            <li>Optionally upload an image to modify it with an "Image-to-Image" prompt.</li>
          </ul>
        </HowToUse>
      )}
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <p className="text-brand-text-muted mb-2">{tool.description}</p>
        <p className="text-sm text-brand-text-muted mb-6">
          Replaces: <span className="text-accent-purple font-semibold">Graphic Designer ($1,000-3,000/mo)</span>
        </p>
        
        {/* YouTube Thumbnail Generator Section */}
        <div className="mb-8 border-b border-brand-border pb-6">
            <button 
                onClick={() => setShowYoutubeGenerator(!showYoutubeGenerator)}
                className="w-full flex items-center justify-between p-3 bg-accent-cyan/10 rounded-lg hover:bg-accent-cyan/20 transition-colors"
            >
                <h3 className="font-bold text-lg text-accent-cyan flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5" />
                    AI YouTube Thumbnail Generator (High CTR)
                </h3>
                <svg className={`w-5 h-5 text-accent-cyan transition-transform ${showYoutubeGenerator ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            
            {showYoutubeGenerator && (
                <form onSubmit={handleGenerateThumbnail} className="mt-4 space-y-4 p-4 bg-brand-light rounded-lg border border-brand-border">
                    <p className="text-sm text-brand-text-muted">Generate a high-CTR thumbnail prompt based on current trends and your brand DNA.</p>
                    
                    {/* Image Upload for Enhancement */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-brand-text mb-2">Upload Base Image (Optional)</label>
                        {thumbnailInputImage ? (
                            <div className="relative group w-32 h-32">
                                <img src={thumbnailInputImage.dataUrl} alt="Input preview" className="w-full h-full object-cover rounded-lg border-2 border-brand-border" />
                                <button type="button" onClick={() => clearInputImage(true)} className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 hover:text-red-700 transition-transform group-hover:scale-110"><XCircleIcon className="w-7 h-7" /></button>
                            </div>
                        ) : (
                            <div onClick={() => thumbnailFileInputRef.current?.click()} className="border-2 border-dashed border-brand-border rounded-lg p-4 text-center cursor-pointer hover:border-accent-purple hover:bg-white transition-colors">
                                <ArrowUpTrayIcon className="w-6 h-6 mx-auto text-brand-text-muted" />
                                <p className="mt-1 text-xs text-brand-text">Upload photo to enhance (e.g., a face shot)</p>
                                <input type="file" ref={thumbnailFileInputRef} onChange={(e) => handleImageUpload(e, true)} accept="image/*" className="hidden" />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-brand-text mb-1">Video Title</label>
                        <input type="text" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="e.g., 5 HVAC Mistakes That Cost You Thousands" className="w-full bg-white border border-brand-border rounded-lg p-2 text-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-text mb-1">Video Topic/Summary</label>
                        <textarea rows={2} value={videoTopic} onChange={e => setVideoTopic(e.target.value)} placeholder="e.g., Common errors homeowners make with their AC units" className="w-full bg-white border border-brand-border rounded-lg p-2 text-sm resize-none" required />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-accent-cyan hover:bg-accent-cyan/90 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg">
                        {loading ? 'Generating Thumbnail...' : 'Generate High-CTR Thumbnail'}
                    </button>
                    <p className="text-xs text-brand-text-muted mt-2">
                        This will automatically set the aspect ratio to 16:9 and size to 2K.
                    </p>
                </form>
            )}
        </div>

        {/* Standard Image Generator Section */}
        <h3 className="text-xl font-bold text-brand-text mb-4">Standard Image Generator</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-brand-text mb-2">Upload Base Image (Optional)</label>
            {inputImage ? (
              <div className="relative group w-32 h-32">
                <img src={inputImage.dataUrl} alt="Input preview" className="w-full h-full object-cover rounded-lg border-2 border-brand-border" />
                <button type="button" onClick={() => clearInputImage(false)} className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 hover:text-red-700 transition-transform group-hover:scale-110"><XCircleIcon className="w-7 h-7" /></button>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-brand-border rounded-lg p-6 text-center cursor-pointer hover:border-accent-purple hover:bg-brand-light transition-colors">
                <ArrowUpTrayIcon className="w-8 h-8 mx-auto text-brand-text-muted" />
                <p className="mt-2 text-sm text-brand-text">Click to upload or drag & drop</p>
                <p className="text-xs text-brand-text-muted">PNG, JPG, GIF up to 10MB</p>
                <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e, false)} accept="image/*" className="hidden" />
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-brand-text mb-2">Trending Styles</label>
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
            <label htmlFor="prompt" className="block text-sm font-medium text-brand-text mb-2">{inputImage ? 'Describe how to change the image' : 'Describe the image you want'}</label>
            <textarea id="prompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={inputImage ? "e.g., 'make this a watercolor painting'" : "e.g., 'A futuristic cityscape at sunset, neon lights'"} className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition" />
          </div>
          <div className="mb-6">
            <span className="block text-sm font-medium text-brand-text mb-2">Image Size</span>
            <div className="flex space-x-2">
              {(['1K', '2K', '4K'] as ImageSize[]).map(size => (<button type="button" key={size} onClick={() => setImageSize(size)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${imageSize === size ? 'bg-accent-purple text-white shadow' : 'bg-brand-light text-brand-text-muted hover:bg-gray-200'}`}>{size}</button>))}
            </div>
          </div>
          <div className="mb-6">
            <span className="block text-sm font-medium text-brand-text mb-2">Aspect Ratio</span>
            <div className="flex space-x-2">
              {(['1:1', '16:9', '4:3', '3:4', '9:16'] as AspectRatio[]).map(ratio => (<button type="button" key={ratio} onClick={() => setAspectRatio(ratio)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${aspectRatio === ratio ? 'bg-accent-purple text-white shadow' : 'bg-brand-light text-brand-text-muted hover:bg-gray-200'}`}>{ratio}</button>))}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg">
            {loading ? 'Generating Preview...' : 'Generate Watermarked Preview'}
          </button>
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