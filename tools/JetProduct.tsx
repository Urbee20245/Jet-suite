import React, { useState, useRef } from 'react';
import type { Tool, ProfileData } from '../types';
import { generateImage } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { HowToUse } from '../components/HowToUse';
import { ArrowUpTrayIcon, XCircleIcon, ArrowDownTrayIcon, InformationCircleIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon } from '../components/icons/MiniIcons';
import { JetProductIcon } from '../components/icons/ToolIcons';

interface JetProductProps {
  tool: Tool;
  profileData: ProfileData;
}

type ImageSize = '1K' | '2K' | '4K';
type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

interface Style {
  name: string;
  category: string;
  prompt: string;
}

const MOCKUP_STYLES: Style[] = [
    // E-COMMERCE & PRODUCT SHOTS
    { 
        name: "E-commerce White", 
        category: "product",
        prompt: "Professional product photography on pure white background (#FFFFFF). Perfect studio lighting with softbox setup creating soft, even shadows. Product centered and properly aligned. Multiple angles visible. Professional color accuracy. Retail-ready e-commerce photo. 8K resolution, razor sharp focus. Clean, minimal aesthetic. Commercial photography standard." 
    },
    { 
        name: "E-commerce Multi-Angle", 
        category: "product",
        prompt: "Professional e-commerce product photography showing the item from 3 different angles (front, side, 45-degree). Pure white background. Studio lighting setup. Each angle perfectly lit and sharp. Product details clearly visible. High-end retail photography. Commercial quality. 8K resolution." 
    },
    
    // LIFESTYLE MOCKUPS
    { 
        name: "Desk Lifestyle", 
        category: "lifestyle",
        prompt: "Professional lifestyle product photography featuring the product on a modern minimalist desk. Scene includes marble or wood desk surface, coffee cup, laptop or notebook, small plant. Natural window lighting from the side creating soft shadows. Product is the hero, in sharp focus. Warm, inviting workspace aesthetic. Magazine-quality composition. Shallow depth of field. 8K quality, aspirational feel." 
    },
    { 
        name: "Kitchen Scene", 
        category: "lifestyle",
        prompt: "Professional lifestyle photography with product in a modern, clean kitchen setting. Natural lighting from window. Marble or granite countertop. Fresh ingredients or cooking props nearby. Product prominently featured. Warm, homey atmosphere. Food photography style lighting. Magazine-quality. Aspirational lifestyle aesthetic. 8K resolution." 
    },
    { 
        name: "Outdoor Natural", 
        category: "lifestyle",
        prompt: "Lifestyle product photography in natural outdoor setting. Product on wooden surface or natural stone. Greenery and plants in soft background blur. Natural daylight. Fresh, organic feel. Product in sharp focus with beautiful bokeh background. Environmental portrait style. Professional nature photography aesthetic. 8K quality." 
    },
    
    // SOCIAL MEDIA ADS
    { 
        name: "Instagram Ad", 
        category: "social",
        prompt: "Eye-catching Instagram advertisement design. Product prominently displayed against modern gradient background using brand colors. Bold, minimal text overlay with product name. Clean, contemporary aesthetic. High engagement design. Optimized for mobile viewing. Square 1:1 format. Vibrant, attention-grabbing. Social media marketing quality." 
    },
    { 
        name: "Story/Reels", 
        category: "social",
        prompt: "Dynamic vertical format social media content. Product featured with motion-inspired composition. Bold colors and modern design. Text space at top and bottom for captions. Optimized for Instagram Stories, TikTok, and Reels. Eye-catching, mobile-first design. High engagement aesthetic. 9:16 vertical format." 
    },
    { 
        name: "Carousel Post", 
        category: "social",
        prompt: "Clean social media carousel slide design. Product centered with ample negative space. Cohesive brand colors. Room for swipe prompts and text overlays. Professional social media marketing design. Consistent visual style. Optimized for Instagram carousel posts. High quality." 
    },
    
    // HERO BANNERS
    { 
        name: "Website Hero", 
        category: "hero",
        prompt: "Website hero banner featuring product as main focal point. Wide 16:9 format. Minimalist background with ample negative space for text overlay on left side. Dramatic side lighting creating depth. Product positioned to the right third. Premium, luxury aesthetic. High-end commercial photography style. Space for headline and CTA. Professional web design quality." 
    },
    { 
        name: "Landing Page Banner", 
        category: "hero",
        prompt: "Full-width landing page banner. Product hero shot with cinematic lighting. Dramatic shadows and highlights. Sleek, modern aesthetic. Ample space for marketing copy. Product positioned off-center. Premium brand feel. High-conversion design style. 16:9 format. Professional commercial photography." 
    },
    
    // ACTION SHOTS
    { 
        name: "In-Use Action", 
        category: "action",
        prompt: "Dynamic action photograph showing product actively being used. Professional sports/lifestyle photography style. Motion blur in background suggesting movement and energy. Product in razor sharp focus. Natural outdoor or gym lighting. Authentic, aspirational feel. Magazine-quality action photography. Energetic composition. 8K quality." 
    },
    { 
        name: "Hands-On Demo", 
        category: "action",
        prompt: "Professional lifestyle shot showing hands using or holding the product. Clean, modern aesthetic. Product clearly visible and in focus. Natural skin tones and lighting. Demonstrates product scale and usability. Commercial product photography style. Authentic, relatable feel. High quality." 
    },
    
    // RESTAURANT & FOOD SERVICE
    { 
        name: "Menu Item Hero", 
        category: "restaurant",
        prompt: "Professional food photography of the dish as a hero shot. Overhead or 45-degree angle. Perfectly plated on elegant dishware. Natural window lighting creating soft shadows. Garnish and styling perfect. Restaurant-quality presentation. Food magazine editorial style. Rich colors, sharp details. Makes the food irresistible. 8K quality, mouthwatering." 
    },
    { 
        name: "Table Setting", 
        category: "restaurant",
        prompt: "Beautiful restaurant ambiance shot featuring the dish on an elegantly set table. Includes wine glass, cutlery, ambient candles or flowers. Warm, inviting lighting. Upscale dining atmosphere. Dish is the hero but scene tells a story. Fine dining photography style. Creates desire and aspiration. High-end restaurant marketing quality." 
    },
    { 
        name: "Chef's Special", 
        category: "restaurant",
        prompt: "Editorial-style food photography with dish presented on rustic wooden board or modern plate. Ingredients artfully scattered around. Chef's hands partially visible in background blur, suggesting preparation. Professional kitchen atmosphere. Natural light. Food magazine cover quality. Authentic, artisanal feel. 8K resolution." 
    },
    
    // AUTOMOTIVE & DEALERSHIP
    { 
        name: "Showroom Glory", 
        category: "automotive",
        prompt: "Professional automotive photography of vehicle in pristine showroom. Dramatic studio lighting highlighting curves and details. Reflective floor creating mirror effect. Clean, modern showroom environment. Vehicle perfectly positioned at 3/4 front angle. Luxury automotive advertising style. Showroom quality. High-end dealership marketing photo. 8K resolution." 
    },
    { 
        name: "Lifestyle Drive", 
        category: "automotive",
        prompt: "Lifestyle automotive photography showing vehicle in beautiful scenic location. Mountain road, coastal highway, or urban skyline background. Golden hour lighting. Vehicle positioned heroically. Sense of adventure and freedom. Automotive magazine editorial style. Aspirational lifestyle aesthetic. Professional car photography. 8K quality." 
    },
    { 
        name: "Detail Focus", 
        category: "automotive",
        prompt: "Close-up automotive photography showcasing key features. Dramatic lighting emphasizing lines and details. Wheel, grille, headlight, or interior detail shot. Luxury automotive advertising style. Clean, sharp focus. Shows craftsmanship and quality. High-end dealership marketing. Professional detail photography. 8K resolution." 
    },
    
    // SALON & BEAUTY
    { 
        name: "Salon Glamour", 
        category: "beauty",
        prompt: "Professional beauty salon photography. Before/after styling result or showcasing hair/beauty work. Bright, clean salon environment. Professional salon lighting. Subject looking polished and confident. Fashion magazine aesthetic. Glamorous, aspirational feel. High-end salon marketing quality. Shows transformation and expertise. 8K resolution." 
    },
    { 
        name: "Product Beauty", 
        category: "beauty",
        prompt: "High-end beauty product photography. Clean, minimal background with luxury aesthetic. Soft, flattering lighting. Product bottles or packaging displayed elegantly. Professional beauty editorial style. Cosmetic advertising quality. Sleek, modern composition. Makes products look premium and desirable. 8K quality." 
    },
    
    // GYM & FITNESS
    { 
        name: "Gym Action", 
        category: "fitness",
        prompt: "Dynamic fitness photography showing equipment or facility in use. Athlete in action with energy and determination. Dramatic gym lighting. Motion and power captured. Professional sports photography style. Motivational, inspirational feel. High-end gym marketing. Shows results and capability. 8K quality." 
    },
    { 
        name: "Facility Showcase", 
        category: "fitness",
        prompt: "Professional gym interior photography. Clean, modern fitness facility. Equipment perfectly arranged. Bright, motivating lighting. Shows space, cleanliness, and quality equipment. Wide angle showcasing full facility. High-end gym marketing photography. Makes viewer want to join. 8K resolution." 
    },
    
    // REAL ESTATE
    { 
        name: "Property Hero", 
        category: "realestate",
        prompt: "Professional real estate photography of property exterior. Golden hour lighting creating warm glow. Perfectly maintained landscaping. Clear blue sky. Wide angle showing full property grandeur. Architecture details sharp and clear. Luxury real estate marketing style. Makes property look premium and desirable. 8K quality." 
    },
    { 
        name: "Interior Luxury", 
        category: "realestate",
        prompt: "High-end real estate interior photography. Beautifully staged room with natural light. Shows space, style, and luxury. Wide angle but not distorted. Professional architectural photography. Clean, bright, aspirational. Makes viewer imagine living there. Luxury home marketing quality. 8K resolution." 
    },
    
    // RETAIL & STOREFRONT
    { 
        name: "Storefront Pride", 
        category: "retail",
        prompt: "Professional storefront photography. Clean, inviting exterior. Well-lit windows showing displays. Bright daylight or warm evening glow. Shows business pride and professionalism. Inviting entrance. Retail photography style. Makes customers want to visit. Local business marketing quality. 8K resolution." 
    },
    { 
        name: "Interior Showcase", 
        category: "retail",
        prompt: "Professional retail interior photography. Well-organized, clean store layout. Products beautifully displayed. Bright, welcoming lighting. Shows professionalism and quality. Wide angle showcasing full space. Retail marketing style. Makes business look established and trustworthy. High quality." 
    },
];

