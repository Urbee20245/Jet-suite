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
            prompt: "Lifestyle product photography in natural outdoor setting. Wooden surface or stone. Greenery in soft background blur. Natural daylight. Fresh, organic feel. Beautiful bokeh. Environmental portrait style. 8K." 
        },
    ],
    
    // SOCIAL MEDIA
    social: [
        { 
            name: "Instagram Ad", 
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
            name: "Landing Page Banner", 
            prompt: "Full-width landing page banner. Product hero shot with cinematic lighting. Dramatic shadows and highlights. Sleek, modern. Ample space for marketing copy. Product positioned off-center. Premium brand feel. High-conversion design style. 16:9 format." 
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
            prompt: "Professional automotive photography of vehicle in pristine showroom. Dramatic studio lighting highlighting curves. Reflective floor mirror effect. Clean, modern environment. Vehicle at 3/4 front angle. Luxury automotive advertising. Showroom quality. 8K." 
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
            name: "Facility Showcase", 
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
            prompt: "Professional retail interior photography. Well-organized, clean store layout. Products beautifully displayed. Bright, welcoming lighting. Shows professionalism and quality. Wide angle showcasing space. Retail marketing. Looks established and trustworthy. High quality." 
        },
    ],
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
  
  // CRITICAL FIX: Missing state variables
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof MOCKUP_STYLES>('product');
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  
  // NEW STATE FOR TEXT OVERLAYS
  const [productName, setProductName] = useState('');
  const [headline, setHeadline] = useState('');
  const [price, setPrice] = useState('');
  
  // TEXT STYLING CONTROLS
  const [textFont, setTextFont] = useState('elegant-serif');
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [textColor, setTextColor] = useState('');
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('center');
  const [textVariationSeed, setTextVariationSeed] = useState(0);

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
      setError('Please upload a product or business image first.');
      return;
    }
    if (!prompt) {
      setError('Please select a mockup style or enter a custom prompt.');
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
      let finalPrompt = `Generate a high-quality, professional product mockup. 
Product context: ${prompt}. 
Brand DNA: Use colors ${brandColors} and a ${tone} tone. 
Focus on photorealism and commercial quality.`;

      // Add text overlays if provided
      if (productName || headline || price) {
        const fontStyle = FONT_STYLE_PROMPTS[textFont] || FONT_STYLE_PROMPTS['elegant-serif'];
        const sizeStyle = TEXT_SIZE_PROMPTS[textSize];
        const positionStyle = TEXT_POSITION_PROMPTS[textPosition];
        
        // Add variation to font style if user has regenerated
        let finalFontStyle = fontStyle;
        if (textVariationSeed > 0) {
          const allFonts = Object.keys(FONT_STYLE_PROMPTS);
          const variantFontKey = allFonts[(allFonts.indexOf(textFont) + textVariationSeed) % allFonts.length];
          finalFontStyle = FONT_STYLE_PROMPTS[variantFontKey];
        }
        
        finalPrompt += '\n\nTEXT OVERLAYS TO INCLUDE:';
        finalPrompt += `\n\nTypography Style: Use ${finalFontStyle}.`;
        finalPrompt += `\nText Size: ${sizeStyle}.`;
        finalPrompt += `\nText Placement: ${positionStyle}.`;
        
        if (textColor) {
          finalPrompt += `\nText Color: ${textColor}.`;
        } else {
          finalPrompt += `\nText Color: Use brand colors (${brandColors}) or high-contrast colors for maximum readability.`;
        }
        
        if (productName) {
          finalPrompt += `\n\n- Product Name: "${productName}" (display prominently)`;
        }
        if (headline) {
          finalPrompt += `\n- Headline/Tagline: "${headline}" (bold and attention-grabbing)`;
        }
        if (price) {
          finalPrompt += `\n- Price: "${price}" (clear and readable)`;
        }
        
        finalPrompt += '\n\nEnsure text has proper contrast with background for maximum readability. Apply consistent typography across all text elements. Professional, commercial-quality text integration.';
      }

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
                <li>Upload a clear photo of your product or business (PNG or JPG).</li>
                <li>Select a **Mockup Style** from the categories (Product, Lifestyle, Social, Restaurant, Automotive, etc.).</li>
                <li>Optionally add **Text Overlays** like product name, headline, or price.</li>
                <li>The AI will generate a professional, branded mockup with your text beautifully integrated.</li>
                <li>Download the high-resolution image for your marketing materials.</li>
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
                
                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {(Object.keys(MOCKUP_STYLES) as Array<keyof typeof MOCKUP_STYLES>).map(category => (
                        <button
                            type="button"
                            key={category}
                            onClick={() => {
                                setSelectedCategory(category);
                                setSelectedStyle(null);
                                setPrompt('');
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                selectedCategory === category
                                    ? 'bg-accent-purple text-white shadow'
                                    : 'bg-brand-light text-brand-text-muted hover:bg-gray-200'
                            }`}
                        >
                            <span className="mr-1">{CATEGORY_LABELS[category].icon}</span>
                            {CATEGORY_LABELS[category].label}
                        </button>
                    ))}
                </div>
                
                {/* Style Options for Selected Category */}
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2">
                    {MOCKUP_STYLES[selectedCategory].map(style => (
                        <button 
                            type="button" 
                            key={style.name} 
                            onClick={() => {
                                setSelectedStyle(style);
                                setPrompt(style.prompt);
                            }} 
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                                selectedStyle?.name === style.name
                                    ? 'bg-accent-purple/10 border-accent-purple' 
                                    : 'bg-brand-light border-brand-border hover:border-accent-purple/50'
                            }`}
                        >
                            <p className="text-sm font-bold text-brand-text">{style.name}</p>
                            <p className="text-[10px] text-brand-text-muted mt-1 line-clamp-2">{style.prompt.substring(0, 80)}...</p>
                        </button>
                    ))}
                </div>
              </div>
              
              {/* NEW TEXT OVERLAYS SECTION */}
              <div>
                <label className="block text-sm font-medium text-brand-text mb-3">
                  3. Text Overlays (Optional)
                  <span className="text-xs text-brand-text-muted font-normal ml-2">Add text to your mockup</span>
                </label>
                
                <div className="space-y-3">
                  <div>
                    <label htmlFor="productName" className="block text-xs font-medium text-brand-text-muted mb-1">
                      Product Name
                    </label>
                    <input
                      id="productName"
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g., Premium Wireless Earbuds"
                      className="w-full bg-brand-light border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="headline" className="block text-xs font-medium text-brand-text-muted mb-1">
                      Headline/Tagline
                    </label>
                    <input
                      id="headline"
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g., Sound That Moves You"
                      className="w-full bg-brand-light border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="price" className="block text-xs font-medium text-brand-text-muted mb-1">
                      Price (Optional)
                    </label>
                    <input
                      id="price"
                      type="text"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g., $99.99"
                      className="w-full bg-brand-light border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
                    />
                  </div>
                </div>
                
                {(productName || headline || price) && (
                  <div className="mt-4 space-y-3 p-4 bg-brand-light border border-brand-border rounded-lg">
                    <p className="text-xs font-semibold text-brand-text mb-2">Text Styling Options</p>
                    
                    {/* Font Selection */}
                    <div>
                      <label htmlFor="textFont" className="block text-xs font-medium text-brand-text-muted mb-1">
                        Font Style
                      </label>
                      <select
                        id="textFont"
                        value={textFont}
                        onChange={(e) => setTextFont(e.target.value)}
                        className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
                      >
                        {FONT_OPTIONS.map(font => (
                          <option key={font.id} value={font.id}>
                            {font.name} - {font.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Text Size */}
                    <div>
                      <label className="block text-xs font-medium text-brand-text-muted mb-2">Text Size</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['small', 'medium', 'large'] as const).map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setTextSize(size)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                              textSize === size
                                ? 'bg-accent-purple text-white shadow'
                                : 'bg-white border border-brand-border text-brand-text hover:border-accent-purple/50'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Text Color */}
                    <div>
                      <label htmlFor="textColor" className="block text-xs font-medium text-brand-text-muted mb-1">
                        Text Color (Optional)
                        <span className="ml-1 text-[10px]">Leave empty for brand colors</span>
                      </label>
                      <input
                        id="textColor"
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        placeholder="e.g., #FF5733, white, or black"
                        className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
                      />
                    </div>
                    
                    {/* Text Position */}
                    <div>
                      <label className="block text-xs font-medium text-brand-text-muted mb-2">Text Position</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['top', 'center', 'bottom'] as const).map(position => (
                          <button
                            key={position}
                            type="button"
                            onClick={() => setTextPosition(position)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                              textPosition === position
                                ? 'bg-accent-purple text-white shadow'
                                : 'bg-white border border-brand-border text-brand-text hover:border-accent-purple/50'
                            }`}
                          >
                            {position}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-brand-border">
                      <p className="text-[10px] text-brand-text-muted">
                        💡 Don't like the result? Use "Try Different Style" after generating
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {/* END NEW TEXT OVERLAYS SECTION */}

              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-brand-text mb-2">4. Custom Prompt (Optional)</label>
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
          
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            {/* Download Button */}
            <button 
              onClick={handleDownload} 
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg"
            >
              <ArrowDownTrayIcon className="w-5 h-5" /> Download PNG
            </button>
            
            {/* Try Different Style Button (only if text exists) */}
            {(productName || headline || price) && (
              <button 
                onClick={async () => {
                  setTextVariationSeed(prev => prev + 1);
                  setGeneratedImageUrl(null);
                  // Trigger form submit to regenerate with new variation
                  const form = document.querySelector('form');
                  if (form) {
                    const event = new Event('submit', { cancelable: true, bubbles: true });
                    form.dispatchEvent(event);
                  }
                }}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-accent-purple hover:bg-accent-purple/80 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="w-5 h-5" /> Try Different Text Style
              </button>
            )}
            
            {/* New Mockup Button */}
            <button 
              onClick={() => {
                setGeneratedImageUrl(null);
                setInputImage(null);
                setProductName('');
                setHeadline('');
                setPrice('');
                setTextVariationSeed(0);
                setTextFont('elegant-serif');
                setTextSize('medium');
                setTextColor('');
                setTextPosition('center');
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="flex items-center justify-center gap-2 bg-brand-light hover:bg-brand-border text-brand-text font-semibold py-3 px-6 rounded-lg transition border border-brand-border"
            >
              Start New Mockup
            </button>
          </div>
          
          {(productName || headline || price) && textVariationSeed > 0 && (
            <div className="mt-4 text-center">
              <p className="text-xs text-brand-text-muted">
                🎨 Style Variation #{textVariationSeed + 1} - Keep clicking for more options
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};