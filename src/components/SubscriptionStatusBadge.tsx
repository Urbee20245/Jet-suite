import React, { useEffect, useState } from 'react';
import { getBillingAccount } from '../services/stripeService';
import { CheckCircleIcon } from './icons/MiniIcons';

interface SubscriptionStatusBadgeProps {
  userId: string;
}

/**
 * SubscriptionStatusBadge Component
 * Displays a glowing green indicator if the user has an active subscription.
 */
export const SubscriptionStatusBadge: React.FC<SubscriptionStatusBadgeProps> = ({ userId }) => {
  const [isActive, setIsActive] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const billing = await getBillingAccount(userId);
        setIsActive(billing?.subscription_status === 'active' || billing?.subscription_status === 'trialing');
      } catch (error) {
        setIsActive(false);
      }
    };

    if (userId) {
      checkStatus();
    }
  }, [userId]);

  if (!isActive) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.2)] animate-in fade-in zoom-in duration-500">
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
      </div>
      <span className="text-[10px] sm:text-xs font-bold text-green-500 uppercase tracking-wider">
        Active Subscription
      </span>
    </div>
  );
};