// Helper to group styles by category
const groupedStyles = MOCKUP_STYLES.reduce((acc, style) => {
    const categoryName = style.category.charAt(0).toUpperCase() + style.category.slice(1);
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(style);
    return acc;
}, {} as Record<string, Style[]>);


export const JetProduct: React.FC<JetProductProps> = ({ tool, profileData }) => {
  const [inputImage, setInputImage] = useState<{ base64: string; mimeType: string; dataUrl: string; } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize>('2K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['product', 'lifestyle', 'social']));

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setGeneratedImageUrl(null);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const clearInputImage = () => {
    setInputImage(null);
    setGeneratedImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputImage) {
      setError('Please upload a product image first.');
      return;
    }
    if (!prompt) {
      setError('Please select a style or enter a prompt.');
      return;
    }
    
    setError('');
    setLoading(true);
    setGeneratedImageUrl(null);
    
    try {
      const brandDna = profileData.brandDnaProfile;
      const brandColors = brandDna?.visual_identity?.primary_colors?.join(', ') || 'professional business colors';
      const tone = brandDna?.brand_tone?.primary_tone || 'professional';
      
      // Construct the final prompt, emphasizing the product and brand DNA
      const finalPrompt = `Generate a high-quality, professional product mockup. 
      Product context: ${prompt}. 
      Brand DNA: Use colors ${brandColors} and a ${tone} tone. 
      Focus on photorealism and commercial quality.`;

      const base64Data = await generateImage(finalPrompt, imageSize, aspectRatio, inputImage);
      setGeneratedImageUrl(`data:image/png;base64,${base64Data}`);
    } catch (err: any) {
      console.error(err);
      setError('Failed to generate mockup. Please try again or refine your prompt.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const a = document.createElement('a');
    a.href = generatedImageUrl;
    a.download = `${profileData.business.business_name.replace(/\s/g, '_')}_mockup.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const toggleCategory = (category: string) => {
    setOpenCategories(prev => {
        const newSet = new Set(prev);
        if (newSet.has(category)) {
            newSet.delete(category);
        } else {
            newSet.add(category);
        }
        return newSet;
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      {showHowTo && (
        <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
            <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Upload a clear photo of your product (PNG or JPG).</li>
                <li>Select a **Mockup Style** or enter a custom prompt (e.g., "on a wooden table next to a coffee cup").</li>
                <li>The AI will generate a professional, branded mockup using your product and brand DNA.</li>
                <li>Download the high-resolution image for your e-commerce store or social media.</li>
            </ul>
        </HowToUse>
      )}
      
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg border border-brand-border">
        <div className="flex items-center gap-4 mb-4">
            <JetProductIcon className="w-8 h-8 text-accent-purple" />
            <div>
                <p className="text-brand-text-muted mb-1">{tool.description}</p>
                <p className="text-sm text-brand-text-muted">
                    Replaces: <span className="text-accent-purple font-semibold">Product Photography & Designer ($500-2,000/mo)</span>
                </p>
            </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Image Upload */}
            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">1. Upload Product Image <span className="text-red-500">*</span></label>
              {inputImage ? (
                <div className="relative group aspect-square w-full max-w-xs mx-auto">
                  <img src={inputImage.dataUrl} alt="Input product" className="w-full h-full object-contain rounded-lg border-2 border-brand-border" />
                  <button type="button" onClick={clearInputImage} className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 hover:text-red-700 transition-transform group-hover:scale-110"><XCircleIcon className="w-7 h-7" /></button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-brand-border rounded-lg p-8 text-center cursor-pointer hover:border-accent-purple hover:bg-brand-light transition-colors aspect-square flex flex-col items-center justify-center">
                  <ArrowUpTrayIcon className="w-10 h-10 mx-auto text-brand-text-muted" />
                  <p className="mt-3 text-sm text-brand-text">Click to upload or drag & drop</p>
                  <p className="text-xs text-brand-text-muted">PNG or JPG of your product</p>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>
              )}
            </div>

            {/* Right: Style Selection */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">2. Select Mockup Style</label>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {Object.entries(groupedStyles).map(([category, styles]) => {
                        const isCategoryOpen = openCategories.has(category);
                        return (
                            <div key={category} className="border border-brand-border rounded-lg overflow-hidden">
                                <button 
                                    type="button" 
                                    onClick={() => toggleCategory(category)}
                                    className="w-full flex justify-between items-center p-3 bg-brand-light hover:bg-brand-border transition-colors"
                                >
                                    <h4 className="font-bold text-brand-text">{category} Mockups</h4>
                                    {isCategoryOpen ? <ChevronUpIcon className="w-5 h-5 text-brand-text-muted" /> : <ChevronDownIcon className="w-5 h-5 text-brand-text-muted" />}
                                </button>
                                {isCategoryOpen && (
                                    <div className="p-2 grid grid-cols-1 gap-2">
                                        {styles.map(style => (
                                            <button 
                                                type="button" 
                                                key={style.name} 
                                                onClick={() => setPrompt(style.prompt)} 
                                                className={`p-3 rounded-lg border-2 text-left transition-all ${
                                                    prompt === style.prompt 
                                                        ? 'bg-accent-purple/10 border-accent-purple' 
                                                        : 'bg-white border-brand-border hover:border-accent-purple/50'
                                                }`}
                                            >
                                                <p className="text-sm font-bold text-brand-text">{style.name}</p>
                                                <p className="text-[10px] text-brand-text-muted mt-1 line-clamp-2">{style.prompt.substring(0, 100)}...</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
              </div>
              
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-brand-text mb-2">3. Custom Prompt (Optional)</label>
                <textarea id="prompt" rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., 'on a rustic wooden table with a cup of coffee'" className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <span className="block text-sm font-medium text-brand-text mb-2">Image Size</span>
                    <div className="flex space-x-2">
                        {(['1K', '2K', '4K'] as ImageSize[]).map(size => (<button type="button" key={size} onClick={() => setImageSize(size)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${imageSize === size ? 'bg-accent-purple text-white shadow' : 'bg-brand-light text-brand-text-muted hover:bg-gray-200'}`}>{size}</button>))}
                    </div>
                </div>
                <div>
                    <span className="block text-sm font-medium text-brand-text mb-2">Aspect Ratio</span>
                    <div className="flex space-x-2">
                        {(['1:1', '4:3', '16:9'] as AspectRatio[]).map(ratio => (<button type="button" key={ratio} onClick={() => setAspectRatio(ratio)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${aspectRatio === ratio ? 'bg-accent-purple text-white shadow' : 'bg-brand-light text-brand-text-muted hover:bg-gray-200'}`}>{ratio}</button>))}
                    </div>
                </div>
              </div>
            </div>
          </div>
          
          {error && <p className="text-red-500 text-sm my-4">{error}</p>}
          
          <button type="submit" disabled={loading || !inputImage || !prompt} className="w-full mt-6 bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-lg flex items-center justify-center gap-2">
            {loading ? 'Generating Mockup...' : <><SparklesIcon className="w-5 h-5" /> Generate Mockup</>}
          </button>
        </form>
      </div>
      
      {loading && <Loader />}
      
      {generatedImageUrl && (
        <div className="mt-6 bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold mb-4 text-brand-text">Generated Mockup</h3>
          <img src={generatedImageUrl} alt="Generated Product Mockup" className="rounded-lg w-full h-auto max-w-xl mx-auto border border-brand-border" />
          
          <div className="mt-6 flex justify-center">
            <button onClick={handleDownload} className="flex items-center justify-center gap-2 bg-accent-blue hover:bg-accent-blue/80 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg">
              <ArrowDownTrayIcon className="w-5 h-5" /> Download PNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
};