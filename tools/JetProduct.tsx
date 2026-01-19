import React, { useState, useRef } from 'react';
import type { Tool, ProfileData } from '../types';
import { generateImage } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { HowToUse } from '../components/HowToUse';
import { ArrowUpTrayIcon, XCircleIcon, ArrowDownTrayIcon, InformationCircleIcon, SparklesIcon } from '../components/icons/MiniIcons';
import { JetProductIcon } from '../components/icons/ToolIcons';

interface JetProductProps {
  tool: Tool;
  profileData: ProfileData;
}

type ImageSize = '1K' | '2K' | '4K';
type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

const MOCKUP_STYLES = [
    { name: "Studio Mockup", prompt: "A clean, professional studio mockup of the product on a minimalist white background with soft lighting." },
    { name: "Lifestyle Scene", prompt: "The product being used by a happy customer in a modern, aspirational lifestyle setting." },
    { name: "3D Render", prompt: "A hyper-realistic 3D render of the product with dramatic shadows and reflections." },
    { name: "E-commerce Ready", prompt: "A high-resolution, white background image optimized for e-commerce listings." },
    { name: "Branded Packaging", prompt: "The product shown next to its branded packaging, incorporating brand colors." },
];

export const JetProduct: React.FC<JetProductProps> = ({ tool, profileData }) => {
  const [inputImage, setInputImage] = useState<{ base64: string; mimeType: string; dataUrl: string; } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize>('2K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);

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
                <div className="grid grid-cols-2 gap-2">
                    {MOCKUP_STYLES.map(style => (
                        <button 
                            type="button" 
                            key={style.name} 
                            onClick={() => setPrompt(style.prompt)} 
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                                prompt === style.prompt 
                                    ? 'bg-accent-purple/10 border-accent-purple' 
                                    : 'bg-brand-light border-brand-border hover:border-accent-purple/50'
                            }`}
                        >
                            <p className="text-sm font-bold text-brand-text">{style.name}</p>
                            <p className="text-[10px] text-brand-text-muted mt-1">{style.prompt.substring(0, 40)}...</p>
                        </button>
                    ))}
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