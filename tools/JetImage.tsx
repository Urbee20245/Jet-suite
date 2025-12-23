
import React, { useState, useEffect } from 'react';
import type { Tool } from '../types';
import { generateImage } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { HowToUse } from '../components/HowToUse';

interface JetImageProps {
  tool: Tool;
}

type ImageSize = '1K' | '2K' | '4K';

// Global declarations removed - using standard GEMINI_API_KEY from environment

export const JetImage: React.FC<JetImageProps> = ({ tool }) => {
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) {
      setError('Please enter a prompt to generate an image.');
      return;
    }
    setError('');
    setLoading(true);
    setImageUrl(null);
    try {
      const base64Data = await generateImage(prompt, imageSize);
      setImageUrl(`data:image/png;base64,${base64Data}`);
    } catch (err: any) {
      console.error(err);
      setError('Failed to generate image. Please try again or refine your prompt.');
    } finally {
      setLoading(false);
    }
  };

  // JetImage uses the existing GEMINI_API_KEY from environment
  // No separate API key selection needed since we're already authenticated

  return (
    <div>
      {showHowTo && (
        <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
            <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Describe the image you want to create (logo, social media graphic, banner, etc.)</li>
                <li>Select a style (modern, minimalist, bold, playful, professional)</li>
                <li>Choose dimensions based on your use case (1K is fastest, 4K for high quality)</li>
                <li>Click 'Generate Image' and wait for AI to create your visual</li>
                <li>Download the image or regenerate with adjusted prompts</li>
            </ul>
        </HowToUse>
      )}
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <p className="text-brand-text-muted mb-2">{tool.description}</p>
        <p className="text-sm text-brand-text-muted mb-6">
          Replaces: <span className="text-accent-purple font-semibold">Graphic Designer ($1,000-3,000/mo)</span>
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="prompt" className="block text-sm font-medium text-brand-text mb-2">Image Prompt</label>
            <textarea
              id="prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A futuristic cityscape at sunset, neon lights"
              className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
            />
          </div>
          <div className="mb-6">
            <span className="block text-sm font-medium text-brand-text mb-2">Image Size</span>
            <div className="flex space-x-2">
                {(['1K', '2K', '4K'] as ImageSize[]).map(size => (
                    <button type="button" key={size} onClick={() => setImageSize(size)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${imageSize === size ? 'bg-accent-purple text-white shadow' : 'bg-brand-light text-brand-text-muted hover:bg-gray-200'}`}>
                        {size}
                    </button>
                ))}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? 'Generating...' : 'Generate Image'}
          </button>
        </form>
      </div>
      {loading && <Loader />}
      {imageUrl && (
        <div className="mt-6 bg-brand-card p-6 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold mb-4 text-brand-text">Generated Image</h3>
          <img src={imageUrl} alt={prompt} className="rounded-lg w-full h-auto" />
        </div>
      )}
    </div>
  );
};
