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
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Active
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-200/60">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        Inactive
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <Loader />
        <p className="text-sm text-brand-text-muted mt-3">Loading website connections...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm border border-red-200/60 flex items-start gap-2.5">
          <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl mb-5 text-sm font-medium border border-green-200/60 flex items-start gap-2.5">
          <svg className="w-4 h-4 mt-0.5 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          <span>{success}</span>
        </div>
      )}

      {/* Connected Websites */}
      {connections.length > 0 && (
        <div className="mb-7">
          <h3 className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-3 ml-0.5">Connected Websites</h3>
          <div className="space-y-3">
            {connections.map((connection) => {
              const Icon = platformIcons[connection.platform];
              const colorClass = platformColors[connection.platform];

              return (
                <div
                  key={connection.id}
                  className="group flex items-center justify-between p-4 rounded-xl border bg-white border-brand-border shadow-sm hover:shadow-md hover:border-green-300/70 transition-all duration-200"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-brand-light flex items-center justify-center shrink-0">
                      {Icon && <Icon className={`w-5 h-5 ${colorClass}`} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-brand-text text-sm">
                          {connection.site_name}
                        </p>
                        {getStatusBadge(connection)}
                        <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-accent-blue/8 text-accent-blue font-medium">
                          {WEBSITE_PLATFORM_INFO[connection.platform].name}
                        </span>
                      </div>
                      <p className="text-xs text-brand-text-muted mt-0.5">
                        {connection.website_url}
                      </p>
                      {connection.last_verified_at && (
                        <p className="text-xs text-brand-text-muted/70 mt-0.5">
                          Last verified: {new Date(connection.last_verified_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="group-hover:hidden flex items-center gap-1.5 text-xs font-semibold text-green-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Connected
                    </div>
                    <button
                      onClick={() => handleDisconnect(connection)}
                      className="hidden group-hover:inline-flex items-center text-xs font-semibold text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all duration-200"
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
        <div className="text-center py-8 px-6 bg-brand-light/50 border-2 border-dashed border-brand-border/50 rounded-xl mb-6">
          <div className="w-10 h-10 mx-auto rounded-xl bg-brand-light flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-brand-text-muted/50" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
          </div>
          <p className="text-brand-text font-medium text-sm">No websites connected yet</p>
          <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
            Connect your first website below to start auto-publishing blog posts!
          </p>
        </div>
      )}

      {/* Connect Platforms */}
      <div>
        <h3 className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-3 ml-0.5">
          {connections.length > 0 ? 'Connect More Websites' : 'Connect Your Website'}
        </h3>

        <div className="space-y-3">
          {/* WordPress Connection */}
          {!showWordPressForm ? (
            (() => {
              const wpConnection = connections.find(c => c.platform === 'wordpress');
              const isConnected = !!wpConnection;

              return (
                <button
                  onClick={() => !isConnected && setShowWordPressForm(true)}
                  disabled={isConnected}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                    isConnected
                      ? 'bg-green-50/50 border-green-200 cursor-default shadow-sm'
                      : 'bg-white hover:bg-brand-light/50 border-brand-border shadow-sm hover:shadow-md hover:border-accent-blue/30'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-brand-light flex items-center justify-center shrink-0">
                      <WordPressIcon className="w-5 h-5 text-[#21759b]" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-brand-text text-sm">WordPress</span>
                        {isConnected && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Connected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-brand-text-muted mt-0.5">
                        {isConnected ? wpConnection.site_name : 'Connect with Application Password'}
                      </p>
                    </div>
                  </div>
                  {!isConnected && (
                    <span className="text-xs font-bold text-accent-blue bg-accent-blue/8 px-3 py-1.5 rounded-lg">Connect</span>
                  )}
                </button>
              );
            })()
          ) : (
            <div className="bg-white p-5 rounded-xl border border-brand-border shadow-md">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
                    <WordPressIcon className="w-4.5 h-4.5 text-[#21759b]" />
                  </div>
                  <h4 className="font-bold text-brand-text text-sm">Connect WordPress</h4>
                </div>
                <button
                  onClick={() => {
                    setShowWordPressForm(false);
                    setWpWebsiteUrl('');
                    setWpUsername('');
                    setWpAppPassword('');
                    setError('');
                  }}
                  className="text-xs font-medium text-brand-text-muted hover:text-brand-text px-2.5 py-1.5 rounded-lg hover:bg-brand-light transition-all duration-200"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={wpWebsiteUrl}
                    onChange={(e) => setWpWebsiteUrl(e.target.value)}
                    placeholder="https://myblog.com"
                    className="w-full bg-brand-light border border-brand-border rounded-lg px-3.5 py-2.5 text-brand-text text-sm placeholder-brand-text-muted/50 focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={wpUsername}
                    onChange={(e) => setWpUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full bg-brand-light border border-brand-border rounded-lg px-3.5 py-2.5 text-brand-text text-sm placeholder-brand-text-muted/50 focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
                    Application Password
                  </label>
                  <input
                    type="password"
                    value={wpAppPassword}
                    onChange={(e) => setWpAppPassword(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full bg-brand-light border border-brand-border rounded-lg px-3.5 py-2.5 text-brand-text text-sm font-mono placeholder-brand-text-muted/50 focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-200 outline-none"
                  />
                  <p className="text-xs text-brand-text-muted mt-1.5 leading-relaxed">
                    Generate an Application Password in WordPress → Users → Your Profile
                  </p>
                </div>

                <button
                  onClick={handleConnectWordPress}
                  disabled={connecting}
                  className="w-full bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-accent-purple/20 disabled:opacity-50 active:scale-[0.99] mt-1"
                >
                  {connecting ? 'Connecting...' : 'Connect WordPress'}
                </button>
              </div>
            </div>
          )}

          {/* Squarespace - Coming Soon */}
          <div className="relative">
            <div className="w-full flex items-center justify-between p-4 bg-brand-light/60 rounded-xl border border-brand-border/50 opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white/80 flex items-center justify-center shrink-0">
                  <SquarespaceIcon className="w-5 h-5 text-[#000000]" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-brand-text text-sm">Squarespace</span>
                  <p className="text-xs text-brand-text-muted">OAuth flow coming soon</p>
                </div>
              </div>
              <span className="text-xs font-medium text-brand-text-muted bg-brand-border/50 px-2.5 py-1 rounded-full">
                Coming Soon
              </span>
            </div>
          </div>

          {/* Wix */}
          {(() => {
            const wixConnection = connections.find(c => c.platform === 'wix');
            const isConnected = !!wixConnection;

            return (
              <button
                onClick={() => {
                  if (!isConnected) {
                    setError('Wix OAuth integration is being finalized. Please check back soon or contact support for early access.');
                    setTimeout(() => setError(''), 5000);
                  }
                }}
                disabled={isConnected}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                  isConnected
                    ? 'bg-green-50/50 border-green-200 cursor-default shadow-sm'
                    : 'bg-white hover:bg-brand-light/50 border-brand-border shadow-sm hover:shadow-md hover:border-accent-purple/30'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-brand-light flex items-center justify-center shrink-0">
                    <WixIcon className="w-5 h-5 text-[#0c6efc]" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-brand-text text-sm">Wix</span>
                      {isConnected && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-text-muted mt-0.5">
                      {isConnected ? wixConnection.site_name : 'Connect with OAuth'}
                    </p>
                  </div>
                </div>
                {!isConnected && (
                  <span className="text-xs font-bold text-accent-purple bg-accent-purple/8 px-3 py-1.5 rounded-lg">Connect</span>
                )}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Help Info */}
      {connections.length === 0 && (
        <div className="mt-5 px-4 py-3.5 bg-accent-blue/5 border border-accent-blue/15 rounded-xl text-sm text-accent-blue/80">
          <p className="font-bold text-xs text-accent-blue">Auto-Publish Blog Posts</p>
          <p className="mt-1 text-xs leading-relaxed">Connect your website to automatically publish blog posts from JetSuite tools. Your credentials are encrypted and stored securely.</p>
        </div>
      )}
    </div>
  );
};
