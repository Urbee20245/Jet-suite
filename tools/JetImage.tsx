import React, { useState, useRef } from 'react';
import type { Tool } from '../types';
import { generateImage } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { HowToUse } from '../components/HowToUse';
import { ArrowUpTrayIcon, XCircleIcon } from '../components/icons/MiniIcons';

interface JetImageProps {
  tool: Tool;
}

type ImageSize = '1K' | '2K' | '4K';

export const JetImage: React.FC<JetImageProps> = ({ tool }) => {
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);

  const [inputImage, setInputImage] = useState<{ base64: string; mimeType: string; dataUrl: string; } | null>(null);
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
    if (!prompt) {
      setError('Please enter a prompt to describe the image you want to generate.');
      return;
    }
    setError('');
    setLoading(true);
    setImageUrl(null);
    try {
      const base64Data = await generateImage(prompt, imageSize, "1:1", inputImage || undefined);
      setImageUrl(`data:image/png;base64,${base64Data}`);
    } catch (err: any) {
      console.error(err);
      setError('Failed to generate image. Please try again or refine your prompt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {showHowTo && (
        <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>
              <strong>Text-to-Image:</strong> Describe the image you want to create. Be specific with details, style, and colors.
            </li>
            <li>
              <strong>Image-to-Image (New!):</strong> Upload an image and provide a prompt describing how to modify it (e.g., "turn this person into a cartoon character" or "place this car in a futuristic city").
            </li>
            <li>Choose dimensions based on your use case (1K is fastest, 4K for high quality).</li>
            <li>Click 'Generate Image' and wait for the AI to create your visual.</li>
          </ul>
        </HowToUse>
      )}
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <p className="text-brand-text-muted mb-2">{tool.description}</p>
        <p className="text-sm text-brand-text-muted mb-6">
          Replaces: <span className="text-accent-purple font-semibold">Graphic Designer ($1,000-3,000/mo)</span>
        </p>
        <form onSubmit={handleSubmit}>
          {/* Image Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-brand-text mb-2">Upload an Image (Optional)</label>
            {inputImage ? (
              <div className="relative group">
                <img src={inputImage.dataUrl} alt="Input preview" className="w-32 h-32 object-cover rounded-lg border-2 border-brand-border" />
                <button
                  type="button"
                  onClick={clearInputImage}
                  className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 hover:text-red-700 transition-transform group-hover:scale-110"
                >
                  <XCircleIcon className="w-7 h-7" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-brand-border rounded-lg p-6 text-center cursor-pointer hover:border-accent-purple hover:bg-brand-light transition-colors"
              >
                <ArrowUpTrayIcon className="w-8 h-8 mx-auto text-brand-text-muted" />
                <p className="mt-2 text-sm text-brand-text">Click to upload or drag & drop</p>
                <p className="text-xs text-brand-text-muted">PNG, JPG, GIF up to 10MB</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            )}
          </div>

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
          <a
            href={imageUrl}
            download={`${prompt.substring(0, 20).replace(/\s/g, '_')}.png`}
            className="mt-4 inline-block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            Download Image
          </a>
        </div>
      )}
    </div>
  );
};