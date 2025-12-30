import React, { useState, useEffect } from 'react';
import { getSocialConnections, removeSocialConnection } from '../services/socialMediaService';
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

// Add other icons here (Twitter, etc.) - keep your existing ones

const platformIcons: { [key: string]: React.FC<{ className?: string }> } = {
  'facebook': FacebookIcon,
  'instagram': InstagramIcon,
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
  // 'twitter',   // Coming soon
  // 'linkedin',  // Coming soon
  // 'tiktok',    // Coming soon
  // 'google_business', // Coming soon
];

export const SocialConnectionsManager: React.FC<SocialConnectionsManagerProps> = ({
  userId,
  onConnectionsChange,
}) => {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectingPlatform, setConnectingPlatform] = useState<SocialPlatform | null>(null);

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
                  onClick={() => handleConnectOAuth(platform)}
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
    </div>
  );
};
