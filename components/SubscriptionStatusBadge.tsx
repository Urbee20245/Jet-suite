import React, { useEffect, useState } from 'react';
import { getBillingAccount } from '../services/stripeService';
import { CheckCircleIcon } from './icons/MiniIcons';

interface SubscriptionStatusBadgeProps {
  userId: string;
}

/**
 * SubscriptionStatusBadge Component
 * Displays a glowing green indicator if the user has an active plan or granted access.
 */
export const SubscriptionStatusBadge: React.FC<SubscriptionStatusBadgeProps> = ({ userId }) => {
  const [statusInfo, setStatusInfo] = useState<{ active: boolean; isFree: boolean } | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const billing = await getBillingAccount(userId);
        const active = billing?.subscription_status === 'active' || billing?.subscription_status === 'trialing';
        const isFree = billing?.subscription_plan?.includes('free') || billing?.subscription_plan === 'admin_granted_free';
        
        setStatusInfo({ active, isFree });
      } catch (error) {
        setStatusInfo({ active: false, isFree: false });
      }
    };

    if (userId) {
      checkStatus();
    }
  }, [userId]);

  if (!statusInfo?.active) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.2)] animate-in fade-in zoom-in duration-500">
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
      </div>
      <span className="text-[10px] sm:text-xs font-bold text-green-500 uppercase tracking-wider">
        {statusInfo.isFree ? 'Active Access' : 'Active Subscription'}
      </span>
    </div>
  );
};