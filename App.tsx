import React, { useState, useEffect } from 'react';
import { InternalApp } from './InternalApp';
import { MarketingWebsite } from './pages/MarketingWebsite';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { SubscriptionGuard } from './components/SubscriptionGuard';
import { checkSubscriptionAccess } from './services/subscriptionService';
import { createClient } from '@supabase/supabase-js';

// Access Vite environment variables with proper fallbacks
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Create a dummy client or the real one to prevent top-level crashes
let supabase: any;
try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    console.warn('[App] Missing Supabase credentials. Authentication will be disabled.');
    supabase = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => {},
      }
    };
  }
} catch (error) {
  console.error('[App] Failed to initialize Supabase client:', error);
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => {},
    }
  };
}

console.log('[App] Component module loaded');

const App: React.FC = () => {
  console.log('[App] Component rendering');
  
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
    try {
      // 1. Check Subscription
      const result = await checkSubscriptionAccess(uid);
      setSubscriptionRedirect(result.hasAccess ? null : (result.redirectTo || '/pricing'));
      setIsAccessTierResolved(true);

      // 2. Check Onboarding (Extension)
      // We define "complete" as having a business name and website URL in the database
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('business_name, website_url')
        .eq('user_id', uid)
        .single();
      
      setIsOnboardingComplete(!!(profile?.business_name && profile?.website_url));
      setIsOnboardingResolved(true);
    } catch (error) {
      console.error('[App] Verification failed:', error);
      setSubscriptionRedirect('/pricing');
      setIsAccessTierResolved(true);
      setIsOnboardingResolved(true); // Resolve on error to avoid hanging the UI
    }
  };

  // Check Supabase session on mount
  useEffect(() => {
    const checkSession = async () => {
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
  }, []);

  // Listen for auth state changes
  useEffect(() => {
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
  }, []);

  // Sync currentPath with browser forward/back buttons
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  /**
   * UNIFIED NAVIGATION GUARD
   * Centralizes all routing decisions based on fully resolved state.
   */
  useEffect(() => {
    // 🛡️ Phase 1: Wait for resolution
    if (!sessionChecked) return;
    if (isLoggedIn && (!isAccessTierResolved || !isOnboardingResolved)) return;

    // 🛡️ Phase 2: Evaluate access
    if (isLoggedIn) {
      // Rule 1: Enforce subscription destination (e.g., /pricing or /account for past_due)
      if (subscriptionRedirect) {
        if (currentPath !== subscriptionRedirect) {
          console.log('[App] Enforcing subscription redirect:', subscriptionRedirect);
          navigate(subscriptionRedirect);
        }
        return;
      }

      // Rule 2: Enforce onboarding destination (Paid but not setup)
      if (!isOnboardingComplete) {
        if (currentPath !== '/onboarding' && !currentPath.startsWith('/privacy') && !currentPath.startsWith('/terms')) {
          console.log('[App] Enforcing onboarding redirect');
          navigate('/onboarding');
        }
        return;
      }
      
      // Rule 3: Move logged-in & paid users into the app context if on general landing pages
      const isWhitelistedMarketingPage = 
        currentPath.startsWith('/billing') ||
        currentPath.startsWith('/pricing') ||
        currentPath.startsWith('/account') ||
        currentPath.startsWith('/demo') ||
        currentPath.startsWith('/get-started') ||
        currentPath.startsWith('/privacy') ||
        currentPath.startsWith('/terms');

      if (!currentPath.startsWith('/app') && !isWhitelistedMarketingPage) {
        navigate('/app');
      }
    } else {
      // Rule 4: Kick unauthenticated users out of the app context
      if (currentPath.startsWith('/app') || currentPath === '/onboarding') {
        navigate('/');
      }
    }
  }, [isLoggedIn, currentPath, sessionChecked, isAccessTierResolved, isOnboardingResolved, subscriptionRedirect, isOnboardingComplete]);

  // Handler for login success - simple state update, effect will handle sub check
  const handleLoginSuccess = (email: string) => {
      console.log('[App] Login callback received');
      setIsLoggedIn(true);
      setCurrentUserEmail(email);
  };
  
  const handleLogout = async () => {
      console.log('[App] Logging out...');
      try { await supabase.auth.signOut(); } catch (error) {}
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
    console.log('[App] Callback: Subscription access denied');
    setSubscriptionRedirect(redirectTo);
    setIsAccessTierResolved(true);
  };

  // ⚡ RENDER LOGIC
  try {
    const normalizedPath = currentPath.replace(/\/$/, '') || '/';
    
    // Public Legal Pages (Always accessible, no auth wait)
    if (normalizedPath === '/privacy') return <PrivacyPolicy />;
    if (normalizedPath === '/terms') return <TermsOfService />;

    // Global Loader
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

    // Authenticated View
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
    
    // Default Marketing View
    return <MarketingWebsite currentPath={currentPath} navigate={navigate} onLoginSuccess={handleLoginSuccess} />;
  } catch (error) {
    console.error('[App] Critical render error:', error);
    return <div className="p-10 text-white">Application crashed. Please check console.</div>;
  }
};

export default App;