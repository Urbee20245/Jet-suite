
import React, { useState, useEffect } from 'react';
import { InternalApp } from './InternalApp';
import { MarketingWebsite } from './pages/MarketingWebsite';
import { SubscriptionGuard } from './components/SubscriptionGuard';

console.log('[App] Component module loaded');

const App: React.FC = () => {
  console.log('[App] Component rendering');
  
  // Initialize state from localStorage for persistence, with error handling for security restrictions.
 const [isLoggedIn, setIsLoggedIn] = useState(() => {
  try {
    if (typeof localStorage === 'undefined') return false;
    const value = localStorage.getItem('jetsuite_isLoggedIn');
    // Only true if value is EXACTLY 'true' string
    return value === 'true';
  } catch (e) {
    console.warn('Could not read login status from localStorage:', e);
    return false;
  }
});
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem('jetsuite_userEmail') : null;
    } catch (e) {
      console.warn('Could not read user email from localStorage:', e);
      return null;
    }
  });
  const [currentPath, setCurrentPath] = useState(() => {
    try {
      return typeof window !== 'undefined' ? window.location.pathname : '/';
    } catch (e) {
      console.warn('Could not read location pathname:', e);
      return '/';
    }
  });

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

  const handleLoginSuccess = (email: string) => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('jetsuite_isLoggedIn', 'true');
          localStorage.setItem('jetsuite_userEmail', email);
        }
      } catch (e) {
        console.warn('Could not write to localStorage:', e);
      }
      setIsLoggedIn(true);
      setCurrentUserEmail(email);
  };
  
  const handleLogout = () => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('jetsuite_isLoggedIn');
          localStorage.removeItem('jetsuite_userEmail');
        }
      } catch (e) {
        console.warn('Could not remove from localStorage:', e);
      }
      setIsLoggedIn(false);
      setCurrentUserEmail(null);
  }

  // Effect to handle navigation based on login state changes.
  useEffect(() => {
    if (isLoggedIn) {
      // If the user logs in, redirect them to the app.
      if (!currentPath.startsWith('/app') && !currentPath.startsWith('/billing')) {
        navigate('/app');
      }
    } else {
      // If the user logs out or is not logged in,
      // redirect them from the app section to the homepage.
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
  console.log('[App] Rendering with state:', { isLoggedIn, currentPath, hasEmail: !!currentUserEmail });
  
  try {
    if (isLoggedIn && currentUserEmail) {
      // User is logged in - wrap with SubscriptionGuard to enforce billing access
      // SubscriptionGuard will check subscription status and block access if not active
      return (
        <SubscriptionGuard 
          userId={currentUserEmail} // Use email as userId for now
          onAccessDenied={handleSubscriptionAccessDenied}
        >
          <InternalApp onLogout={handleLogout} userEmail={currentUserEmail} />
        </SubscriptionGuard>
      );
    }
    
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
