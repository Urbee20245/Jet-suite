import React, { useState, useEffect } from 'react';
import { SocialConnectionsManager } from './SocialConnectionsManager';
import { getSocialConnections } from '../services/socialMediaService';
import type { SocialConnection } from '../types';

interface SocialAccountsStepProps {
  userId: string;
  onContinue: () => void;
  onSkip: () => void;
}

export const SocialAccountsStep: React.FC<SocialAccountsStepProps> = ({
  userId,
  onContinue,
  onSkip,
}) => {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-accent-purple rounded-full flex items-center justify-center">
          <span className="text-white text-lg">🔗</span>
        </div>
        <h2 className="text-2xl font-bold text-brand-text ml-4">
          Connect Social Accounts
        </h2>
        <span className="ml-auto text-sm text-brand-text-muted bg-brand-light px-3 py-1 rounded-full">
          Optional
        </span>
      </div>
      
      {/* Description */}
      <p className="text-brand-text-muted mb-6">
        Connect your social media accounts once, and post directly from any JetSuite 
        tool with a single click. You can also connect accounts later from individual tools.
      </p>

      {/* Benefits Card */}
      <div className="mb-6 bg-gradient-to-r from-accent-blue/10 to-accent-purple/10 border border-accent-purple/30 rounded-lg p-4">
        <h3 className="font-semibold text-accent-purple mb-3 flex items-center">
          <span className="text-lg mr-2">🎯</span>
          Why Connect Now?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-sm text-brand-text-muted">
              Post to social media instantly from <strong className="text-brand-text">JetPost</strong>
            </span>
          </div>
          <div className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-sm text-brand-text-muted">
              Share content from <strong className="text-brand-text">JetImage</strong> directly
            </span>
          </div>
          <div className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-sm text-brand-text-muted">
              Manage all accounts in <strong className="text-brand-text">one place</strong>
            </span>
          </div>
          <div className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-sm text-brand-text-muted">
              <strong className="text-brand-text">Save time</strong> - connect once, use everywhere
            </span>
          </div>
        </div>
      </div>

      {/* Connection Status Summary */}
      {!loading && connections.length > 0 && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-semibold flex items-center">
            <span className="text-xl mr-2">✓</span>
            {connections.length} account{connections.length > 1 ? 's' : ''} connected
          </p>
          <p className="text-green-700 text-sm mt-1">
            You're all set! You can post to these platforms from any JetSuite tool.
          </p>
        </div>
      )}

      {/* Social Connections Manager */}
      <SocialConnectionsManager
        userId={userId}
        onConnectionsChange={loadConnections}
      />

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button
          onClick={onSkip}
          className="flex-1 bg-brand-light text-brand-text-muted hover:text-brand-text font-semibold py-3 px-6 rounded-lg transition border border-brand-border hover:border-brand-text-muted"
        >
          {connections.length > 0 ? 'Continue' : 'Skip for Now'}
        </button>
        <button
          onClick={onContinue}
          className="flex-1 bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-3 px-6 rounded-lg transition hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {connections.length > 0 ? 'Continue to Next Step →' : 'Continue Without Connecting'}
        </button>
      </div>

      {/* Help Text */}
      <p className="mt-4 text-center text-sm text-brand-text-muted">
        Don't worry - you can connect or disconnect accounts anytime from your Account settings or within any social tool.
      </p>
    </div>
  );
};
