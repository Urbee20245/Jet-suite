import React, { useState, useEffect } from 'react';
import type { ProfileData, KeywordData, WebsiteConnection, BlogPublication } from '../../types';
import { generateLocalContent, suggestBlogTitles, generateImage } from '../../services/geminiService';
import { Loader } from '../../components/Loader';
import { ResultDisplay } from '../../components/ResultDisplay';
import { BlogPostPreview } from '../../components/BlogPostPreview';
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

  // Batch Mode State
  const [batchMode, setBatchMode] = useState(false);
  const [batchTopics, setBatchTopics] = useState<string[]>(['', '', '']);
  const [batchResults, setBatchResults] = useState<Array<{ topic: string; content: string; image: string; seo: any } | null>>([]);
  const [batchGenerating, setBatchGenerating] = useState(false);

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
          title: topic || 'Untitled Blog Post',
          content: result || 'No content available',
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

  const handleBatchGenerate = async () => {
    const validTopics = batchTopics.filter(t => t.trim() !== '');
    if (validTopics.length === 0) {
      setError('Please enter at least one topic for batch generation');
      return;
    }

    setBatchGenerating(true);
    setError('');
    const results: Array<{ topic: string; content: string; image: string; seo: any } | null> = [];

    for (let i = 0; i < validTopics.length; i++) {
      const currentTopic = validTopics[i];
      try {
        const brandStyle = profileData.brandDnaProfile?.visual_identity.layout_style || 'professional';
        const location = profileData.business.location || profileData.googleBusiness.address || 'Local Area';

        // Generate blog post content
        const content = await generateLocalContent(businessType, currentTopic, location, brandStyle);

        // Generate SEO
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        let seoData = null;
        try {
          const seoResponse = await fetch(`${supabaseUrl}/functions/v1/optimize-blog-keywords`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              title: currentTopic,
              content: content,
            }),
          });
          if (seoResponse.ok) {
            seoData = await seoResponse.json();
          }
        } catch (e) {
          console.error('SEO generation failed for topic:', currentTopic, e);
        }

        // Generate featured image
        let imageData = '';
        try {
          const firstParagraph = content.split('\n\n').find(p => p.trim().length > 50) || '';
          const autoPrompt = `Professional blog featured image for: ${currentTopic}. ${firstParagraph.substring(0, 200)}`;
          const base64Image = await generateImage(autoPrompt, '2K', '16:9');
          imageData = `data:image/png;base64,${base64Image}`;
        } catch (e) {
          console.error('Image generation failed for topic:', currentTopic, e);
        }

        results.push({
          topic: currentTopic,
          content,
          image: imageData,
          seo: seoData,
        });
      } catch (err) {
        console.error(`Failed to generate content for topic: ${currentTopic}`, err);
        results.push(null);
      }
    }

    setBatchResults(results);
    setBatchGenerating(false);
    setSuccess(`Generated ${results.filter(r => r !== null).length} blog posts!`);
    setTimeout(() => setSuccess(''), 5000);
  };

  const handleBatchSchedule = async (index: number) => {
    const result = batchResults[index];
    if (!result) return;

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
      const excerpt = result.content.split('\n\n')[1]?.substring(0, 200) || '';

      const blogPost: Partial<BlogPublication> = {
        user_id: profileData.user.id,
        business_id: profileData.business.id,
        website_connection_id: selectedWebsite,
        title: result.topic,
        content: result.content,
        excerpt,
        featured_image_url: result.image || undefined,
        featured_image_prompt: result.image ? `Auto-generated for ${result.topic}` : undefined,
        scheduled_publish_at: scheduledPublishAt,
        status: 'scheduled',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        content_type: 'blog_post',
        // Include optimization data if available
        optimized_keywords: result.seo?.keywords || undefined,
        optimized_tags: result.seo?.tags || undefined,
        meta_description: result.seo?.meta_description || undefined,
        slug: result.seo?.slug || undefined,
        auto_optimized: result.seo ? true : false,
      };

      const { data, error: insertError } = await supabase
        .from('blog_publications')
        .insert([blogPost])
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSuccess(`Blog post "${result.topic}" scheduled for ${new Date(scheduledPublishAt).toLocaleString()}!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error scheduling post:', err);
      setError(err.message || 'Failed to schedule post. Please try again.');
    } finally {
      setScheduling(false);
    }
  };

  const handleScheduleAllBatch = async () => {
    if (!selectedWebsite) {
      setError('Please select a website to publish to');
      return;
    }
    if (!publishDate) {
      setError('Please select a starting publish date');
      return;
    }

    try {
      setScheduling(true);
      setError('');

      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const validResults = batchResults.filter(r => r !== null);
      const blogPosts: Partial<BlogPublication>[] = [];

      // Schedule posts across the month, evenly distributed
      const startDate = new Date(publishDate);
      const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
      const interval = Math.floor(daysInMonth / validResults.length);

      validResults.forEach((result, index) => {
        if (!result) return;

        // Calculate publish date
        const scheduleDate = new Date(startDate);
        scheduleDate.setDate(startDate.getDate() + (index * interval));
        scheduleDate.setHours(10, 0, 0, 0); // Default to 10 AM

        const excerpt = result.content.split('\n\n')[1]?.substring(0, 200) || '';

        blogPosts.push({
          user_id: profileData.user.id,
          business_id: profileData.business.id,
          website_connection_id: selectedWebsite,
          title: result.topic,
          content: result.content,
          excerpt,
          featured_image_url: result.image || undefined,
          featured_image_prompt: result.image ? `Auto-generated for ${result.topic}` : undefined,
          scheduled_publish_at: scheduleDate.toISOString(),
          status: 'scheduled',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          content_type: 'blog_post',
          optimized_keywords: result.seo?.keywords || undefined,
          optimized_tags: result.seo?.tags || undefined,
          meta_description: result.seo?.meta_description || undefined,
          slug: result.seo?.slug || undefined,
          auto_optimized: result.seo ? true : false,
        });
      });

      const { data, error: insertError } = await supabase
        .from('blog_publications')
        .insert(blogPosts);

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSuccess(`Successfully scheduled ${blogPosts.length} blog posts across the month!`);
      // Reset batch mode
      setBatchResults([]);
      setBatchTopics(['', '', '']);
      setTimeout(() => setSuccess(''), 10000);
    } catch (err: any) {
      console.error('Error scheduling batch posts:', err);
      setError(err.message || 'Failed to schedule batch posts. Please try again.');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
        {/* Card gradient header */}
        <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center shrink-0">
            <SparklesIcon className="w-4.5 h-4.5 text-accent-blue" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-brand-text">Create Blog Post</h2>
            <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">
              Generate SEO-optimized blog posts that drive organic traffic and engage your audience.
            </p>
          </div>
          <button
            onClick={() => {
              setBatchMode(!batchMode);
              if (!batchMode) {
                // Reset regular mode
                setResult('');
                setTopic('');
              } else {
                // Reset batch mode
                setBatchResults([]);
                setBatchTopics(['', '', '']);
              }
            }}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
              batchMode
                ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white shadow-md'
                : 'bg-brand-light text-brand-text hover:bg-brand-border'
            }`}
          >
            {batchMode ? '✓ Batch Mode' : 'Batch Mode'}
          </button>
        </div>
        <div className="p-6 sm:p-8">

        {/* Batch Mode UI */}
        {batchMode ? (
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-br from-accent-blue/5 to-accent-purple/5 rounded-xl border border-accent-blue/15">
              <h3 className="font-bold text-brand-text mb-4 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-accent-blue" />
                Batch Create Blog Posts
              </h3>
              <p className="text-sm text-brand-text-muted mb-6 leading-relaxed">
                Generate multiple blog posts at once. Each post will include auto-generated SEO optimization and featured images.
                Schedule them across the month for consistent content.
              </p>

              {/* AI Generate Topics Button */}
              <div className="mb-6 p-4 bg-white rounded-lg border border-accent-purple/20">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <SparklesIcon className="w-4 h-4 text-accent-purple" />
                      <h4 className="font-semibold text-brand-text text-sm">AI Topic Generator</h4>
                    </div>
                    <p className="text-xs text-brand-text-muted">
                      Let AI suggest SEO-optimized blog topics tailored to your business
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      setSuggestingTitles(true);
                      setError('');
                      try {
                        const titles = await suggestBlogTitles(profileData);
                        // Replace empty topics with AI suggestions
                        const newTopics = [...batchTopics];
                        let filledCount = 0;
                        for (let i = 0; i < newTopics.length && filledCount < titles.length; i++) {
                          if (!newTopics[i].trim()) {
                            newTopics[i] = titles[filledCount];
                            filledCount++;
                          }
                        }
                        // If we have more suggestions than empty slots, add them
                        for (let i = filledCount; i < titles.length && newTopics.length < 10; i++) {
                          newTopics.push(titles[i]);
                        }
                        setBatchTopics(newTopics);
                      } catch (err) {
                        setError('Failed to generate topics. Please try again.');
                      } finally {
                        setSuggestingTitles(false);
                      }
                    }}
                    disabled={suggestingTitles}
                    className="px-4 py-2 bg-gradient-to-r from-accent-purple to-accent-blue text-white rounded-lg font-semibold text-xs hover:shadow-md transition-all duration-200 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                  >
                    <SparklesIcon className="w-3.5 h-3.5" />
                    {suggestingTitles ? 'Generating...' : 'Generate Topics'}
                  </button>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {batchTopics.map((topic, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => {
                        const newTopics = [...batchTopics];
                        newTopics[index] = e.target.value;
                        setBatchTopics(newTopics);
                      }}
                      placeholder={`Blog post topic ${index + 1}...`}
                      className="flex-1 bg-brand-light border border-brand-border rounded-lg px-3.5 py-3 text-brand-text text-sm placeholder-brand-text-muted/50 focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple/50 transition-all duration-200 outline-none"
                    />
                    {index === batchTopics.length - 1 && batchTopics.length < 10 && (
                      <button
                        onClick={() => setBatchTopics([...batchTopics, ''])}
                        className="bg-accent-blue text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-blue/90 transition-all duration-200"
                      >
                        +
                      </button>
                    )}
                    {batchTopics.length > 1 && (
                      <button
                        onClick={() => {
                          const newTopics = batchTopics.filter((_, i) => i !== index);
                          setBatchTopics(newTopics);
                        }}
                        className="bg-red-50 text-red-500 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-red-100 transition-all duration-200"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleBatchGenerate}
                disabled={batchGenerating || batchTopics.filter(t => t.trim()).length === 0}
                className="w-full bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:shadow-accent-purple/20 active:scale-[0.99] text-base"
              >
                {batchGenerating ? 'Generating Blog Posts...' : `Generate ${batchTopics.filter(t => t.trim()).length} Blog Post${batchTopics.filter(t => t.trim()).length !== 1 ? 's' : ''}`}
              </button>
            </div>

            {/* Batch Results */}
            {batchResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-brand-text">Generated Blog Posts ({batchResults.filter(r => r !== null).length})</h3>
                  {websiteConnections.length > 0 && (
                    <button
                      onClick={() => {
                        if (!selectedWebsite) {
                          setError('Please select a website below');
                          return;
                        }
                        if (!publishDate) {
                          setError('Please select a starting date below');
                          return;
                        }
                        handleScheduleAllBatch();
                      }}
                      disabled={scheduling || batchResults.filter(r => r !== null).length === 0}
                      className="bg-gradient-to-r from-accent-blue to-accent-purple text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:shadow-lg hover:shadow-accent-purple/20 transition-all duration-200 disabled:opacity-50"
                    >
                      {scheduling ? 'Scheduling...' : 'Schedule All Across Month'}
                    </button>
                  )}
                </div>

                {websiteConnections.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-brand-light rounded-xl">
                    <div>
                      <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">
                        Publish To
                      </label>
                      <select
                        value={selectedWebsite}
                        onChange={(e) => setSelectedWebsite(e.target.value)}
                        className="w-full bg-white border border-brand-border rounded-lg px-3.5 py-3 text-brand-text text-sm focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-200 outline-none"
                      >
                        <option value="">Select a website...</option>
                        {websiteConnections.map((conn) => (
                          <option key={conn.id} value={conn.id}>
                            {conn.site_name} ({conn.platform})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">
                        Starting Date
                      </label>
                      <input
                        type="date"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full bg-white border border-brand-border rounded-lg px-3.5 py-3 text-brand-text text-sm focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-200 outline-none"
                      />
                    </div>
                  </div>
                )}

                {batchResults.map((result, index) => (
                  result ? (
                    <div key={index} className="bg-brand-card p-5 rounded-2xl border border-brand-border shadow-sm">
                      <div className="flex items-start gap-4">
                        {result.image && (
                          <img
                            src={result.image}
                            alt={result.topic}
                            className="w-24 h-16 object-cover rounded border border-brand-border/50 shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-brand-text mb-2">{result.topic}</h4>
                          <p className="text-xs text-brand-text-muted line-clamp-2 mb-3">
                            {result.content.substring(0, 150)}...
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {result.seo?.keywords?.slice(0, 3).map((kw: string, i: number) => (
                              <span key={i} className="bg-accent-blue/10 text-accent-blue px-2 py-1 rounded text-xs font-semibold">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const blob = new Blob([result.content], { type: 'text/markdown' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${result.topic.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }}
                            className="bg-brand-light text-brand-text px-3 py-2 rounded-lg font-semibold text-xs hover:bg-brand-border transition-all duration-200"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={index} className="bg-red-50 p-5 rounded-xl border border-red-200">
                      <p className="text-red-600 text-sm font-medium">Failed to generate blog post</p>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
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
          </>
        )}
        </div>{/* end padding wrapper */}
      </div>

      {!batchMode && loading && (
        <AnalysisLoadingState
          title="Generating SEO-Optimized Article"
          message="Our AI is researching local keywords and drafting your long-form content. This can take up to 5 minutes."
          durationEstimateSeconds={300}
        />
      )}

      {!batchMode && result && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <BlogPostPreview
            title={topic}
            content={result}
            featuredImage={featuredImage}
            metaDescription={optimization?.meta_description}
            keywords={optimization?.keywords}
            tags={optimization?.tags}
            slug={optimization?.slug}
          />

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
          <div className="mt-6 bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
            <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center shrink-0">
                <SparklesIcon className="w-4 h-4 text-accent-blue" />
              </div>
              <h3 className="font-bold text-brand-text text-sm flex-1">SEO Optimization</h3>
              {!optimization && !optimizing && (
                <span className="text-xs text-accent-blue/70 font-medium">Auto-generated</span>
              )}
            </div>
            <div className="p-6">

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
            </div>{/* end SEO p-6 */}
          </div>

          {/* Featured Image Section */}
          <div className="mt-6 bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
            <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple/20 to-accent-blue/20 flex items-center justify-center shrink-0">
                <SparklesIcon className="w-4 h-4 text-accent-purple" />
              </div>
              <h3 className="font-bold text-brand-text text-sm flex-1">Featured Image</h3>
              {!featuredImage && !showImagePrompt && !generatingImage && (
                <span className="text-xs text-accent-purple/70 font-medium">Auto-generated</span>
              )}
            </div>
            <div className="p-6">

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
            </div>{/* end Featured Image p-6 */}
          </div>

          {/* Scheduling Section */}
          {websiteConnections.length > 0 && (
            <div className="mt-6 bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
              <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                </div>
                <h3 className="font-bold text-brand-text text-sm">Schedule Blog Post</h3>
              </div>
              <div className="p-6">

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
              </div>{/* end Scheduling p-6 */}
            </div>
          )}

          {websiteConnections.length === 0 && (
            <div className="mt-6 bg-accent-blue/5 border border-accent-blue/15 rounded-xl px-5 py-4 text-sm">
              <p className="font-bold text-xs text-accent-blue">Connect a Website to Schedule Posts</p>
              <p className="text-xs text-accent-blue/70 mt-1 leading-relaxed">Go to Business Details → Connect Websites to set up WordPress, Squarespace, or Wix publishing.</p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(result);
                setSuccess('Article copied to clipboard!');
                setTimeout(() => setSuccess(''), 3000);
              }}
              className="bg-brand-text text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-brand-text/90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              Copy Article
            </button>
            <button
              onClick={() => {
                const blob = new Blob([result], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${topic.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setSuccess('Blog post downloaded!');
                setTimeout(() => setSuccess(''), 3000);
              }}
              className="bg-accent-blue text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-accent-blue/90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download (.md)
            </button>
            {featuredImage && (
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = featuredImage;
                  a.download = `${topic.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-featured-image.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  setSuccess('Featured image downloaded!');
                  setTimeout(() => setSuccess(''), 3000);
                }}
                className="bg-accent-purple text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-accent-purple/90 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                Download Image
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
