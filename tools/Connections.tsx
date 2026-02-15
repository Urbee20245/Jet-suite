import React from 'react';
import type { Tool, ProfileData } from '../types';
import { SocialConnectionsManager } from '../components/SocialConnectionsManager';
import { WebsiteConnectionsManager } from '../components/WebsiteConnectionsManager';

interface ConnectionsProps {
  tool: Tool;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null) => void;
}

export const Connections: React.FC<ConnectionsProps> = ({ tool, profileData, setActiveTool }) => {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-text">Connections</h1>
        <p className="text-lg text-brand-text-muted mt-2">
          Connect your social media accounts and websites to unlock powerful automation features.
        </p>
      </div>

      <div className="space-y-8">
        {/* Social Media Connections Section */}
        <div className="bg-brand-card rounded-xl shadow-lg border border-brand-border/50 p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-text">Social Media Accounts</h2>
              <p className="text-sm text-brand-text-muted mt-0.5">
                Connect your social profiles to schedule posts, auto-reply to messages, and manage your social presence.
              </p>
            </div>
          </div>

          <div className="border-t border-brand-border/30 pt-6">
            <SocialConnectionsManager
              userId={profileData.user.id}
              businessId={profileData.business.id}
              onConnectionsChange={() => {
                console.log('[Connections] Social connections changed');
              }}
            />
          </div>
        </div>

        {/* Website Connections Section */}
        <div className="bg-brand-card rounded-xl shadow-lg border border-brand-border/50 p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-text">Website Publishing</h2>
              <p className="text-sm text-brand-text-muted mt-0.5">
                Connect your WordPress, Squarespace, or Wix website to automatically publish blog posts from JetSuite tools.
              </p>
            </div>
          </div>

          <div className="border-t border-brand-border/30 pt-6">
            <WebsiteConnectionsManager
              userId={profileData.user.id}
              businessId={profileData.business.id}
              onConnectionsChange={() => {
                console.log('[Connections] Website connections changed');
              }}
            />
          </div>
        </div>

        {/* Benefits Info Card */}
        <div className="bg-gradient-to-br from-accent-blue/5 to-accent-purple/5 border border-accent-blue/15 rounded-xl p-6">
          <h3 className="font-bold text-brand-text text-sm mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-accent-blue" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            Why Connect?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-brand-text-muted">
            <div>
              <p className="font-semibold text-brand-text mb-1">Social Media</p>
              <ul className="space-y-1 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Schedule posts across all platforms from one place</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Auto-reply to comments and messages with AI</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Track engagement and growth metrics</span>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-brand-text mb-1">Website Publishing</p>
              <ul className="space-y-1 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Automatically publish SEO-optimized blog posts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Schedule content in advance across the month</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Your credentials are encrypted and secure</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
