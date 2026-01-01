import React, { useState, useEffect } from 'react';
import type { Tool, ProfileData, SocialConnection } from '../types';
import { generateSocialPosts, generateImage } from '../services/geminiService';
import { getSocialConnections, createScheduledPost } from '../services/socialMediaService';
import { Loader } from '../components/Loader';
import { HowToUse } from '../components/HowToUse';
import { InformationCircleIcon } from '../components/icons/MiniIcons';
import { SocialConnectionsManager } from '../components/SocialConnectionsManager';
import { SevenDayPlanner } from '../components/SevenDayPlanner';
import { TOOLS } from '../constants';
import { getTomorrowDate, getMinDate, getMaxDate } from '../utils/dateTimeUtils';

interface JetPostProps {
  tool: Tool;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null) => void;
}

interface Post {
    platform: string;
    post_text: string;
    hashtags: string;
    visual_suggestion: string;
}

const socialPlatforms = ['Facebook', 'Instagram', 'X (Twitter)', 'LinkedIn', 'TikTok', 'Google Business Profile'];

const platformDetails: { [key: string]: { aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9", postUrl: string } } = {
    'Facebook': { aspectRatio: '1:1', postUrl: 'https://www.facebook.com/sharer/sharer.php?u=' },
    'Instagram': { aspectRatio: '1:1', postUrl: 'https://www.instagram.com' },
    'X (Twitter)': { aspectRatio: '16:9', postUrl: 'https://twitter.com/intent/tweet?text=' },
    'LinkedIn': { aspectRatio: '16:9', postUrl: 'https://www.linkedin.com/sharing/share-offsite/?url=' },
    'TikTok': { aspectRatio: '9:16', postUrl: 'https://www.tiktok.com/upload' },
    'Google Business Profile': { aspectRatio: '4:3', postUrl: 'https://business.google.com/posts' },
};

// Map display names to internal platform IDs
const platformNameToPlatformId: { [key: string]: string } = {
  'Facebook': 'facebook',
  'Instagram': 'instagram',
  'X (Twitter)': 'twitter',
  'LinkedIn': 'linkedin',
  'TikTok': 'tiktok',
  'Google Business Profile': 'google_business',
};

type ViewMode = 'generate' | 'planner' | 'connections';

export const JetPost: React.FC<JetPostProps> = ({ tool, profileData, setActiveTool }) => {
  const { category: businessType } = profileData.business;
  
  // Use authenticated user id from profileData instead of localStorage
  const userId = profileData.user.id;
  
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('generate');
  
  // Generate posts state (existing functionality)
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Friendly');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Facebook']);
  const [generatedImages, setGeneratedImages] = useState<{ [platform: string]: string }>({});
  const [imageLoading, setImageLoading] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);
  
  // Social connections state
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  
  // Schedule post state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedPostForSchedule, setSelectedPostForSchedule] = useState<Post | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    if (userId) {
      loadConnections();
    }
  }, [userId]);

  const loadConnections = async () => {
    try {
      setConnectionsLoading(true);
      const data = await getSocialConnections(userId);
      setConnections(data);
    } catch (err) {
      console.error('Error loading connections:', err);
    } finally {
      setConnectionsLoading(false);
    }
  };

  const handlePlatformChange = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) {
      setError('Please fill out the Topic/Offer.');
      return;
    }
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one social media platform.');
      return;
    }
    setError('');
    setLoading(true);
    setPosts([]);
    setGeneratedImages({});
    try {
      const result = await generateSocialPosts(businessType, topic, tone, selectedPlatforms);
      setPosts(result.posts);
    } catch (err) {
      setError('Failed to generate posts. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async (platform: string, prompt: string) => {
    setImageLoading(platform);
    setError('');
    try {
        const aspectRatio = platformDetails[platform].aspectRatio;
        const base64Data = await generateImage(prompt, '1K', aspectRatio);
        setGeneratedImages(prev => ({ ...prev, [platform]: `data:image/png;base64,${base64Data}` }));
    } catch (err: any) {
        console.error(err);
        setError(`Failed to generate image for ${platform}. Please try again.`);
    } finally {
        setImageLoading(null);
    }
  };
  
  const handleCopyAndPost = (platform: string, text: string) => {
      const fullText = `${text} ${posts.find(p => p.platform === platform)?.hashtags || ''}`;
      navigator.clipboard.writeText(fullText.trim());
      setCopySuccess(`Content for ${platform} copied!`);
      setTimeout(() => setCopySuccess(''), 2000);
      
      const postUrl = platformDetails[platform].postUrl;
      if (platform === 'X (Twitter)' || platform === 'Facebook' || platform === 'LinkedIn') {
          window.open(postUrl + encodeURIComponent(fullText.trim()), '_blank');
      } else {
          window.open(postUrl, '_blank');
      }
  };

  const handleSchedulePost = (post: Post) => {
    setSelectedPostForSchedule(post);
    
    // Set default schedule date to tomorrow using utility
    setScheduledDate(getTomorrowDate());
    
    setShowScheduleModal(true);
  };

  const confirmSchedulePost = async () => {
    if (!selectedPostForSchedule || !scheduledDate || !userId) {
      setError('Please select a date to schedule the post');
      return;
    }

    // Get connections for the platform
    const platformId = platformNameToPlatformId[selectedPostForSchedule.platform];
    const platformConnections = connections.filter(c => c.platform === platformId);

    if (platformConnections.length === 0) {
      setError(`Please connect your ${selectedPostForSchedule.platform} account first`);
      setShowScheduleModal(false);
      setViewMode('connections');
      return;
    }

    try {
      setScheduling(true);
      setError('');

      const platformTargets = platformConnections.map(conn => ({
        platform: conn.platform,
        connection_id: conn.id,
      }));

      await createScheduledPost(userId, {
        post_text: selectedPostForSchedule.post_text,
        hashtags: selectedPostForSchedule.hashtags,
        visual_suggestion: selectedPostForSchedule.visual_suggestion,
        image_url: generatedImages[selectedPostForSchedule.platform],
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        timezone: 'America/New_York',
        platforms: platformTargets,
        status: 'scheduled',
      });

      setCopySuccess('Post scheduled successfully!');
      setTimeout(() => setCopySuccess(''), 3000);
      setShowScheduleModal(false);
      setSelectedPostForSchedule(null);
    } catch (err: any) {
      setError(err.message);
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
                Please add a category to your business profile (e.g., "Coffee Shop") to generate relevant social media posts.
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

  return (
    <div>
      {/* View Mode Tabs */}
      <div className="bg-brand-card p-2 rounded-xl shadow-lg mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('generate')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
              viewMode === 'generate'
                ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white'
                : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-light'
            }`}
          >
            ✍️ Generate Posts
          </button>
          <button
            onClick={() => setViewMode('planner')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
              viewMode === 'planner'
                ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white'
                : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-light'
            }`}
          >
            📅 7-Day Planner
          </button>
          <button
            onClick={() => setViewMode('connections')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
              viewMode === 'connections'
                ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white'
                : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-light'
            }`}
          >
            🔗 Connections {connections.length > 0 && `(${connections.length})`}
          </button>
        </div>
      </div>

      {/* Connections View */}
      {viewMode === 'connections' && userId && (
        <SocialConnectionsManager
          userId={userId}
          onConnectionsChange={loadConnections}
        />
      )}

      {/* Planner View */}
      {viewMode === 'planner' && userId && (
        <SevenDayPlanner
          userId={userId}
          connections={connections}
          onNeedConnections={() => setViewMode('connections')}
        />
      )}

      {/* Generate Posts View */}
      {viewMode === 'generate' && (
        <>
          {showHowTo && (
            <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Your business type is automatically used from your active profile.</li>
                    <li>Enter a topic or offer for your post.</li>
                    <li>Select the social media platforms you want to post on.</li>
                    <li>Choose a tone and click 'Generate Posts'.</li>
                    <li>(Optional) Generate a unique AI image for each post.</li>
                    <li>Schedule posts to your 7-day calendar or copy & post immediately.</li>
                </ul>
            </HowToUse>
          )}
          
          <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
            <p className="text-brand-text-muted mb-2">{tool.description}</p>
            <p className="text-sm text-brand-text-muted mb-6">
              Replaces: <span className="text-accent-purple font-semibold">Social Media Manager ($800-2,500/mo)</span>
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text-muted flex items-center">
                    <span className="text-sm font-medium text-brand-text mr-2">Business Type:</span>
                    <span className="font-semibold text-brand-text">{businessType}</span>
                </div>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Topic / Offer (e.g., New Fall Latte)"
                  className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-brand-text mb-2">Platforms</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {socialPlatforms.map(platform => (
                    <label
                      key={platform}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition ${
                        selectedPlatforms.includes(platform)
                          ? 'bg-accent-purple/10 border-accent-purple'
                          : 'bg-brand-light border-brand-border'
                      } border`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(platform)}
                        onChange={() => handlePlatformChange(platform)}
                        className="form-checkbox h-4 w-4 text-accent-purple rounded focus:ring-accent-purple/50"
                      />
                      <span className="text-brand-text text-sm font-medium">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="tone" className="block text-sm font-medium text-brand-text mb-2">Tone</label>
                <select
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
                >
                  <option>Friendly</option>
                  <option>Professional</option>
                  <option>Urgent</option>
                  <option>Playful</option>
                  <option>Informative</option>
                </select>
              </div>
              
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {loading ? 'Generating...' : 'Generate Posts'}
              </button>
            </form>
          </div>
          
          {loading && <Loader />}
          
          {posts.length > 0 && (
            <div className="mt-6 space-y-6">
                {copySuccess && (
                  <div className="bg-green-100 text-green-800 text-sm font-semibold p-3 rounded-lg text-center shadow">
                    {copySuccess}
                  </div>
                )}
                
                {posts.map((post, index) => (
                    <div key={index} className="bg-brand-card p-6 rounded-xl shadow-lg">
                        <h3 className="text-lg font-bold text-accent-purple mb-2">{post.platform} Post</h3>
                        <p className="text-brand-text-muted whitespace-pre-wrap">{post.post_text}</p>
                        <p className="text-accent-cyan mt-4 text-sm break-words font-medium">{post.hashtags}</p>
                        
                        <div className="mt-4 bg-brand-light p-4 rounded-lg border border-brand-border">
                            <h4 className="text-sm font-semibold text-brand-text mb-2">Visual Suggestion</h4>
                            <p className="text-brand-text-muted text-sm italic mb-3">
                              {post.platform === 'TikTok' ? `🎬 ${post.visual_suggestion}` : `📷 ${post.visual_suggestion}`}
                            </p>
                            {generatedImages[post.platform] ? (
                                <img
                                  src={generatedImages[post.platform]}
                                  alt={`Generated for ${post.platform}`}
                                  className="rounded-md w-full h-auto mt-2"
                                />
                            ) : (
                                <button
                                  onClick={() => handleGenerateImage(post.platform, post.visual_suggestion)}
                                  disabled={imageLoading === post.platform}
                                  className="w-full text-sm bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:opacity-50 shadow hover:shadow-md"
                                >
                                    {imageLoading === post.platform ? 'Generating...' : 'Generate Image'}
                                </button>
                            )}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleSchedulePost(post)}
                            className="bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-2 px-4 rounded-lg transition duration-300 hover:shadow-lg"
                          >
                            📅 Schedule
                          </button>
                          <button
                            onClick={() => handleCopyAndPost(post.platform, post.post_text)}
                            className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                          >
                            Copy & Post Now
                          </button>
                        </div>
                    </div>
                ))}
            </div>
          )}
        </>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedPostForSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card p-6 rounded-xl shadow-2xl max-w-md w-full">
            <h3 className="text-xl font-bold text-brand-text mb-4">
              Schedule {selectedPostForSchedule.platform} Post
            </h3>

            {error && (
              <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-text mb-2">Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={getMinDate()}
                max={getMaxDate(7)}
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-accent-purple"
              />
              <p className="text-xs text-brand-text-muted mt-1">
                Schedule up to 7 days in advance
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-text mb-2">Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-accent-purple"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedPostForSchedule(null);
                  setError('');
                }}
                className="flex-1 bg-brand-light text-brand-text px-4 py-2 rounded-lg font-semibold hover:bg-opacity-80 transition"
                disabled={scheduling}
              >
                Cancel
              </button>
              <button
                onClick={confirmSchedulePost}
                disabled={scheduling || !scheduledDate}
                className="flex-1 bg-gradient-to-r from-accent-blue to-accent-purple text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scheduling ? 'Scheduling...' : 'Confirm Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};