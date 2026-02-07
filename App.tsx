import React, { useState, useEffect, useMemo } from 'react';
import InternalApp from './InternalApp';
import { MarketingWebsite } from './pages/MarketingWebsite';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { OnboardingPage } from './pages/OnboardingPage';
import { SubscriptionGuard } from './components/SubscriptionGuard';
import { checkSubscriptionAccess } from './services/subscriptionService';
import { fetchRealDateTime } from './utils/realTime';
import { getSupabaseClient } from './integrations/supabase/client';
import { NotFoundPage } from './pages/NotFoundPage';
import { ContactPage } from './pages/ContactPage';
import Admin from './pages/Admin';
import { ReviewPagePublic } from './pages/ReviewPagePublic';

// This component contains the original dynamic logic of the app.
const CoreApp: React.FC = () => {
  console.log('[App] CoreApp rendering');
  
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
  const [hasAnyBusinessProfile, setHasAnyBusinessProfile] = useState(false);

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
      setSubscriptionRedirect('/billing/locked');
      setIsAccessTierResolved(true);
      setIsOnboardingResolved(true);
      return;
    }
    
    try {
      const result = await checkSubscriptionAccess(uid);
      setSubscriptionRedirect(result.hasAccess ? null : '/billing/locked');
      setIsAccessTierResolved(true);

      const { count: profileCount } = await supabase
        .from('business_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid);
      
      setHasAnyBusinessProfile(!!profileCount && profileCount > 0);
      setIsOnboardingResolved(true);
    } catch (error) {
      console.error('[App] Verification failed:', error);
      setSubscriptionRedirect('/billing/locked');
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
          localStorage.removeItem('jetsuite_userId');
          setSessionChecked(true);
          return;
        }
        
        setIsLoggedIn(true);
        setCurrentUserEmail(session.user.email || null);
        setCurrentUserId(session.user.id);
        localStorage.setItem('jetsuite_userId', session.user.id);
        
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
      if (event === 'SIGNED_IN' && session?.user) {
        setIsLoggedIn(true);
        setCurrentUserEmail(session.user.email || null);
        setCurrentUserId(session.user.id);
        localStorage.setItem('jetsuite_userId', session.user.id);
        verifySubscription(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setCurrentUserEmail(null);
        setCurrentUserId(null);
        localStorage.removeItem('jetsuite_userId');
        setIsAccessTierResolved(false);
        setSubscriptionRedirect(null);
        setIsOnboardingResolved(false);
        setHasAnyBusinessProfile(false);
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
        const isWhitelisted = 
          currentPath === '/pricing' || 
          currentPath === '/account' || 
          currentPath.startsWith('/billing/') ||
          currentPath === '/contact' ||
          currentPath === '/savings' ||
          currentPath === '/admin';
          
        if (isWhitelisted) return;

        if (currentPath !== subscriptionRedirect) {
          navigate(subscriptionRedirect);
        }
        return;
      }

      if (!hasAnyBusinessProfile) {
        const isWhitelisted = 
          currentPath === '/onboarding' || 
          currentPath.startsWith('/privacy-policy') || 
          currentPath.startsWith('/privacy') || // ADDED
          currentPath.startsWith('/terms') || 
          currentPath.startsWith('/contact') || 
          currentPath === '/admin';

        if (!isWhitelisted) {
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
        currentPath.startsWith('/privacy-policy') ||
        currentPath.startsWith('/privacy') || // ADDED
        currentPath.startsWith('/terms') ||
        currentPath.startsWith('/savings') ||
        currentPath.startsWith('/features') ||
        currentPath.startsWith('/how-it-works') ||
        currentPath.startsWith('/faq') ||
        currentPath.startsWith('/contact') ||
        currentPath === '/admin';

      if (!currentPath.startsWith('/app') && !isWhitelistedMarketingPage && currentPath !== '/onboarding') {
        navigate('/app');
      }
    } else {
      if (currentPath.startsWith('/app') || currentPath === '/onboarding' || currentPath === '/admin') {
        navigate('/');
      }
    }
  }, [isLoggedIn, currentPath, sessionChecked, isAccessTierResolved, isOnboardingResolved, subscriptionRedirect, hasAnyBusinessProfile]);

  const handleLoginSuccess = (email: string) => {
      setIsLoggedIn(true);
      setCurrentUserEmail(email);
  };
  
  const handleLogout = async () => {
      if (supabase) {
        try { await supabase.auth.signOut(); } catch (error) {}
      }
      setIsLoggedIn(false);
      setCurrentUserEmail(null);
      setCurrentUserId(null);
      localStorage.removeItem('jetsuite_userId'); 
      setIsAccessTierResolved(false);
      setSubscriptionRedirect(null);
      setIsOnboardingResolved(false);
      setHasAnyBusinessProfile(false);
      navigate('/');
  }

  const handleSubscriptionAccessDenied = (status: string, redirectTo: string) => {
    console.log('[App] Subscription access denied:', { status, redirectTo });
    navigate('/billing/locked'); 
  };

  try {
    const normalizedPath = currentPath.replace(/\/$/, '') || '/';
    
    // Admin route - must be logged in to access
    if (normalizedPath === '/admin') {
      return <Admin navigate={navigate} />;
    }

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

    if (isLoggedIn && currentUserId && !hasAnyBusinessProfile && currentPath === '/onboarding') {
      return <OnboardingPage navigate={navigate} userId={currentUserId} />;
    }

    const isProtectedRoute = currentPath.startsWith('/app');

    if (isLoggedIn && currentUserId && currentUserEmail) {
      if (isProtectedRoute) {
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
      } else {
        return <MarketingWebsite 
          currentPath={currentPath} 
          navigate={navigate} 
          onLoginSuccess={handleLoginSuccess} 
          onLogout={handleLogout}
        />;
      }
    }

    const validMarketingRoutes = [
      '/',
      '/features',
      '/how-it-works',
      '/pricing',
      '/faq',
      '/get-started',
      '/demo/jetviz',
      '/demo/jetbiz',
      '/savings',
      '/login',
      '/billing/success',
      '/billing/locked',
      '/contact',
      '/privacy',
      '/privacy-policy',
      '/terms',
      '/terms-of-service',
      '/schedule-demo'
    ];

    if (validMarketingRoutes.includes(normalizedPath) || normalizedPath.startsWith('/billing/')) {
      return <MarketingWebsite 
        currentPath={currentPath} 
        navigate={navigate} 
        onLoginSuccess={handleLoginSuccess} 
        onLogout={handleLogout}
      />;
    }

    return <NotFoundPage navigate={navigate} />;
    
  } catch (error) {
    console.error('[App] Critical render error:', error);
    return <div className="p-10 text-white">Application crashed. Please check console.</div>;
  }
};

const App: React.FC = () => {
  // This check runs immediately on the client, before any state is set.
  const [staticPageComponent] = useMemo(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname : '/';
    const normalized = path.replace(/\/$/, '') || '/';

    if (normalized === '/privacy-policy' || normalized === '/privacy') {
      return [<PrivacyPolicy />];
    }
    if (normalized === '/terms' || normalized === '/terms-of-service') {
      return [<TermsOfService />];
    }
    if (normalized === '/contact') {
      return [<ContactPage />];
    }
    // Public review page route: /r/{slug}
    if (normalized.startsWith('/r/')) {
      const slug = normalized.replace('/r/', '');
      if (slug && slug.length > 0) {
        return [<ReviewPagePublic slug={slug} />];
      }
    }
    return [null];
  }, []);

  // If it's a static page, render it directly and bypass the main app logic.
  if (staticPageComponent) {
    return staticPageComponent;
  }

  // Otherwise, render the main, dynamic application.
  return <CoreApp />;
};

// Initial real-time fetch
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

export default App;