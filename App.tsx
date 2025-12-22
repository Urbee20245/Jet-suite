
import React, { useState, useEffect } from 'react';
import { InternalApp } from './InternalApp';
import { MarketingWebsite } from './pages/MarketingWebsite';

const App: React.FC = () => {
  // Initialize state from localStorage for persistence, with error handling for security restrictions.
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return !!localStorage.getItem('jetsuite_isLoggedIn');
    } catch (e) {
      console.warn('Could not read login status from localStorage:', e);
      return false;
    }
  });
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem('jetsuite_userEmail');
    } catch (e) {
      console.warn('Could not read user email from localStorage:', e);
      return null;
    }
  });
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);
  
  const navigate = (path: string) => {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
  };

  const handleLoginSuccess = (email: string) => {
      try {
        localStorage.setItem('jetsuite_isLoggedIn', 'true');
        localStorage.setItem('jetsuite_userEmail', email);
      } catch (e) {
        console.warn('Could not write to localStorage:', e);
      }
      setIsLoggedIn(true);
      setCurrentUserEmail(email);
  };
  
  const handleLogout = () => {
      try {
        localStorage.removeItem('jetsuite_isLoggedIn');
        localStorage.removeItem('jetsuite_userEmail');
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
      if (!currentPath.startsWith('/app')) {
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

  // Render logic is now driven by the isLoggedIn state.
  if (isLoggedIn && currentUserEmail) {
    return <InternalApp onLogout={handleLogout} userEmail={currentUserEmail} />;
  }
  
  return <MarketingWebsite currentPath={currentPath} navigate={navigate} onLoginSuccess={handleLoginSuccess} />;
};

export default App;
