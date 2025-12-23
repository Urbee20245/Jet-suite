import React, { useEffect, useState } from 'react';
import { checkSubscriptionAccess, getSubscriptionStatusLabel, type SubscriptionStatus } from '../services/subscriptionService';
import { ExclamationTriangleIcon, LockClosedIcon } from './icons/MiniIcons';
import { Loader } from './Loader';

interface SubscriptionGuardProps {
  userId: string;
  onAccessDenied?: (status: SubscriptionStatus, redirectTo: string) => void;
  children: React.ReactNode;
}

/**
 * SubscriptionGuard Component
 * 
 * Wraps protected content and enforces subscription access rules.
 * Only users with 'active' or 'trialing' subscriptions can access the app.
 * 
 * Usage:
 * <SubscriptionGuard userId={user.id}>
 *   <InternalApp />
 * </SubscriptionGuard>
 */
export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ 
  userId, 
  onAccessDenied,
  children 
}) => {
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [status, setStatus] = useState<SubscriptionStatus>(null);
  const [reason, setReason] = useState<string>('');
  const [redirectTo, setRedirectTo] = useState<string>('/pricing');

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const result = await checkSubscriptionAccess(userId);
        
        setHasAccess(result.hasAccess);
        setStatus(result.status);
        setReason(result.reason || '');
        setRedirectTo(result.redirectTo || '/pricing');
        
        if (!result.hasAccess && onAccessDenied) {
          // Give parent component a chance to handle the denial
          setTimeout(() => {
            onAccessDenied(result.status, result.redirectTo || '/pricing');
          }, 2000); // 2 second delay to show the message
        }
      } catch (error) {
        console.error('Subscription verification error:', error);
        setHasAccess(false);
        setReason('Unable to verify subscription status.');
      } finally {
        setIsChecking(false);
      }
    };

    verifyAccess();
  }, [userId, onAccessDenied]);

  // Show loader while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <div className="text-center">
          <Loader />
          <p className="text-brand-text-muted mt-4">Verifying subscription...</p>
        </div>
      </div>
    );
  }

  // Show access denied screen
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark p-4">
        <div className="max-w-md w-full">
          <div className="bg-brand-card border-2 border-red-500/30 rounded-2xl p-8 text-center shadow-2xl">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
              {status === 'past_due' ? (
                <ExclamationTriangleIcon className="w-10 h-10 text-yellow-500" />
              ) : (
                <LockClosedIcon className="w-10 h-10 text-red-500" />
              )}
            </div>

            {/* Status Badge */}
            <div className="inline-block mb-4 px-4 py-2 bg-white/5 rounded-full">
              <span className="text-sm font-semibold text-gray-300">
                {getSubscriptionStatusLabel(status)}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-white mb-4">
              {status === 'past_due' ? 'Payment Issue' : 'Subscription Required'}
            </h1>

            {/* Reason */}
            <p className="text-brand-text-muted mb-8">
              {reason || 'Your subscription is not active. Please subscribe to continue using JetSuite.'}
            </p>

            {/* CTA Button */}
            <button
              onClick={() => {
                window.location.href = redirectTo;
              }}
              className="w-full bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-4 px-8 rounded-xl transition-opacity shadow-lg"
            >
              {status === 'past_due' || status === 'unpaid' 
                ? 'Update Payment Method' 
                : 'View Pricing Plans'}
            </button>

            {/* Help Text */}
            <p className="text-xs text-gray-500 mt-6">
              Redirecting in 2 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Access granted - render children
  return <>{children}</>;
};
