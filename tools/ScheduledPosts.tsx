import React, { useState, useEffect } from 'react';
import type { Tool, ProfileData, BlogPublication, WebsiteConnection } from '../types';
import { Loader } from '../components/Loader';
import { InformationCircleIcon, SparklesIcon, BoltIcon, CheckIcon, ArrowRightIcon, TrashIcon } from '../components/icons/MiniIcons';
import { getSupabaseClient } from '../integrations/supabase/client';
import { getWebsiteConnections } from '../services/websiteService';

interface ScheduledPostsProps {
  tool: Tool;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null) => void;
}

export const ScheduledPosts: React.FC<ScheduledPostsProps> = ({ tool, profileData }) => {
  const [posts, setPosts] = useState<BlogPublication[]>([]);
  const [websiteConnections, setWebsiteConnections] = useState<WebsiteConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'published' | 'failed'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // Load posts
      const { data: postsData, error: postsError } = await supabase
        .from('blog_publications')
        .select('*')
        .eq('user_id', profileData.user.id)
        .eq('business_id', profileData.business.id)
        .order('created_at', { ascending: false });

      if (postsError) {
        throw new Error(postsError.message);
      }

      setPosts(postsData || []);

      // Load website connections
      const connections = await getWebsiteConnections(profileData.user.id, profileData.business.id);
      setWebsiteConnections(connections);
    } catch (err: any) {
      console.error('Error loading scheduled posts:', err);
      setError(err.message || 'Failed to load scheduled posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { error: deleteError } = await supabase
        .from('blog_publications')
        .delete()
        .eq('id', postId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setSuccess('Post deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      await loadData();
    } catch (err: any) {
      console.error('Error deleting post:', err);
      setError(err.message || 'Failed to delete post');
    }
  };

  const handlePublishNow = async (postId: string) => {
    if (!confirm('Publish this post immediately?')) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { error: updateError } = await supabase
        .from('blog_publications')
        .update({
          scheduled_publish_at: new Date().toISOString(),
          status: 'scheduled',
        })
        .eq('id', postId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess('Post will be published shortly');
      setTimeout(() => setSuccess(''), 3000);
      await loadData();
    } catch (err: any) {
      console.error('Error publishing post:', err);
      setError(err.message || 'Failed to publish post');
    }
  };

  const getWebsiteName = (connectionId: string) => {
    const connection = websiteConnections.find(c => c.id === connectionId);
    return connection ? connection.site_name : 'Unknown';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; dot: string; border: string }> = {
      draft: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400', border: 'border-gray-200/60' },
      scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200/60' },
      publishing: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500 animate-pulse', border: 'border-amber-200/60' },
      published: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', border: 'border-green-200/60' },
      failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200/60' },
    };

    const badge = badges[status] || badges.draft;

    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.status === filter);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-brand-card p-10 rounded-2xl shadow-md border border-brand-border text-center">
          <Loader />
          <p className="text-sm text-brand-text-muted mt-3">Loading scheduled posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-brand-text tracking-tight">Scheduled Blog Posts</h2>
            <p className="text-sm text-brand-text-muted mt-1">Manage your scheduled and published blog posts</p>
          </div>

          {/* Filter Segmented Control */}
          <div className="flex gap-1 bg-brand-light p-1.5 rounded-2xl">
            {(['all', 'scheduled', 'published', 'failed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  filter === f
                    ? 'bg-white text-brand-text shadow-sm'
                    : 'text-brand-text-muted hover:text-brand-text'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl mb-5 text-sm font-medium border border-green-200/60 flex items-start gap-2.5">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              <span>{success}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm border border-red-200/60 flex items-start gap-2.5">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              <span>{error}</span>
            </div>
          )}

          {/* Posts List */}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 px-6 bg-brand-light/50 rounded-2xl border-2 border-dashed border-brand-border">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-light flex items-center justify-center mb-3">
                <InformationCircleIcon className="w-6 h-6 text-brand-text-muted/40" />
              </div>
              <p className="text-brand-text font-medium text-sm">
                {filter === 'all' ? 'No scheduled posts yet' : `No ${filter} posts`}
              </p>
              <p className="text-xs text-brand-text-muted mt-1.5 leading-relaxed max-w-sm mx-auto">
                Create blog posts in JetContent and schedule them to your connected websites
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div key={post.id} className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
                  {/* Post Card Top Strip */}
                  <div className="bg-brand-light border-b border-brand-border px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-gradient-to-r from-accent-blue/10 to-accent-purple/10 border border-accent-blue/20 text-accent-blue text-xs font-bold px-2.5 py-1 rounded-full">
                        {getWebsiteName(post.website_connection_id)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.scheduled_publish_at && (
                        <span className="text-xs text-brand-text-muted font-medium bg-brand-card border border-brand-border px-2.5 py-1 rounded-full">
                          {new Date(post.scheduled_publish_at).toLocaleString()}
                        </span>
                      )}
                      {!post.scheduled_publish_at && (
                        <span className="text-xs text-brand-text-muted font-medium bg-brand-card border border-brand-border px-2.5 py-1 rounded-full">
                          Not scheduled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Post Card Content */}
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {post.featured_image_url && (
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-20 h-14 object-cover rounded-xl border border-brand-border shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-brand-text text-sm leading-snug">{post.title}</p>
                        {post.auto_optimized && (
                          <span className="inline-flex items-center gap-1 text-xs text-accent-blue mt-1.5">
                            <SparklesIcon className="w-3 h-3" />
                            SEO Optimized
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post Card Footer */}
                  <div className="bg-brand-light/60 border-t border-brand-border px-4 py-2 flex items-center justify-between">
                    <div>{getStatusBadge(post.status)}</div>
                    <div className="flex items-center gap-1">
                      {post.status === 'scheduled' && (
                        <button
                          onClick={() => handlePublishNow(post.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-accent-blue to-accent-purple text-white px-3 py-1.5 rounded-xl hover:shadow-lg hover:shadow-accent-purple/20 active:scale-[0.99] transition-all duration-200"
                        >
                          <ArrowRightIcon className="w-3 h-3" />
                          Publish Now
                        </button>
                      )}
                      {post.status === 'published' && post.wordpress_post_id && (
                        <a
                          href={`${websiteConnections.find(c => c.id === post.website_connection_id)?.website_url}/?p=${post.wordpress_post_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-blue hover:text-accent-blue/80 px-2.5 py-1.5 rounded-xl hover:bg-accent-blue/5 transition-all duration-200"
                        >
                          <ArrowRightIcon className="w-3 h-3" />
                          View
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 px-2.5 py-1.5 rounded-xl hover:bg-red-50 transition-all duration-200"
                      >
                        <TrashIcon className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
