import React, { useState, useEffect } from 'react';
import { getSocialConnections, addSocialConnection, removeSocialConnection } from '../services/socialMediaService';
import type { SocialConnection, SocialPlatform } from '../types';
import { Loader } from './Loader';

interface SocialConnectionsManagerProps {
  userId: string;
  onConnectionsChange?: () => void;
}

// Social Media Platform Icons (SVG) - Same as SocialAccountsStep
const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
  </svg>
);

const TwitterIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const TikTokIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Platform icon mapping
const platformIcons: { [key: string]: React.FC<{ className?: string }> } = {
  'facebook': FacebookIcon,
  'instagram': InstagramIcon,
  'twitter': TwitterIcon,
  'linkedin': LinkedInIcon,
  'tiktok': TikTokIcon,
  'google_business': GoogleIcon,
};

// Platform colors
const platformColors: { [key: string]: string } = {
  'facebook': 'text-[#1877F2]',
  'instagram': 'text-[#E4405F]',
  'twitter': 'text-[#000000]',
  'linkedin': 'text-[#0A66C2]',
  'tiktok': 'text-[#000000]',
  'google_business': 'text-[#4285F4]',
};

// Platform display names
const platformNames: { [key: string]: string } = {
  'facebook': 'Facebook',
  'instagram': 'Instagram',
  'twitter': 'X (Twitter)',
  'linkedin': 'LinkedIn',
  'tiktok': 'TikTok',
  'google_business': 'Google Business',
};

// All four platforms use real OAuth (Instagram via Facebook)
const oauthPlatforms = ['facebook', 'instagram', 'google_business', 'tiktok'];

// Map platform names to their API auth endpoint paths
const platformAuthPaths: Record<string, string> = {
  facebook: 'facebook',
  instagram: 'facebook',        // Instagram connects through Facebook OAuth
  google_business: 'google',    // API route is /api/auth/google/
  tiktok: 'tiktok',
};

// Platforms available for connection
const availablePlatforms: SocialPlatform[] = [
  'facebook',
  'instagram', // Auto-detects through Facebook OAuth
  'google_business',
  'tiktok',
];

