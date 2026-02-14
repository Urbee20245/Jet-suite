import React, { useState, useEffect } from 'react';
import { getWebsiteConnections, connectWordPress, disconnectWebsite, WEBSITE_PLATFORM_INFO } from '../services/websiteService';
import type { WebsiteConnection, WebsitePlatform, WordPressConnectionRequest } from '../types';
import { Loader } from './Loader';

interface WebsiteConnectionsManagerProps {
  userId: string;
  businessId: string;
  onConnectionsChange?: () => void;
}

// Website Platform Icons (SVG)
const WordPressIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.11m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.15-2.85-.15-.585-.03-.661.855-.075.885 0 0 .54.061 1.125.09l1.68 4.605-2.37 7.08L5.354 6.9c.649-.03 1.234-.1 1.234-.1.585-.075.516-.93-.065-.896 0 0-1.746.138-2.874.138-.2 0-.438-.008-.69-.015C4.911 3.15 8.235 1.215 12 1.215c2.809 0 5.365 1.072 7.286 2.833-.046-.003-.091-.009-.141-.009-1.06 0-1.812.923-1.812 1.914 0 .89.513 1.643 1.06 2.531.411.72.89 1.643.89 2.977 0 .915-.354 1.994-.821 3.479l-1.075 3.585-3.9-11.61.001.014zM12 22.784c-1.059 0-2.081-.153-3.048-.437l3.237-9.406 3.315 9.087c.024.053.05.101.078.149-1.12.393-2.325.607-3.582.607M1.211 12c0-1.564.336-3.05.935-4.39L7.29 21.709C3.694 19.96 1.212 16.271 1.212 12M12 0C5.385 0 0 5.385 0 12s5.385 12 12 12 12-5.385 12-12S18.615 0 12 0"/>
  </svg>
);

const SquarespaceIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.8648 8.3293l-7.5346 7.5359c-.8892.8892-2.3304.8892-3.2196 0-.8892-.8892-.8892-2.3317 0-3.2209l7.5346-7.5359c.8892-.8892 2.3304-.8892 3.2196 0 .8892.8892.8892 2.3317 0 3.2209zm-11.6988 7.3409l-4.0293 4.0293c-.8892.8892-2.3304.8892-3.2196 0-.8892-.8892-.8892-2.3317 0-3.2209l4.0293-4.0293c.8892-.8892 2.3304-.8892 3.2196 0 .8892.8892.8892 2.3317 0 3.2209zm3.6696-3.6696l-4.0293 4.0293c-.8892.8892-2.3304.8892-3.2196 0-.8892-.8892-.8892-2.3317 0-3.2209l4.0293-4.0293c.8892-.8892 2.3304-.8892 3.2196 0 .8892.8892.8892 2.3317 0 3.2209zm7.3409-7.3409l-4.0293 4.0293c-.8892.8892-2.3304.8892-3.2196 0-.8892-.8892-.8892-2.3317 0-3.2209l4.0293-4.0293c.8892-.8892 2.3304-.8892 3.2196 0 .8892.8892.8892 2.3317 0 3.2209z"/>
  </svg>
);

const WixIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.976 1.003l2.4 14.4L20.173 1h3.623l-5.998 22h-2.998l-2.4-12.799L9.998 23H7l-6-22h3.623l3.797 14.403 2.4-14.4h3.156z"/>
  </svg>
);

// Platform icon mapping
const platformIcons: { [key: string]: React.FC<{ className?: string }> } = {
  'wordpress': WordPressIcon,
  'squarespace': SquarespaceIcon,
  'wix': WixIcon,
};

// Platform colors
const platformColors: { [key: string]: string } = {
  'wordpress': 'text-[#21759b]',
  'squarespace': 'text-[#000000]',
  'wix': 'text-[#0c6efc]',
};

