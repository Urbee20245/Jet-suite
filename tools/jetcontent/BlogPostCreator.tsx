import React, { useState, useEffect } from 'react';
import type { ProfileData, KeywordData, WebsiteConnection, BlogPublication } from '../../types';
import { generateLocalContent, suggestBlogTitles, generateImage } from '../../services/geminiService';
import { Loader } from '../../components/Loader';
import { ResultDisplay } from '../../components/ResultDisplay';
import { SparklesIcon, CheckCircleIcon, ArrowRightIcon } from '../../components/icons/MiniIcons';
import { AnalysisLoadingState } from '../../components/AnalysisLoadingState';
import { getWebsiteConnections } from '../../services/websiteService';
import { getSupabaseClient } from '../../integrations/supabase/client';

interface BlogPostCreatorProps {
  profileData: ProfileData;
  initialKeyword?: KeywordData | null;
}

export const BlogPostCreator: React.FC<BlogPostCreatorProps> = ({ profileData, initialKeyword }) => {
  const [businessType] = useState(profileData.business.industry || '');
  const [topic, setTopic] = useState(initialKeyword?.keyword || '');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestingTitles, setSuggestingTitles] = useState(false);
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [error, setError] = useState('');

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
    if (initialKeyword?.keyword) {
      setTopic(initialKeyword.keyword);
    }
  }, [initialKeyword]);

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
        content_type: 'blog_post',
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
      // Keep success message visible longer to allow user to create another post
      setTimeout(() => setSuccess(''), 10000);
    } catch (err: any) {
      console.error('Error scheduling post:', err);
      setError(err.message || 'Failed to schedule post. Please try again.');
    } finally {
      setScheduling(false);
    }
  };

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

      // Auto-generate SEO optimization after content is created
      setTimeout(() => {
        handleOptimizeSEO();
      }, 500);

      // Auto-generate featured image from blog content
      setTimeout(() => {
        autoGenerateFeaturedImage(analysis);
      }, 1000);
    } catch (err) {
      setError('Failed to generate content. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const autoGenerateFeaturedImage = async (content: string) => {
    try {
      // Extract a description from the first paragraph of the blog post
      const firstParagraph = content.split('\n\n').find(p => p.trim().length > 50) || '';
      const autoPrompt = `Professional blog featured image for: ${topic}. ${firstParagraph.substring(0, 200)}`;

      setImagePrompt(autoPrompt);
      setGeneratingImage(true);

      const base64Image = await generateImage(autoPrompt, '2K', '16:9');
      setFeaturedImage(`data:image/png;base64,${base64Image}`);
      setShowImagePrompt(false);
    } catch (err: any) {
      console.error('Error auto-generating image:', err);
      // Don't show error to user, just make the generate button available
      setShowImagePrompt(false);
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg border border-brand-border/50">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-brand-text mb-2">Create Blog Post</h2>
          <p className="text-sm text-brand-text-muted leading-relaxed">
            Generate SEO-optimized blog posts that drive organic traffic and engage your audience.
          </p>
        </div>

        {/* Title Brainstorming Section */}
        <div className="mb-8 p-6 bg-accent-blue/5 rounded-xl border border-accent-blue/15">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-brand-text text-sm flex items-center gap-2">
                <SparklesIcon className="w-4.5 h-4.5 text-accent-blue" />
                Brainstorm SEO Blog Titles
              </h3>
              <p className="text-xs text-brand-text-muted mt-1.5 leading-relaxed">Get custom ideas based on your Business DNA and local area.</p>
            </div>
            <button
              type="button"
              onClick={handleSuggestTitles}
              disabled={suggestingTitles}
              className="bg-white border border-accent-blue/30 text-accent-blue hover:bg-accent-blue hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md"
            >
              {suggestingTitles ? 'Thinking...' : 'Suggest Titles'}
            </button>
          </div>

          {suggestedTitles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-5">
              {suggestedTitles.map((title, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTopic(title)}
                  className={`text-left p-3.5 rounded-xl border text-sm transition-all duration-200 flex justify-between items-center group ${topic === title
                      ? 'bg-accent-blue border-accent-blue text-white shadow-md shadow-accent-blue/20'
                      : 'bg-white border-brand-border text-brand-text hover:border-accent-blue/40 hover:shadow-sm'
                    }`}
                >
                  <span className="line-clamp-2 leading-relaxed">{title}</span>
                  {topic === title ? (
                    <CheckCircleIcon className="w-4 h-4 shrink-0 ml-2" />
                  ) : (
                    <ArrowRightIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2 ml-0.5">Business Category</label>
                <div className="bg-brand-light border border-brand-border rounded-lg px-3.5 py-3 text-sm text-brand-text font-semibold flex items-center">
                  {businessType}
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2 ml-0.5">Target Location</label>
                <div className="bg-brand-light border border-brand-border rounded-lg px-3.5 py-3 text-sm text-brand-text font-semibold flex items-center">
                  {profileData.business.location || profileData.googleBusiness.address || 'Local Area'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2 ml-0.5">Article Topic or Title</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Select a suggestion above or enter your own topic..."
                className="w-full bg-brand-light border border-brand-border rounded-lg px-3.5 py-3 text-brand-text text-sm placeholder-brand-text-muted/50 focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple/50 transition-all duration-200 outline-none font-medium"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm border border-red-200/60 flex items-start gap-2.5">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !topic}
            className="w-full bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:shadow-accent-purple/20 active:scale-[0.99] text-base"
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
            <div className="mt-5 space-y-3">
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-medium border border-green-200/60 flex items-start gap-2.5">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span className="flex-1">{success}</span>
              </div>
              {success.includes('scheduled') && (
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      // Reset the form to create a new post
                      setTopic('');
                      setResult('');
                      setFeaturedImage('');
                      setImagePrompt('');
                      setOptimization(null);
                      setShowOptimization(false);
                      setShowScheduling(false);
                      setShowImagePrompt(false);
                      setSuccess('');
                      setSuggestedTitles([]);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-gradient-to-r from-accent-blue to-accent-purple text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:shadow-lg hover:shadow-accent-purple/20 transition-all duration-200 active:scale-[0.99]"
                  >
                    + Create Another Blog Post
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SEO Optimization Section */}
          <div className="mt-6 bg-brand-card p-6 rounded-xl border border-brand-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-brand-text text-sm flex items-center gap-2">
                <SparklesIcon className="w-4.5 h-4.5 text-accent-blue" />
                SEO Optimization
              </h3>
              {!optimization && !optimizing && (
                <span className="text-xs text-accent-blue/70 font-medium">Auto-generated</span>
              )}
            </div>

            {!optimization ? (
              <button
                onClick={handleOptimizeSEO}
                disabled={optimizing}
                className="w-full bg-white border-2 border-dashed border-brand-border/60 hover:border-accent-blue/40 text-brand-text px-4 py-4 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 hover:shadow-sm"
              >
                {optimizing ? 'Optimizing with AI...' : 'Optimize Keywords & SEO'}
              </button>
            ) : (
              <div className="space-y-5">
                {/* Keywords */}
                <div>
                  <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2.5">
                    SEO Keywords (for categories)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {optimization.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="bg-accent-blue/8 text-accent-blue px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border border-accent-blue/15 transition-all duration-200 hover:bg-accent-blue/12"
                      >
                        {keyword}
                        <button
                          onClick={() => {
                            const newKeywords = optimization.keywords.filter((_, i) => i !== idx);
                            setOptimization({ ...optimization, keywords: newKeywords });
                          }}
                          className="hover:text-accent-blue/70 text-accent-blue/50 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2.5">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {optimization.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-accent-purple/8 text-accent-purple px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border border-accent-purple/15 transition-all duration-200 hover:bg-accent-purple/12"
                      >
                        {tag}
                        <button
                          onClick={() => {
                            const newTags = optimization.tags.filter((_, i) => i !== idx);
                            setOptimization({ ...optimization, tags: newTags });
                          }}
                          className="hover:text-accent-purple/70 text-accent-purple/50 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Meta Description */}
                <div>
                  <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">
                    Meta Description ({optimization.meta_description.length}/160 chars)
                  </label>
                  <textarea
                    value={optimization.meta_description}
                    onChange={(e) => {
                      const value = e.target.value.substring(0, 160);
                      setOptimization({ ...optimization, meta_description: value });
                    }}
                    className="w-full bg-brand-light border border-brand-border rounded-lg px-3.5 py-3 text-brand-text text-sm focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple/50 transition-all duration-200 outline-none"
                    rows={2}
                    maxLength={160}
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={optimization.slug}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
                      setOptimization({ ...optimization, slug: value });
                    }}
                    className="w-full bg-brand-light border border-brand-border rounded-lg px-3.5 py-3 text-brand-text font-mono text-sm focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple/50 transition-all duration-200 outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleOptimizeSEO}
                    disabled={optimizing}
                    className="flex-1 bg-brand-light text-brand-text px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-border transition-all duration-200 disabled:opacity-50"
                  >
                    {optimizing ? 'Re-optimizing...' : 'Re-optimize'}
                  </button>
                  <button
                    onClick={() => {
                      setOptimization(null);
                      setShowOptimization(false);
                    }}
                    className="px-4 py-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 font-semibold text-sm rounded-lg transition-all duration-200"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Featured Image Section */}
          <div className="mt-6 bg-brand-card p-6 rounded-xl border border-brand-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-brand-text text-sm flex items-center gap-2">
                <SparklesIcon className="w-4.5 h-4.5 text-accent-purple" />
                Featured Image
              </h3>
              {!featuredImage && !showImagePrompt && !generatingImage && (
                <span className="text-xs text-accent-purple/70 font-medium">Auto-generated</span>
              )}
            </div>

            {featuredImage ? (
              <div>
                <div className="relative group">
                  <img
                    src={featuredImage}
                    alt="Featured"
                    className="w-full max-w-2xl mx-auto h-48 object-cover rounded-xl border border-brand-border/50 shadow-sm"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                      Preview (16:9 ratio)
                    </span>
                  </div>
                </div>
                {imagePrompt && (
                  <p className="text-xs text-brand-text-muted mt-3 mb-4 italic">
                    Generated from: "{imagePrompt.substring(0, 100)}{imagePrompt.length > 100 ? '...' : ''}"
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setShowImagePrompt(true);
                    }}
                    className="flex-1 bg-brand-light text-brand-text px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-border transition-all duration-200"
                  >
                    Customize Image
                  </button>
                  <button
                    onClick={() => {
                      setFeaturedImage('');
                      setImagePrompt('');
                    }}
                    className="px-4 py-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 font-semibold text-sm rounded-lg transition-all duration-200"
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
                  className="w-full bg-brand-light border border-brand-border rounded-lg px-3.5 py-3 text-brand-text text-sm placeholder-brand-text-muted/50 focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple/50 transition-all duration-200 outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateImage}
                    disabled={generatingImage}
                    className="flex-1 bg-gradient-to-r from-accent-blue to-accent-purple text-white px-4 py-2.5 rounded-lg font-bold text-sm hover:shadow-lg hover:shadow-accent-purple/20 transition-all duration-200 disabled:opacity-50 active:scale-[0.99]"
                  >
                    {generatingImage ? 'Generating...' : 'Generate Image'}
                  </button>
                  <button
                    onClick={() => setShowImagePrompt(false)}
                    className="px-4 py-2.5 text-brand-text-muted hover:text-brand-text hover:bg-brand-light font-semibold text-sm rounded-lg transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowImagePrompt(true)}
                className="w-full bg-white border-2 border-dashed border-brand-border/60 hover:border-accent-purple/40 text-brand-text px-4 py-4 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-sm"
              >
                + Generate Featured Image
              </button>
            )}
          </div>

          {/* Scheduling Section */}
          {websiteConnections.length > 0 && (
            <div className="mt-6 bg-brand-card p-6 rounded-xl border border-brand-border/50 shadow-sm">
              <h3 className="font-bold text-brand-text text-sm mb-5 flex items-center gap-2">
                <svg className="w-4.5 h-4.5 text-accent-blue" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                Schedule Blog Post
              </h3>

              {!showScheduling ? (
                <button
                  onClick={() => setShowScheduling(true)}
                  className="w-full bg-white border-2 border-dashed border-brand-border/60 hover:border-accent-blue/40 text-brand-text px-4 py-4 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-sm"
                >
                  + Schedule to Connected Website
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">
                      Publish To
                    </label>
                    <select
                      value={selectedWebsite}
                      onChange={(e) => setSelectedWebsite(e.target.value)}
                      className="w-full bg-brand-light border border-brand-border rounded-lg px-3.5 py-3 text-brand-text text-sm focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-200 outline-none"
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
                      <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">
                        Publish Date
                      </label>
                      <input
                        type="date"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full bg-brand-light border border-brand-border rounded-lg px-3.5 py-3 text-brand-text text-sm focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">
                        Publish Time
                      </label>
                      <input
                        type="time"
                        value={publishTime}
                        onChange={(e) => setPublishTime(e.target.value)}
                        className="w-full bg-brand-light border border-brand-border rounded-lg px-3.5 py-3 text-brand-text text-sm focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-200 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSchedulePost}
                      disabled={scheduling}
                      className="flex-1 bg-gradient-to-r from-accent-blue to-accent-purple text-white px-4 py-2.5 rounded-lg font-bold text-sm hover:shadow-lg hover:shadow-accent-purple/20 transition-all duration-200 disabled:opacity-50 active:scale-[0.99]"
                    >
                      {scheduling ? 'Scheduling...' : 'Schedule Post'}
                    </button>
                    <button
                      onClick={() => setShowScheduling(false)}
                      className="px-4 py-2.5 text-brand-text-muted hover:text-brand-text hover:bg-brand-light font-semibold text-sm rounded-lg transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {websiteConnections.length === 0 && (
            <div className="mt-6 bg-accent-blue/5 border border-accent-blue/15 rounded-xl px-5 py-4 text-sm">
              <p className="font-bold text-xs text-accent-blue">Connect a Website to Schedule Posts</p>
              <p className="text-xs text-accent-blue/70 mt-1 leading-relaxed">Go to Business Details → Connect Websites to set up WordPress, Squarespace, or Wix publishing.</p>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                navigator.clipboard.writeText(result);
                alert('Article copied to clipboard!');
              }}
              className="bg-brand-text text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-brand-text/90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              Copy Entire Article
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
