import React, { useState, useEffect } from 'react';
import { InternalApp } from './InternalApp';
import { MarketingWebsite } from './pages/MarketingWebsite';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { SubscriptionGuard } from './components/SubscriptionGuard';
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
    // Mock client to prevent crashes
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
  // Fallback mock
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
  
  // Initialize state - don't rely on localStorage as source of truth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [currentPath, setCurrentPath] = useState(() => {
    try {
      return typeof window !== 'undefined' ? window.location.pathname : '/';
    } catch (e) {
      console.warn('Could not read location pathname:', e);
      return '/';
    }
  });

  // Check Supabase session on mount
  useEffect(() => {
    const checkSession = async () => {
      // Timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session check timeout')), 5000)
      );

      try {
        // Race between session check and timeout
        const result: any = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]);
        
        const { data: { session }, error } = result;
        
        if (error) {
          console.error('[App] Session check error:', error);
          localStorage.removeItem('jetsuite_isLoggedIn');
          localStorage.removeItem('jetsuite_userEmail');
          localStorage.removeItem('jetsuite_userId');
          setSessionChecked(true);
          return;
        }
        
        if (session?.user) {
          console.log('[App] Valid session found:', session.user.email);
          setIsLoggedIn(true);
          setCurrentUserEmail(session.user.email || null);
          setCurrentUserId(session.user.id);
          localStorage.setItem('jetsuite_isLoggedIn', 'true');
          localStorage.setItem('jetsuite_userEmail', session.user.email || '');
          localStorage.setItem('jetsuite_userId', session.user.id);
        } else {
          console.log('[App] No valid session found');
          setIsLoggedIn(false);
          setCurrentUserEmail(null);
          setCurrentUserId(null);
          localStorage.removeItem('jetsuite_isLoggedIn');
          localStorage.removeItem('jetsuite_userEmail');
          localStorage.removeItem('jetsuite_userId');
        }
      } catch (error) {
        console.error('[App] Session check failed or timed out:', error);
        // On error/timeout, assume logged out so app loads
        setIsLoggedIn(false);
        setSessionChecked(true);
      } finally {
        setSessionChecked(true);
      }
    };
    
    checkSession();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[App] Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setIsLoggedIn(true);
        setCurrentUserEmail(session.user.email || null);
        setCurrentUserId(session.user.id);
        localStorage.setItem('jetsuite_isLoggedIn', 'true');
        localStorage.setItem('jetsuite_userEmail', session.user.email || '');
        localStorage.setItem('jetsuite_userId', session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setCurrentUserEmail(null);
        setCurrentUserId(null);
        localStorage.removeItem('jetsuite_isLoggedIn');
        localStorage.removeItem('jetsuite_userEmail');
        localStorage.removeItem('jetsuite_userId');
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const onLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);
  
  const navigate = (path: string) => {
      if (typeof window === 'undefined') return;
      try {
        window.history.pushState({}, '', path);
        setCurrentPath(path);
      } catch (e) {
        console.warn('Could not navigate:', e);
      }
  };

  // Handle login success - session listener will update state automatically
  const handleLoginSuccess = async (email: string) => {
      console.log('[App] Login callback received:', { email });
      
      // Trigger a fresh session check to get the userId
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setIsLoggedIn(true);
          setCurrentUserEmail(session.user.email || null);
          setCurrentUserId(session.user.id);
          localStorage.setItem('jetsuite_isLoggedIn', 'true');
          localStorage.setItem('jetsuite_userEmail', session.user.email || '');
          localStorage.setItem('jetsuite_userId', session.user.id);
        }
      } catch (error) {
        console.error('[App] Failed to get session after login:', error);
        // Fallback to basic email storage
        setIsLoggedIn(true);
        setCurrentUserEmail(email);
      }
  };
  
  const handleLogout = async () => {
      console.log('[App] Logging out...');
      
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('[App] Logout error:', error);
      }
      
      setIsLoggedIn(false);
      setCurrentUserEmail(null);
      setCurrentUserId(null);
      localStorage.removeItem('jetsuite_isLoggedIn');
      localStorage.removeItem('jetsuite_userEmail');
      localStorage.removeItem('jetsuite_userId');
      navigate('/');
  }

  // Effect to handle navigation based on login state changes.
  useEffect(() => {
    if (isLoggedIn) {
      // If the user logs in, redirect them to the app.
      // Allow /pricing, /account, /privacy, /terms so users can access these pages
      if (!currentPath.startsWith('/app') && 
          !currentPath.startsWith('/billing') && 
          !currentPath.startsWith('/pricing') &&
          !currentPath.startsWith('/account') &&
          !currentPath.startsWith('/demo') &&
          !currentPath.startsWith('/get-started') &&
          !currentPath.startsWith('/privacy') &&
          !currentPath.startsWith('/terms')) {
        navigate('/app');
      }
    } else {
      // If the user logs out or is not logged in,
      // redirect them from the app section to the homepage.
      // But allow access to /privacy and /terms (public pages)
      if (currentPath.startsWith('/app')) {
        navigate('/');
      }
    }
  }, [isLoggedIn, currentPath]);

  // Handle subscription access denial
  const handleSubscriptionAccessDenied = (status: string, redirectTo: string) => {
    console.log('[App] Subscription access denied:', { status, redirectTo });
    // Force navigation to pricing or billing page
    navigate(redirectTo);
    // After navigation completes, the user will see the marketing website
    // since they're still logged in but without access
  };

  // Render logic is now driven by the isLoggedIn state.
  console.log('[App] Rendering with state:', { 
    isLoggedIn, 
    sessionChecked,
    currentPath, 
    hasEmail: !!currentUserEmail,
    hasUserId: !!currentUserId 
  });
  
  try {
    // ⚡ CHECK LEGAL PAGES FIRST - BEFORE ANY AUTH CHECKS
    // This ensures /privacy and /terms load immediately without waiting for session
    // Normalize path to handle trailing slashes
    const normalizedPath = currentPath.replace(/\/$/, '');
    
    if (normalizedPath === '/privacy') {
      console.log('[App] 📜 Rendering Privacy Policy (public)', { originalPath: currentPath, normalized: normalizedPath });
      return <PrivacyPolicy />;
    }
    
    if (normalizedPath === '/terms') {
      console.log('[App] 📜 Rendering Terms of Service (public)', { originalPath: currentPath, normalized: normalizedPath });
      return <TermsOfService />;
    }

    // Show loading while checking session (only for non-legal pages)
    if (!sessionChecked) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-dark">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading...</p>
          </div>
        </div>
      );
    }

    // User is logged in with valid session
    if (isLoggedIn && currentUserId && currentUserEmail) {
      console.log('[App] ✅ User authenticated, loading app with subscription guard');
      return (
        <SubscriptionGuard 
          userId={currentUserId}
          onAccessDenied={handleSubscriptionAccessDenied}
        >
          <InternalApp onLogout={handleLogout} userEmail={currentUserEmail} />
        </SubscriptionGuard>
      );
    }
    
    // Default: public marketing website (no authentication required)
    console.log('[App] 🌐 Showing public marketing website');
    return <MarketingWebsite currentPath={currentPath} navigate={navigate} onLoginSuccess={handleLoginSuccess} />;
  } catch (error) {
    console.error('[App] Render error:', error);
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>Application Error</h1>
        <p>Failed to render the application. Please check the console for details.</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
          {error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    );
  }
};

export default App;