export const SocialConnectionsManager: React.FC<SocialConnectionsManagerProps> = ({
  userId,
  onConnectionsChange,
}) => {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectingPlatform, setConnectingPlatform] = useState<SocialPlatform | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('google_business');
  const [username, setUsername] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadConnections();
  }, [userId]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const data = await getSocialConnections(userId);
      setConnections(data);
    } catch (err) {
      console.error('Error loading connections:', err);
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectOAuth = (platform: SocialPlatform) => {
    setConnectingPlatform(platform);
    setError('');

    // Use mapped path (e.g. google_business -> google, instagram -> facebook)
    const authPath = platformAuthPaths[platform] || platform;
    window.location.href = `/api/auth/${authPath}/authorize?userId=${userId}`;
  };

  const handleConnect = (platform: SocialPlatform) => {
    if (oauthPlatforms.includes(platform)) {
      handleConnectOAuth(platform);
    } else {
      setSelectedPlatform(platform);
      setShowAddModal(true);
    }
  };

  const handleAddConnection = async () => {
    if (!username.trim()) {
      setError('Please enter a username or profile name');
      return;
    }

    try {
      setAdding(true);
      setError('');
      await addSocialConnection(userId, selectedPlatform, username.trim());
      await loadConnections();
      setShowAddModal(false);
      setUsername('');
      if (onConnectionsChange) {
        onConnectionsChange();
      }
    } catch (err) {
      console.error('Error adding connection:', err);
      setError('Failed to add connection');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this account? You will need to reconnect to post.')) {
      return;
    }

    try {
      await removeSocialConnection(connectionId);
      await loadConnections();
      if (onConnectionsChange) {
        onConnectionsChange();
      }
    } catch (err) {
      console.error('Error removing connection:', err);
      setError('Failed to remove connection');
    }
  };

  const connectedPlatforms = connections.map(c => c.platform);
  const availableToConnect = availablePlatforms.filter(p => !connectedPlatforms.includes(p));

  if (loading) {
    return (
      <div className="text-center p-8">
        <Loader />
        <p className="text-sm text-brand-text-muted mt-2">Loading connections...</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Success message from OAuth callback */}
      {typeof window !== 'undefined' && (() => {
        const success = new URLSearchParams(window.location.search).get('success');
        const successMessages: Record<string, string> = {
          facebook_connected: 'Facebook account connected successfully! Instagram will also be connected if linked to your Facebook page.',
          google_business_connected: 'Google Business Profile connected successfully!',
          tiktok_connected: 'TikTok account connected successfully!',
        };
        const message = success ? successMessages[success] : null;
        return message ? (
          <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4 text-sm font-semibold">
            {message}
          </div>
        ) : null;
      })()}

      {/* Connected Accounts */}
      {connections.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-brand-text mb-3">Connected Accounts</h3>
          <div className="space-y-2">
            {connections.map((connection) => {
              const Icon = platformIcons[connection.platform];
              const colorClass = platformColors[connection.platform];
              
              return (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-3 bg-brand-light rounded-lg border border-brand-border"
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className={`w-5 h-5 ${colorClass}`} />}
                    <div>
                      <p className="font-semibold text-brand-text">
                        {platformNames[connection.platform]}
                      </p>
                      <p className="text-sm text-brand-text-muted">
                        {connection.platform_username}
                      </p>
                      {connection.token_expires_at && (
                        <p className="text-xs text-brand-text-muted mt-1">
                          Expires: {new Date(connection.token_expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveConnection(connection.id)}
                    className="text-sm font-semibold text-red-500 hover:text-red-700 transition"
                  >
                    Disconnect
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Platforms to Connect */}
      {availableToConnect.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-brand-text mb-3">
            {connections.length > 0 ? 'Connect More Accounts' : 'Connect Your Accounts'}
          </h3>
          <div className="space-y-2">
            {availableToConnect.map((platform) => {
              const Icon = platformIcons[platform];
              const colorClass = platformColors[platform];
              const isConnecting = connectingPlatform === platform;

              return (
                <button
                  key={platform}
                  onClick={() => handleConnect(platform)}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 rounded-lg border border-brand-border transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className={`w-5 h-5 ${colorClass}`} />}
                    <div>
                      <span className="font-semibold text-brand-text">
                        {platformNames[platform]}
                      </span>
                      {platform === 'instagram' && (
                        <p className="text-xs text-brand-text-muted">Connects via Facebook</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-accent-blue">
                    {isConnecting ? 'Connecting...' : 'Connect →'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {availableToConnect.length === 0 && (
        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-semibold">🎉 All platforms connected!</p>
          <p className="text-sm text-green-700 mt-1">
            You've connected all available social media platforms.
          </p>
        </div>
      )}

      {/* Coming Soon Notice */}
      {connections.length === 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <p className="font-semibold mb-1">🔒 Secure OAuth Authentication</p>
          <p>Your credentials are never stored. We use official OAuth to connect your accounts securely.</p>
        </div>
      )}

      {/* Manual connection modal - only for non-OAuth platforms (future: twitter, linkedin) */}
      {showAddModal && !oauthPlatforms.includes(selectedPlatform) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card p-6 rounded-xl shadow-2xl max-w-md w-full">
            <h3 className="text-xl font-bold text-brand-text mb-4">Connect {platformNames[selectedPlatform]}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">
                  Profile Name or Handle
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@username or Business Name"
                  className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setUsername('');
                  setError('');
                }}
                className="flex-1 bg-brand-light text-brand-text-muted hover:text-brand-text font-semibold py-2 px-4 rounded-lg transition"
                disabled={adding}
              >
                Cancel
              </button>
              <button
                onClick={handleAddConnection}
                disabled={adding || !username.trim()}
                className="flex-1 bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-2 px-4 rounded-lg transition hover:shadow-lg disabled:opacity-50"
              >
                {adding ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
