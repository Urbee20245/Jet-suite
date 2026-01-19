"use client";

import React, { useEffect, useState } from 'react';
import { getBillingAccount } from '../services/stripeService';

interface SubscriptionStatusBadgeProps {
  userId: string;
}

/**
 * SubscriptionStatusBadge Component
 * Displays a glowing indicator reflecting the user's current account status.
 * - Green Glow: Active/Paid or Admin-Granted plans.
 * - Blue Glow: Free/Unpaid accounts.
 */
export const SubscriptionStatusBadge: React.FC<SubscriptionStatusBadgeProps> = ({ userId }) => {
  const [status, setStatus] = useState<'active' | 'free' | 'loading'>('loading');
  const [isAdminGranted, setIsAdminGranted] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const billing = await getBillingAccount(userId);
        
        // Check if the subscription is officially active or in a trial
        const isActive = billing?.subscription_status === 'active' || 
                         billing?.subscription_status === 'trialing';
        
        // Track if this is a manually granted admin free account (which we treat as green 'Active Access')
        setIsAdminGranted(billing?.subscription_plan === 'admin_granted_free');

        if (isActive) {
          setStatus('active');
        } else {
          // If logged in but no active plan record, they are a 'Free User'
          setStatus('free');
        }
      } catch (error) {
        // Fallback to free state on error so the header doesn't look broken
        setStatus('free');
      }
    };

    if (userId) {
      checkStatus();
    }
  }, [userId]);

  // Loading skeleton to prevent layout shift
  if (status === 'loading') {
    return (
      <div className="h-7 w-24 bg-slate-800/50 animate-pulse rounded-full border border-slate-700"></div>
    );
  }

  // Active/Paid State (Green Glow)
  if (status === 'active') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.2)] animate-in fade-in zoom-in duration-500">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
        </div>
        <span className="text-[10px] sm:text-xs font-bold text-green-500 uppercase tracking-wider">
          {isAdminGranted ? 'Active Access' : 'Active Plan'}
        </span>
      </div>
    );
  }

  // Free Account State (Blue Glow)
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.2)] animate-in fade-in zoom-in duration-500">
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span>
      </div>
      <span className="text-[10px] sm:text-xs font-bold text-blue-400 uppercase tracking-wider whitespace-nowrap">
        Free Account
      </span>
    </div>
  );
};