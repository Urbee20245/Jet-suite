import React, { useState, useEffect } from 'react';
import type { Tool, ProfileData, KeywordData, WebsiteConnection, BlogPublication } from '../types';
import { generateLocalContent, suggestBlogTitles, generateImage } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { ResultDisplay } from '../components/ResultDisplay';
import { HowToUse } from '../components/HowToUse';
import { InformationCircleIcon, SparklesIcon, CheckCircleIcon, ArrowRightIcon } from '../components/icons/MiniIcons';
import { TOOLS } from '../constants';
import { AnalysisLoadingState } from '../components/AnalysisLoadingState';
import { getWebsiteConnections } from '../services/websiteService';
import { getSupabaseClient } from '../integrations/supabase/client';

interface JetContentProps {
  tool: Tool;
  initialProps: { keyword: KeywordData; type: string } | null;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null) => void;
}

export const JetContent: React.FC<JetContentProps> = ({ tool, initialProps, profileData, setActiveTool }) => {
  const [businessType] = useState(profileData.business.industry || '');
  const [topic, setTopic] = useState(initialProps?.keyword?.keyword || '');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestingTitles, setSuggestingTitles] = useState(false);
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);

  // Featured Image State
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);

  // Scheduling State
  const [showScheduling, setShowScheduling] = useState(false);
  const [websiteConnections, setWebsiteConnections] = useState<WebsiteConnection[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [success, setSuccess] = useState('');

  // SEO Optimization State
  const [showOptimization, setShowOptimization] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState<{
    keywords: string[];
    tags: string[];
    meta_description: string;
    slug: string;
  } | null>(null);

  useEffect(() => {
    if (initialProps?.keyword?.keyword) {
      setTopic(initialProps.keyword.keyword);
    }
  }, [initialProps]);

  useEffect(() => {
    loadWebsiteConnections();
  }, []);

  const loadWebsiteConnections = async () => {
    try {
      const connections = await getWebsiteConnections(profileData.user.id, profileData.business.id);
      setWebsiteConnections(connections.filter(c => c.is_active));
    } catch (err) {
      console.error('Error loading website connections:', err);
    }
  };

  const handleOptimizeSEO = async () => {
    try {
      setOptimizing(true);
      setError('');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/optimize-blog-keywords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          title: topic,
          content: result,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to optimize for SEO');
      }

      const data = await response.json();
      setOptimization({
        keywords: data.keywords,
        tags: data.tags,
        meta_description: data.meta_description,
        slug: data.slug,
      });
      setShowOptimization(true);
      setSuccess('SEO optimization complete!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error optimizing SEO:', err);
      setError(err.message || 'Failed to optimize for SEO. Please try again.');
    } finally {
      setOptimizing(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      setError('Please describe the image you want to generate');
      return;
    }

    try {
      setGeneratingImage(true);
      setError('');

      const base64Image = await generateImage(imagePrompt, '2K', '16:9');
      setFeaturedImage(`data:image/png;base64,${base64Image}`);
      setShowImagePrompt(false);
      setSuccess('Featured image generated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error generating image:', err);
      setError(err.message || 'Failed to generate image. Please try again.');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSchedulePost = async () => {
    if (!selectedWebsite) {
      setError('Please select a website to publish to');
      return;
    }
    if (!publishDate) {
      setError('Please select a publish date');
      return;
    }
    if (!publishTime) {
      setError('Please select a publish time');
      return;
    }

    try {
      setScheduling(true);
      setError('');

      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // Combine date and time
      const scheduledPublishAt = new Date(`${publishDate}T${publishTime}`).toISOString();

      // Extract excerpt from first paragraph of content
      const excerpt = result.split('\n\n')[1]?.substring(0, 200) || '';

      const blogPost: Partial<BlogPublication> = {
        user_id: profileData.user.id,
        business_id: profileData.business.id,
        website_connection_id: selectedWebsite,
        title: topic,
        content: result,
        excerpt,
        featured_image_url: featuredImage || undefined,
        featured_image_prompt: imagePrompt || undefined,
        scheduled_publish_at: scheduledPublishAt,
        status: 'scheduled',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        // Include optimization data if available
        optimized_keywords: optimization?.keywords || undefined,
        optimized_tags: optimization?.tags || undefined,
        meta_description: optimization?.meta_description || undefined,
        slug: optimization?.slug || undefined,
        auto_optimized: optimization ? true : false,
      };

      const { data, error: insertError } = await supabase
        .from('blog_publications')
        .insert([blogPost])
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSuccess(`Blog post scheduled for ${new Date(scheduledPublishAt).toLocaleString()}!`);
      setShowScheduling(false);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error scheduling post:', err);
      setError(err.message || 'Failed to schedule post. Please try again.');
    } finally {
      setScheduling(false);
    }
  };

  if (!businessType) {
    return (
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg text-center">
        <InformationCircleIcon className="w-12 h-12 mx-auto text-accent-blue" />
        <h2 className="text-2xl font-bold text-brand-text mt-4">Set Your Business Category</h2>
        <p className="text-brand-text-muted my-4 max-w-md mx-auto">
          Please add a category to your business profile (e.g., "Coffee Shop") to generate relevant content.
        </p>
        <button
          onClick={() => setActiveTool(TOOLS.find(t => t.id === 'businessdetails')!)}
          className="bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Go to Business Details
        </button>
      </div>
    );
  }

  const handleSuggestTitles = async () => {
    setSuggestingTitles(true);
    setError('');
    try {
        const titles = await suggestBlogTitles(profileData);
        setSuggestedTitles(titles);
    } catch (err) {
        setError('Failed to brainstorm titles. Please try again.');
    } finally {
        setSuggestingTitles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) {
      setError('Please provide a topic for the article.');
      return;
    }
    setError('');
    setLoading(true);
    setResult('');
    try {
      const brandStyle = profileData.brandDnaProfile?.visual_identity.layout_style || 'professional';
      const location = profileData.business.location || profileData.googleBusiness.address || 'Local Area';
      
      const analysis = await generateLocalContent(businessType, topic, location, brandStyle);
      setResult(analysis);
    } catch (err) {
      setError('Failed to generate content. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {showHowTo && (
        <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
            <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Use **Brainstorm Titles** to get AI-powered, SEO-optimized topic ideas.</li>
                <li>Your business details and location are automatically used for maximum local SEO impact.</li>
                <li>Each article includes a Meta Description and SEO-optimized heading structure.</li>
            </ul>
        </HowToUse>
      )}
      
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg border border-brand-border">
        <p className="text-brand-text-muted mb-6">{tool.description}</p>

        {/* Title Brainstorming Section */}
        <div className="mb-8 p-6 bg-accent-blue/5 rounded-xl border border-accent-blue/20">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-bold text-brand-text flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-accent-blue" />
                        Brainstorm SEO Blog Titles
                    </h3>
                    <p className="text-xs text-brand-text-muted mt-1">Get custom ideas based on your Business DNA and local area.</p>
                </div>
                <button
                    type="button"
                    onClick={handleSuggestTitles}
                    disabled={suggestingTitles}
                    className="bg-white border border-accent-blue text-accent-blue hover:bg-accent-blue hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                >
                    {suggestingTitles ? 'Thinking...' : 'Suggest Titles'}
                </button>
            </div>

            {suggestedTitles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {suggestedTitles.map((title, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setTopic(title)}
                            className={`text-left p-3 rounded-lg border text-sm transition-all flex justify-between items-center group ${
                                topic === title 
                                    ? 'bg-accent-blue border-accent-blue text-white' 
                                    : 'bg-white border-brand-border text-brand-text hover:border-accent-blue'
                            }`}
                        >
                            <span className="line-clamp-2">{title}</span>
                            {topic === title ? (
                                <CheckCircleIcon className="w-4 h-4 shrink-0" />
                            ) : (
                                <ArrowRightIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-brand-text-muted uppercase mb-2 ml-1">Business Category</label>
                    <div className="bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text font-semibold flex items-center">
                        {businessType}
                    </div>
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-brand-text-muted uppercase mb-2 ml-1">Target Location</label>
                    <div className="bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text font-semibold flex items-center">
                        {profileData.business.location || profileData.googleBusiness.address || 'Local Area'}
                    </div>
                </div>
            </div>
            
            <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-2 ml-1">Article Topic or Title</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Select a suggestion above or enter your own topic..."
                  className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition font-medium"
                />
            </div>
          </div>
          
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          
          <button
            type="submit"
            disabled={loading || !topic}
            className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:opacity-90 text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-lg"
          >
            {loading ? 'Writing SEO-Optimized Article...' : 'Generate Blog Post'}
          </button>
        </form>
      </div>
      
      {loading && (
          <AnalysisLoadingState 
            title="Generating SEO-Optimized Article"
            message="Our AI is researching local keywords and drafting your long-form content. This can take up to 5 minutes."
            durationEstimateSeconds={300}
          />
      )}
      
      {result && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <ResultDisplay markdownText={result} />

              {/* Success Message */}
              {success && (
                <div className="mt-4 bg-green-100 text-green-800 p-3 rounded-lg text-sm font-semibold">
                  {success}
                </div>
              )}

              {/* SEO Optimization Section */}
              <div className="mt-6 bg-brand-card p-6 rounded-xl border border-brand-border">
                <h3 className="font-bold text-brand-text mb-4 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-accent-blue" />
                  SEO Optimization
                </h3>

                {!optimization ? (
                  <button
                    onClick={handleOptimizeSEO}
                    disabled={optimizing}
                    className="w-full bg-white border-2 border-dashed border-brand-border hover:border-accent-blue text-brand-text px-4 py-3 rounded-lg font-semibold transition disabled:opacity-50"
                  >
                    {optimizing ? 'Optimizing with AI...' : '✨ Optimize Keywords & SEO'}
                  </button>
                ) : (
                  <div className="space-y-4">
                    {/* Keywords */}
                    <div>
                      <label className="block text-sm font-medium text-brand-text mb-2">
                        SEO Keywords (for categories)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {optimization.keywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            className="bg-accent-blue/10 text-accent-blue px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                          >
                            {keyword}
                            <button
                              onClick={() => {
                                const newKeywords = optimization.keywords.filter((_, i) => i !== idx);
                                setOptimization({ ...optimization, keywords: newKeywords });
                              }}
                              className="hover:text-accent-blue/70"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-brand-text mb-2">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {optimization.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-accent-purple/10 text-accent-purple px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                          >
                            {tag}
                            <button
                              onClick={() => {
                                const newTags = optimization.tags.filter((_, i) => i !== idx);
                                setOptimization({ ...optimization, tags: newTags });
                              }}
                              className="hover:text-accent-purple/70"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Meta Description */}
                    <div>
                      <label className="block text-sm font-medium text-brand-text mb-2">
                        Meta Description ({optimization.meta_description.length}/160 chars)
                      </label>
                      <textarea
                        value={optimization.meta_description}
                        onChange={(e) => {
                          const value = e.target.value.substring(0, 160);
                          setOptimization({ ...optimization, meta_description: value });
                        }}
                        className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text text-sm"
                        rows={2}
                        maxLength={160}
                      />
                    </div>

                    {/* Slug */}
                    <div>
                      <label className="block text-sm font-medium text-brand-text mb-2">
                        URL Slug
                      </label>
                      <input
                        type="text"
                        value={optimization.slug}
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
                          setOptimization({ ...optimization, slug: value });
                        }}
                        className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text font-mono text-sm"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleOptimizeSEO}
                        disabled={optimizing}
                        className="flex-1 bg-brand-light text-brand-text px-4 py-2 rounded-lg font-semibold hover:bg-brand-border transition disabled:opacity-50"
                      >
                        {optimizing ? 'Re-optimizing...' : '↻ Re-optimize'}
                      </button>
                      <button
                        onClick={() => {
                          setOptimization(null);
                          setShowOptimization(false);
                        }}
                        className="px-4 py-2 text-red-500 hover:text-red-700 font-semibold transition"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Featured Image Section */}
              <div className="mt-6 bg-brand-card p-6 rounded-xl border border-brand-border">
                <h3 className="font-bold text-brand-text mb-4 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-accent-purple" />
                  Featured Image
                </h3>

                {featuredImage ? (
                  <div>
                    <img
                      src={featuredImage}
                      alt="Featured"
                      className="w-full rounded-lg border border-brand-border mb-3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setFeaturedImage('');
                          setImagePrompt('');
                          setShowImagePrompt(true);
                        }}
                        className="flex-1 bg-brand-light text-brand-text px-4 py-2 rounded-lg font-semibold hover:bg-brand-border transition"
                      >
                        Regenerate
                      </button>
                      <button
                        onClick={() => setFeaturedImage('')}
                        className="px-4 py-2 text-red-500 hover:text-red-700 font-semibold transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : showImagePrompt ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="Describe the image you want (e.g., 'modern coffee shop interior with natural lighting')"
                      className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleGenerateImage}
                        disabled={generatingImage}
                        className="flex-1 bg-gradient-to-r from-accent-blue to-accent-purple text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50"
                      >
                        {generatingImage ? 'Generating...' : 'Generate Image'}
                      </button>
                      <button
                        onClick={() => setShowImagePrompt(false)}
                        className="px-4 py-2 text-brand-text-muted hover:text-brand-text font-semibold transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowImagePrompt(true)}
                    className="w-full bg-white border-2 border-dashed border-brand-border hover:border-accent-purple text-brand-text px-4 py-3 rounded-lg font-semibold transition"
                  >
                    + Generate Featured Image
                  </button>
                )}
              </div>

              {/* Scheduling Section */}
              {websiteConnections.length > 0 && (
                <div className="mt-6 bg-brand-card p-6 rounded-xl border border-brand-border">
                  <h3 className="font-bold text-brand-text mb-4 flex items-center gap-2">
                    📅 Schedule Blog Post
                  </h3>

                  {!showScheduling ? (
                    <button
                      onClick={() => setShowScheduling(true)}
                      className="w-full bg-white border-2 border-dashed border-brand-border hover:border-accent-blue text-brand-text px-4 py-3 rounded-lg font-semibold transition"
                    >
                      + Schedule to Connected Website
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-brand-text mb-2">
                          Publish To
                        </label>
                        <select
                          value={selectedWebsite}
                          onChange={(e) => setSelectedWebsite(e.target.value)}
                          className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text"
                        >
                          <option value="">Select a website...</option>
                          {websiteConnections.map((conn) => (
                            <option key={conn.id} value={conn.id}>
                              {conn.site_name} ({conn.platform})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-brand-text mb-2">
                            Publish Date
                          </label>
                          <input
                            type="date"
                            value={publishDate}
                            onChange={(e) => setPublishDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-brand-text mb-2">
                            Publish Time
                          </label>
                          <input
                            type="time"
                            value={publishTime}
                            onChange={(e) => setPublishTime(e.target.value)}
                            className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleSchedulePost}
                          disabled={scheduling}
                          className="flex-1 bg-gradient-to-r from-accent-blue to-accent-purple text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50"
                        >
                          {scheduling ? 'Scheduling...' : 'Schedule Post'}
                        </button>
                        <button
                          onClick={() => setShowScheduling(false)}
                          className="px-4 py-2 text-brand-text-muted hover:text-brand-text font-semibold transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {websiteConnections.length === 0 && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <p className="font-semibold mb-1">💡 Connect a Website to Schedule Posts</p>
                  <p>Go to Business Details → Connect Websites to set up WordPress, Squarespace, or Wix publishing.</p>
                </div>
              )}

              <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => {
                        navigator.clipboard.writeText(result);
                        alert('Article copied to clipboard!');
                    }}
                    className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-700 transition-colors"
                  >
                      Copy Entire Article
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};