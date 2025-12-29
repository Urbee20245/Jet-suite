import React, { useState, useEffect } from 'react';
import { 
  getSocialConnections, 
  addSocialConnection, 
  removeSocialConnection,
  PLATFORM_INFO
} from '../services/socialMediaService';
import type { SocialConnection, SocialPlatform } from '../types';
import { Loader } from './Loader';

interface SocialConnectionsManagerProps {
  userId: string;
  onConnectionsChange?: () => void;
}

export const SocialConnectionsManager: React.FC<SocialConnectionsManagerProps> = ({
  userId,
  onConnectionsChange,
}) => {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null);
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadConnections();
  }, [userId]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const data = await getSocialConnections(userId);
      setConnections(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnection = async () => {
    if (!selectedPlatform || !username.trim()) {
      setError('Please select a platform and enter your username');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await addSocialConnection(userId, selectedPlatform, username);
      await loadConnections();
      onConnectionsChange?.();
      setShowAddModal(false);
      setSelectedPlatform(null);
      setUsername('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) {
      return;
    }

    try {
      await removeSocialConnection(connectionId);
      await loadConnections();
      onConnectionsChange?.();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getConnectedPlatforms = (): Set<SocialPlatform> => {
    return new Set(connections.map(c => c.platform));
  };

  const connectedPlatforms = getConnectedPlatforms();
  const availablePlatforms = Object.keys(PLATFORM_INFO).filter(
    p => !connectedPlatforms.has(p as SocialPlatform)
  ) as SocialPlatform[];

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="bg-brand-card p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-brand-text">Connected Accounts</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-accent-blue to-accent-purple text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition"
        >
          + Connect Account
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {connections.length === 0 ? (
        <div className="text-center py-8 text-brand-text-muted">
          <p className="mb-2">No social accounts connected yet.</p>
          <p className="text-sm">Connect your accounts to start scheduling posts!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map(connection => {
            const platformInfo = PLATFORM_INFO[connection.platform];
            return (
              <div
                key={connection.id}
                className="flex items-center justify-between p-4 bg-brand-light border border-brand-border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{platformInfo.icon}</span>
                  <div>
                    <p className="font-semibold text-brand-text">{platformInfo.name}</p>
                    <p className="text-sm text-brand-text-muted">
                      @{connection.platform_username || 'Connected'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveConnection(connection.id)}
                  className="text-red-600 hover:text-red-800 font-semibold text-sm px-3 py-1 rounded hover:bg-red-50 transition"
                >
                  Disconnect
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Connection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card p-6 rounded-xl shadow-2xl max-w-md w-full">
            <h3 className="text-xl font-bold text-brand-text mb-4">Connect Social Account</h3>
            
            {error && (
              <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-text mb-2">
                Platform
              </label>
              <select
                value={selectedPlatform || ''}
                onChange={(e) => setSelectedPlatform(e.target.value as SocialPlatform)}
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-accent-purple"
              >
                <option value="">Select a platform...</option>
                {availablePlatforms.map(platform => (
                  <option key={platform} value={platform}>
                    {PLATFORM_INFO[platform].icon} {PLATFORM_INFO[platform].name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-text mb-2">
                Username / Page Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username or page name"
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple"
              />
              <p className="text-xs text-brand-text-muted mt-1">
                Note: Full OAuth integration coming soon. For now, enter your account identifier.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedPlatform(null);
                  setUsername('');
                  setError('');
                }}
                className="flex-1 bg-brand-light text-brand-text px-4 py-2 rounded-lg font-semibold hover:bg-opacity-80 transition"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAddConnection}
                disabled={!selectedPlatform || !username.trim() || submitting}
                className="flex-1 bg-gradient-to-r from-accent-blue to-accent-purple text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
