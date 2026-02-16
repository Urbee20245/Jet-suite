// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Clear old caches on load to fix loading issues
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        // Delete old cache versions
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('jet-suite') && !cacheName.includes('v2')) {
            console.log('[PWA] Clearing old cache:', cacheName);
            caches.delete(cacheName);
          }
        });
      });
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully:', registration.scope);

        // Force update check on load
        registration.update();

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[PWA] New Service Worker found, installing...');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is ready
              console.log('[PWA] New version available, please refresh');

              // Automatically reload to apply updates
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          });
        });
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });

    // Handle controller change (new service worker activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] New Service Worker activated, reloading page');
      window.location.reload();
    });
  });
}

// Handle install prompt for PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] Install prompt triggered');
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;

  // Optionally, show your own install button
  // You can create a button in your UI and call showInstallPrompt when clicked
  window.showInstallPrompt = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] Install prompt not available');
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);

    // Clear the deferredPrompt for next time
    deferredPrompt = null;
  };
});

// Track when app is installed
window.addEventListener('appinstalled', () => {
  console.log('[PWA] App installed successfully');
  deferredPrompt = null;

  // Optionally track this event with analytics
  if (window.gtag) {
    gtag('event', 'app_installed', {
      event_category: 'PWA',
      event_label: 'Jet Suite PWA Installed'
    });
  }
});

// Handle iOS standalone mode
if (window.navigator.standalone === true) {
  console.log('[PWA] Running as installed PWA on iOS');
}

// Check if running as PWA
function isRunningAsPWA() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

if (isRunningAsPWA()) {
  console.log('[PWA] Running as installed app');
  document.body.classList.add('pwa-mode');
}

// Disable pull-to-refresh on mobile when running as PWA
if (isRunningAsPWA()) {
  document.body.style.overscrollBehavior = 'none';
}