export const WebsiteConnectionsManager: React.FC<WebsiteConnectionsManagerProps> = ({
  userId,
  businessId,
  onConnectionsChange,
}) => {
  const [connections, setConnections] = useState<WebsiteConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // WordPress connection form state
  const [showWordPressForm, setShowWordPressForm] = useState(false);
  const [wpWebsiteUrl, setWpWebsiteUrl] = useState('');
  const [wpUsername, setWpUsername] = useState('');
  const [wpAppPassword, setWpAppPassword] = useState('');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadConnections();
  }, [userId, businessId]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      console.log('[WebsiteConnectionsManager] Loading connections for userId:', userId, 'businessId:', businessId);
      const data = await getWebsiteConnections(userId, businessId);
      console.log('[WebsiteConnectionsManager] Loaded connections:', data);
      setConnections(data);
    } catch (err) {
      console.error('Error loading website connections:', err);
      setError('Failed to load website connections');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWordPress = async () => {
    // Validate inputs
    if (!wpWebsiteUrl.trim()) {
      setError('Please enter your website URL');
      return;
    }
    if (!wpUsername.trim()) {
      setError('Please enter your WordPress username');
      return;
    }
    if (!wpAppPassword.trim()) {
      setError('Please enter your Application Password');
      return;
    }

    // Validate URL format
    try {
      new URL(wpWebsiteUrl);
    } catch (e) {
      setError('Please enter a valid website URL (e.g., https://myblog.com)');
      return;
    }

    try {
      setConnecting(true);
      setError('');
      setSuccess('');

      const request: WordPressConnectionRequest = {
        user_id: userId,
        business_id: businessId,
        website_url: wpWebsiteUrl.trim(),
        username: wpUsername.trim(),
        app_password: wpAppPassword.trim(),
      };

      const response = await connectWordPress(request);

      if (response.success) {
        setSuccess(`Connected to ${response.site_name} successfully!`);
        setShowWordPressForm(false);
        setWpWebsiteUrl('');
        setWpUsername('');
        setWpAppPassword('');
        await loadConnections();
        if (onConnectionsChange) {
          onConnectionsChange();
        }
      }
    } catch (err: any) {
      console.error('Error connecting WordPress:', err);

      // Handle specific error messages
      if (err.message.includes('credentials')) {
        setError('Invalid username or Application Password. Please check your credentials.');
      } else if (err.message.includes('not found')) {
        setError('WordPress site not found. Make sure the URL is correct.');
      } else if (err.message.includes('duplicate')) {
        setError('This WordPress site is already connected.');
      } else {
        setError(err.message || 'Connection failed. Please try again.');
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (connection: WebsiteConnection) => {
    if (!confirm(`Disconnect ${connection.site_name}? You can reconnect anytime.`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await disconnectWebsite(connection.id);
      setSuccess(`${connection.site_name} disconnected successfully`);
      await loadConnections();
      if (onConnectionsChange) {
        onConnectionsChange();
      }
    } catch (err: any) {
      console.error('Error disconnecting website:', err);
      setError('Failed to disconnect website');
    }
  };

  const getStatusBadge = (connection: WebsiteConnection) => {
    if (connection.is_active) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Active
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
        Inactive
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <Loader />
        <p className="text-sm text-brand-text-muted mt-2">Loading website connections...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4 text-sm font-semibold">
          {success}
        </div>
      )}

      {/* Connected Websites */}
      {connections.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-brand-text mb-3">Connected Websites</h3>
          <div className="space-y-2">
            {connections.map((connection) => {
              const Icon = platformIcons[connection.platform];
              const colorClass = platformColors[connection.platform];

              return (
                <div
                  key={connection.id}
                  className="group flex items-center justify-between p-3 rounded-lg border bg-brand-light border-brand-border hover:border-green-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className={`w-5 h-5 ${colorClass}`} />}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-brand-text">
                          {connection.site_name}
                        </p>
                        {getStatusBadge(connection)}
                        <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                          {WEBSITE_PLATFORM_INFO[connection.platform].name}
                        </span>
                      </div>
                      <p className="text-sm text-brand-text-muted">
                        {connection.website_url}
                      </p>
                      {connection.last_verified_at && (
                        <p className="text-xs text-brand-text-muted mt-0.5">
                          Last verified: {new Date(connection.last_verified_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="group-hover:hidden flex items-center gap-1.5 text-sm font-semibold text-green-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Connected
                    </div>
                    <button
                      onClick={() => handleDisconnect(connection)}
                      className="hidden group-hover:block text-sm font-semibold text-red-500 hover:text-red-700 transition"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {connections.length === 0 && !showWordPressForm && (
        <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg mb-6">
          <p className="text-gray-600 font-medium">No websites connected yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Connect your first website above to start auto-publishing blog posts!
          </p>
        </div>
      )}

      {/* Connect Platforms */}
      <div>
        <h3 className="text-sm font-semibold text-brand-text mb-3">
          {connections.length > 0 ? 'Connect More Websites' : 'Connect Your Website'}
        </h3>

        <div className="space-y-3">
          {/* WordPress Connection */}
          {!showWordPressForm ? (
            <button
              onClick={() => setShowWordPressForm(true)}
              className="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 rounded-lg border border-brand-border transition"
            >
              <div className="flex items-center gap-3">
                <WordPressIcon className="w-5 h-5 text-[#21759b]" />
                <div className="text-left">
                  <span className="font-semibold text-brand-text">WordPress</span>
                  <p className="text-xs text-brand-text-muted">Connect with Application Password</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-accent-blue">Connect</span>
            </button>
          ) : (
            <div className="bg-white p-4 rounded-lg border border-brand-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <WordPressIcon className="w-5 h-5 text-[#21759b]" />
                  <h4 className="font-semibold text-brand-text">Connect WordPress</h4>
                </div>
                <button
                  onClick={() => {
                    setShowWordPressForm(false);
                    setWpWebsiteUrl('');
                    setWpUsername('');
                    setWpAppPassword('');
                    setError('');
                  }}
                  className="text-sm text-brand-text-muted hover:text-brand-text"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={wpWebsiteUrl}
                    onChange={(e) => setWpWebsiteUrl(e.target.value)}
                    placeholder="https://myblog.com"
                    className="w-full bg-brand-light border border-brand-border rounded-lg p-2 text-brand-text text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={wpUsername}
                    onChange={(e) => setWpUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full bg-brand-light border border-brand-border rounded-lg p-2 text-brand-text text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">
                    Application Password
                  </label>
                  <input
                    type="password"
                    value={wpAppPassword}
                    onChange={(e) => setWpAppPassword(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full bg-brand-light border border-brand-border rounded-lg p-2 text-brand-text text-sm font-mono"
                  />
                  <p className="text-xs text-brand-text-muted mt-1">
                    Generate an Application Password in WordPress → Users → Your Profile
                  </p>
                </div>

                <button
                  onClick={handleConnectWordPress}
                  disabled={connecting}
                  className="w-full bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-2 px-4 rounded-lg transition hover:shadow-lg disabled:opacity-50"
                >
                  {connecting ? 'Connecting...' : 'Connect WordPress'}
                </button>
              </div>
            </div>
          )}

          {/* Squarespace - Coming Soon */}
          <div className="relative">
            <div className="w-full flex items-center justify-between p-3 bg-gray-100 rounded-lg border border-gray-300 opacity-60 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <SquarespaceIcon className="w-5 h-5 text-[#000000]" />
                <div className="text-left">
                  <span className="font-semibold text-brand-text">Squarespace</span>
                  <p className="text-xs text-brand-text-muted">OAuth flow coming soon</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                Coming Soon
              </span>
            </div>
          </div>

          {/* Wix - Coming Soon */}
          <div className="relative">
            <div className="w-full flex items-center justify-between p-3 bg-gray-100 rounded-lg border border-gray-300 opacity-60 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <WixIcon className="w-5 h-5 text-[#0c6efc]" />
                <div className="text-left">
                  <span className="font-semibold text-brand-text">Wix</span>
                  <p className="text-xs text-brand-text-muted">OAuth flow coming soon</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Help Info */}
      {connections.length === 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <p className="font-semibold mb-1">Auto-Publish Blog Posts</p>
          <p>Connect your website to automatically publish blog posts from JetSuite tools. Your credentials are encrypted and stored securely.</p>
        </div>
      )}
    </div>
  );
};
