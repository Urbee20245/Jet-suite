import React, { useState, useEffect } from 'react';
import { getSocialConnections, removeSocialConnection, addSocialConnection } from '../services/socialMediaService';
import type { SocialConnection, SocialPlatform } from '../types';
import { Loader } from './Loader';

interface SocialConnectionsManagerProps {
  userId: string;
  onConnectionsChange?: () => void;
}

// Social Media Platform Icons (SVG) - Keep your existing icons

const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
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

// Add other icons here (Twitter, etc.) - keep your existing ones

const platformIcons: { [key: string]: React.FC<{ className?: string }> } = {
  'facebook': FacebookIcon,
  'instagram': InstagramIcon,
  'google_business': GoogleIcon,
  // Add others: 'twitter': TwitterIcon, etc.
};

const platformColors: { [key: string]: string } = {
  'facebook': 'text-[#1877F2]',
  'instagram': 'text-[#E4405F]',
  'twitter': 'text-[#000000]',
  'linkedin': 'text-[#0A66C2]',
  'tiktok': 'text-[#000000]',
  'google_business': 'text-[#4285F4]',
};

const platformNames: { [key: string]: string } = {
  'facebook': 'Facebook',
  'instagram': 'Instagram',
  'twitter': 'X (Twitter)',
  'linkedin': 'LinkedIn',
  'tiktok': 'TikTok',
  'google_business': 'Google Business',
};

// OAuth-enabled platforms
const oauthPlatforms = ['facebook']; // Will add more as we implement them

// Platforms that support OAuth
const availablePlatforms: SocialPlatform[] = [
  'facebook',
  'instagram', // Auto-detects through Facebook OAuth
  'google_business',
  // 'twitter',   // Coming soon
  // 'linkedin',  // Coming soon
  // 'tiktok',    // Coming soon
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
    
    // Redirect to OAuth authorization endpoint
    window.location.href = `/api/auth/${platform}/authorize?userId=${userId}`;
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
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('success') === 'facebook_connected' && (
        <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4 text-sm font-semibold">
          ✓ Facebook account connected successfully!
        </div>
      )}

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
                    <span className="font-semibold text-brand-text">
                      {platformNames[platform]}
                    </span>
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

      {showAddModal && (
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
                <p className="text-xs text-brand-text-muted mt-1">
                  Note: This is a mock connection for demo purposes.
                </p>
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