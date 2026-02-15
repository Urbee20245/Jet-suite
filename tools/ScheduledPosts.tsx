import React, { useState, useEffect } from 'react';
import type { Tool, ProfileData, BlogPublication, WebsiteConnection } from '../types';
import { Loader } from '../components/Loader';
import { InformationCircleIcon } from '../components/icons/MiniIcons';
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
    const badges: Record<string, { bg: string; text: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-700' },
      publishing: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      published: { bg: 'bg-green-100', text: 'text-green-700' },
      failed: { bg: 'bg-red-100', text: 'text-red-700' },
    };

    const badge = badges[status] || badges.draft;

    return (
      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.status === filter);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-brand-card p-8 rounded-xl shadow-lg text-center">
          <Loader />
          <p className="text-brand-text-muted mt-4">Loading scheduled posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg border border-brand-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-brand-text">Scheduled Blog Posts</h2>
            <p className="text-brand-text-muted mt-1">Manage your scheduled and published blog posts</p>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            {(['all', 'scheduled', 'published', 'failed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                  filter === f
                    ? 'bg-accent-blue text-white'
                    : 'bg-brand-light text-brand-text-muted hover:bg-brand-border'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4 text-sm font-semibold">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Posts Table */}
        {filteredPosts.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
            <InformationCircleIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 font-medium">
              {filter === 'all' ? 'No scheduled posts yet' : `No ${filter} posts`}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Create blog posts in JetContent and schedule them to your connected websites
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left p-3 text-sm font-bold text-brand-text-muted">Title</th>
                  <th className="text-left p-3 text-sm font-bold text-brand-text-muted">Platform</th>
                  <th className="text-left p-3 text-sm font-bold text-brand-text-muted">Scheduled Date</th>
                  <th className="text-left p-3 text-sm font-bold text-brand-text-muted">Status</th>
                  <th className="text-left p-3 text-sm font-bold text-brand-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="border-b border-brand-border hover:bg-brand-light transition">
                    <td className="p-3">
                      <div>
                        <p className="font-semibold text-brand-text">{post.title}</p>
                        {post.featured_image_url && (
                          <span className="text-xs text-accent-purple">📷 Has featured image</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-sm text-brand-text">{getWebsiteName(post.website_connection_id)}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-sm text-brand-text">
                        {post.scheduled_publish_at
                          ? new Date(post.scheduled_publish_at).toLocaleString()
                          : 'Not scheduled'}
                      </p>
                    </td>
                    <td className="p-3">{getStatusBadge(post.status)}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {post.status === 'scheduled' && (
                          <button
                            onClick={() => handlePublishNow(post.id)}
                            className="text-xs font-semibold text-accent-blue hover:text-accent-blue/80 transition"
                          >
                            Publish Now
                          </button>
                        )}
                        {post.status === 'published' && post.wordpress_post_id && (
                          <a
                            href={`${websiteConnections.find(c => c.id === post.website_connection_id)?.website_url}/?p=${post.wordpress_post_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-accent-blue hover:text-accent-blue/80 transition"
                          >
                            View
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-xs font-semibold text-red-500 hover:text-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
