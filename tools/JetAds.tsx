import React, { useState, useEffect } from 'react';
import type { Tool } from '../types';
import { generateAdCopy, generateImage } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { HowToUse } from '../components/HowToUse';

interface JetAdsProps {
  tool: Tool;
}

interface Ad {
  headline: string;
  description: string;
  cta: string;
  visual_suggestion: string;
}

type Platform = 'Facebook' | 'Google Ads' | 'Instagram';

const platformDetails: { [key in Platform]: { aspectRatio: "1:1" | "16:9", postUrl: string } } = {
    'Facebook': { aspectRatio: '1:1', postUrl: 'https://www.facebook.com/ads/manager/' },
    'Google Ads': { aspectRatio: '1:1', postUrl: 'https://ads.google.com/home/' },
    'Instagram': { aspectRatio: '1:1', postUrl: 'https://www.facebook.com/ads/manager/' },
};

export const JetAds: React.FC<JetAdsProps> = ({ tool }) => {
  const [product, setProduct] = useState('');
  const [platform, setPlatform] = useState<Platform>('Facebook');
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);
  
  const [generatedImages, setGeneratedImages] = useState<{ [index: number]: string }>({});
  const [imageLoading, setImageLoading] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) {
      setError('Please describe the product or offer.');
      return;
    }
    setError('');
    setLoading(true);
    setAds([]);
    setGeneratedImages({});
    setCopySuccess('');
    try {
      const result = await generateAdCopy(product, platform);
      setAds(result.ads);
    } catch (err) {
      setError('Failed to generate ad copy. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGenerateImage = async (index: number, prompt: string) => {
    setImageLoading(index);
    setError('');
    try {
        const aspectRatio = platformDetails[platform].aspectRatio;
        const base64Data = await generateImage(prompt, '1K', aspectRatio);
        setGeneratedImages(prev => ({ ...prev, [index]: `data:image/png;base64,${base64Data}` }));
    } catch (err: any) {
        console.error(err);
        setError(`Failed to generate image for Ad #${index + 1}. Please try again.`);
    } finally {
        setImageLoading(null);
    }
  };

  const handleCopyAndPost = (index: number, ad: Ad) => {
      const fullText = `Headline: ${ad.headline}\n\nDescription: ${ad.description}`;
      navigator.clipboard.writeText(fullText);
      setCopySuccess(`Ad #${index + 1} content copied!`);
      setTimeout(() => setCopySuccess(''), 2000);
      
      const postUrl = platformDetails[platform].postUrl;
      window.open(postUrl, '_blank');
  };

  return (
    <div>
      {showHowTo && (
        <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
            <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Describe the product, service, or offer you want to advertise.</li>
                <li>Select the ad platform (e.g., Facebook).</li>
                <li>Click 'Generate Ad Copy' to get multiple ad variations, complete with headlines and descriptions.</li>
            </ul>
        </HowToUse>
      )}
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <p className="text-brand-text-muted mb-2">{tool.description}</p>
        <p className="text-sm text-brand-text-muted mb-6">
          Replaces: <span className="text-accent-purple font-semibold">Marketing Agency (Campaigns) ($2,000-10,000/mo)</span>
        </p>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <input type="text" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Product/Service/Offer" className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"/>
            <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-accent-purple focus:border-transparent transition">
              <option>Facebook</option>
              <option>Google Ads</option>
              <option>Instagram</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg">
            {loading ? 'Generating Ads...' : 'Generate Ad Copy'}
          </button>
        </form>
      </div>
      {loading && <Loader />}
      {ads.length > 0 && (
        <div className="mt-6 space-y-6">
            {copySuccess && <div className="bg-green-100 text-green-800 text-sm font-semibold p-3 rounded-lg text-center shadow">{copySuccess}</div>}
            {ads.map((ad, index) => (
                <div key={index} className="bg-brand-card p-6 rounded-xl shadow-lg">
                    <div className="border-l-4 border-accent-purple pl-4">
                        <h3 className="text-lg font-bold text-brand-text">{ad.headline}</h3>
                        <p className="text-brand-text-muted my-2">{ad.description}</p>
                        <p className="text-accent-purple mt-2 font-semibold">{ad.cta}</p>
                    </div>

                    <div className="mt-4 bg-brand-light p-4 rounded-lg border border-brand-border">
                        <h4 className="text-sm font-semibold text-brand-text mb-2">Visual Suggestion</h4>
                        <p className="text-brand-text-muted text-sm italic mb-3">📷 {ad.visual_suggestion}</p>
                        {generatedImages[index] ? (
                            <img src={generatedImages[index]} alt={ad.visual_suggestion} className="rounded-md w-full h-auto mt-2" />
                        ) : (
                            <button onClick={() => handleGenerateImage(index, ad.visual_suggestion)} disabled={imageLoading === index} className="w-full text-sm bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50 shadow hover:shadow-md">
                                {imageLoading === index ? 'Generating...' : `Generate Image for Ad #${index + 1}`}
                            </button>
                        )}
                    </div>
                    
                    <button onClick={() => handleCopyAndPost(index, ad)} className="mt-4 w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                        Copy & Post to {platform}
                    </button>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};