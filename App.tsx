import React, { useState, useEffect } from 'react';
import { InternalApp } from './InternalApp';
import { MarketingWebsite } from './pages/MarketingWebsite';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { OnboardingPage } from './pages/OnboardingPage';
import { SubscriptionGuard } from './components/SubscriptionGuard';
import { checkSubscriptionAccess } from './services/subscriptionService';
import { fetchRealDateTime } from './utils/realTime';
import { getSupabaseClient } from './integrations/supabase/client'; // Import centralized client function

// Fetch real current time on app load (with timeout to prevent hanging)
if (typeof window !== 'undefined') {
  const initRealTime = async () => {
    try {
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 2000)
      );
      await Promise.race([fetchRealDateTime(), timeout]);
      console.log('✅ Real date/time initialized');
    } catch (error) {
      console.warn('⚠️ Could not fetch real time, using system time');
    }
  };
  initRealTime();
}

console.log('[App] Component module loaded');

const App: React.FC = () => {
  console.log('[App] Component rendering');
  
  const supabase = getSupabaseClient();
  
  // 1. Identity State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // 2. Resolution Flags
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isAccessTierResolved, setIsAccessTierResolved] = useState(false);
  const [subscriptionRedirect, setSubscriptionRedirect] = useState<string | null>(null);
  const [isOnboardingResolved, setIsOnboardingResolved] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  // 3. Navigation State
  const [currentPath, setCurrentPath] = useState(() => {
    try {
      return typeof window !== 'undefined' ? window.location.pathname : '/';
    } catch (e) {
      return '/';
    }
  });

  const navigate = (path: string) => {
      if (typeof window === 'undefined') return;
      try {
        window.history.pushState({}, '', path);
        setCurrentPath(path);
      } catch (e) {
        console.warn('Could not navigate:', e);
      }
  };

  // Helper to verify subscription and update resolution state
  const verifySubscription = async (uid: string) => {
    if (!supabase) {
      // If Supabase is disabled, assume no subscription/onboarding is possible
      setSubscriptionRedirect('/pricing');
      setIsAccessTierResolved(true);
      setIsOnboardingResolved(true);
      return;
    }
    
    try {
      // 1. Check Subscription
      const result = await checkSubscriptionAccess(uid);
      setSubscriptionRedirect(result.hasAccess ? null : (result.redirectTo || '/pricing'));
      setIsAccessTierResolved(true);

      // 2. Check Onboarding (Extension)
      // We look for the primary business to decide if onboarding is finished
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('is_complete')
        .eq('user_id', uid)
        .eq('is_primary', true)
        .maybeSingle();
      
      setIsOnboardingComplete(!!profile?.is_complete);
      setIsOnboardingResolved(true);
    } catch (error) {
      console.error('[App] Verification failed:', error);
      setSubscriptionRedirect('/pricing');
      setIsAccessTierResolved(true);
      setIsOnboardingResolved(true);
    }
  };

  // Check Supabase session on mount
  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) {
        setIsLoggedIn(false);
        setSessionChecked(true);
        return;
      }
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session check timeout')), 5000)
      );

      try {
        const result: any = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]);
        
        const { data: { session }, error } = result;
        
        if (error || !session?.user) {
          setIsLoggedIn(false);
          setCurrentUserEmail(null);
          setCurrentUserId(null);
          setSessionChecked(true);
          return;
        }
        
        console.log('[App] Valid session found:', session.user.email);
        setIsLoggedIn(true);
        setCurrentUserEmail(session.user.email || null);
        setCurrentUserId(session.user.id);
        
        // Block sessionChecked until subscription and onboarding are also verified
        await verifySubscription(session.user.id);
        setSessionChecked(true);
      } catch (error) {
        console.error('[App] Session check failed:', error);
        setIsLoggedIn(false);
        setSessionChecked(true);
      }
    };
    
    checkSession();
  }, [supabase]);

  // Listen for auth state changes
  useEffect(() => {
    if (!supabase) return;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[App] Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setIsLoggedIn(true);
        setCurrentUserEmail(session.user.email || null);
        setCurrentUserId(session.user.id);
        verifySubscription(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setCurrentUserEmail(null);
        setCurrentUserId(null);
        setIsAccessTierResolved(false);
        setSubscriptionRedirect(null);
        setIsOnboardingResolved(false);
        setIsOnboardingComplete(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [supabase]);

  // Sync currentPath with browser forward/back buttons
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  /**
   * UNIFIED NAVIGATION GUARD
   */
  useEffect(() => {
    if (!sessionChecked) return;
    if (isLoggedIn && (!isAccessTierResolved || !isOnboardingResolved)) return;

    if (isLoggedIn) {
      if (subscriptionRedirect) {
        if (currentPath !== subscriptionRedirect) {
          navigate(subscriptionRedirect);
        }
        return;
      }

      if (!isOnboardingComplete) {
        if (currentPath !== '/onboarding' && !currentPath.startsWith('/privacy') && !currentPath.startsWith('/terms')) {
          navigate('/onboarding');
        }
        return;
      }
      
      const isWhitelistedMarketingPage = 
        currentPath.startsWith('/billing') ||
        currentPath.startsWith('/pricing') ||
        currentPath.startsWith('/account') ||
        currentPath.startsWith('/demo') ||
        currentPath.startsWith('/get-started') ||
        currentPath.startsWith('/privacy') ||
        currentPath.startsWith('/terms');

      if (!currentPath.startsWith('/app') && !isWhitelistedMarketingPage && currentPath !== '/onboarding') {
        navigate('/app');
      }
    } else {
      if (currentPath.startsWith('/app') || currentPath === '/onboarding') {
        navigate('/');
      }
    }
  }, [isLoggedIn, currentPath, sessionChecked, isAccessTierResolved, isOnboardingResolved, subscriptionRedirect, isOnboardingComplete]);

  const handleLoginSuccess = (email: string) => {
      setIsLoggedIn(true);
      setCurrentUserEmail(email);
      // Note: currentUserId is set by the onAuthStateChange listener immediately after this.
  };
  
  const handleLogout = async () => {
      if (supabase) {
        try { await supabase.auth.signOut(); } catch (error) {}
      }
      setIsLoggedIn(false);
      setCurrentUserEmail(null);
      setCurrentUserId(null);
      setIsAccessTierResolved(false);
      setSubscriptionRedirect(null);
      setIsOnboardingResolved(false);
      setIsOnboardingComplete(false);
      navigate('/');
  }

  const handleSubscriptionAccessDenied = (status: string, redirectTo: string) => {
    setSubscriptionRedirect(redirectTo);
    setIsAccessTierResolved(true);
  };

  try {
    const normalizedPath = currentPath.replace(/\/$/, '') || '/';
    
    if (normalizedPath === '/privacy') return <PrivacyPolicy />;
    if (normalizedPath === '/terms') return <TermsOfService />;

    if (!sessionChecked) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-dark">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading JetSuite...</p>
          </div>
        </div>
      );
    }

    if (isLoggedIn && currentUserId && currentPath === '/onboarding') {
      return <OnboardingPage navigate={navigate} userId={currentUserId} />;
    }

    if (isLoggedIn && currentUserId && currentUserEmail) {
      return (
        <SubscriptionGuard 
          userId={currentUserId}
          onAccessDenied={handleSubscriptionAccessDenied}
        >
          <InternalApp 
            onLogout={handleLogout} 
            userEmail={currentUserEmail} 
            userId={currentUserId}
          />
        </SubscriptionGuard>
      );
    }
    
    return <MarketingWebsite currentPath={currentPath} navigate={navigate} onLoginSuccess={handleLoginSuccess} />;
  } catch (error) {
    console.error('[App] Critical render error:', error);
    return <div className="p-10 text-white">Application crashed. Please check console.</div>;
  }
};

export default App;