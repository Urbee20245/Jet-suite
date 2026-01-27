import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons/MiniIcons';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: number;
  target_audience: string;
  created_at: string;
}

interface AnnouncementPopupProps {
  userSubscriptionStatus?: string;
}

const DISMISSED_ANNOUNCEMENTS_KEY = 'jetsuite_dismissed_announcements';

export const AnnouncementPopup: React.FC<AnnouncementPopupProps> = ({
  userSubscriptionStatus
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get dismissed announcement IDs from localStorage
  const getDismissedIds = (): string[] => {
    try {
      const stored = localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Save dismissed announcement ID to localStorage
  const saveDismissedId = (id: string) => {
    try {
      const dismissed = getDismissedIds();
      if (!dismissed.includes(id)) {
        dismissed.push(id);
        localStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, JSON.stringify(dismissed));
      }
    } catch {
      // Ignore localStorage errors
    }
  };

  // Fetch announcements on mount
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('/api/announcements/active', {
          headers: {
            'x-user-subscription': userSubscriptionStatus || ''
          }
        });

        if (response.ok) {
          const data = await response.json();
          const dismissedIds = getDismissedIds();

          // Filter out already dismissed announcements
          const newAnnouncements = (data.announcements || []).filter(
            (a: Announcement) => !dismissedIds.includes(a.id)
          );

          setAnnouncements(newAnnouncements);

          if (newAnnouncements.length > 0) {
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, [userSubscriptionStatus]);

  const handleDismiss = () => {
    if (announcements[currentIndex]) {
      saveDismissedId(announcements[currentIndex].id);
    }

    if (currentIndex < announcements.length - 1) {
      // Show next announcement
      setCurrentIndex(prev => prev + 1);
    } else {
      // No more announcements, hide popup
      setIsVisible(false);
    }
  };

  const handleDismissAll = () => {
    // Dismiss all remaining announcements
    announcements.slice(currentIndex).forEach(a => saveDismissedId(a.id));
    setIsVisible(false);
  };

  if (isLoading || !isVisible || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];
  const remainingCount = announcements.length - currentIndex;

  // Type-based styling
  const typeStyles = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'bg-blue-500',
      title: 'text-blue-900',
      text: 'text-blue-800'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'bg-yellow-500',
      title: 'text-yellow-900',
      text: 'text-yellow-800'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'bg-green-500',
      title: 'text-green-900',
      text: 'text-green-800'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'bg-red-500',
      title: 'text-red-900',
      text: 'text-red-800'
    }
  };

  const style = typeStyles[currentAnnouncement.type] || typeStyles.info;

  // Icon based on type
  const TypeIcon = () => {
    switch (currentAnnouncement.type) {
      case 'warning':
        return (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div
        className={`${style.bg} ${style.border} border-2 rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-opacity-20">
          <div className="flex items-center gap-3">
            <div className={`${style.icon} p-2 rounded-full`}>
              <TypeIcon />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${style.title}`}>
                {currentAnnouncement.title}
              </h3>
              {remainingCount > 1 && (
                <p className="text-xs text-gray-500">
                  {currentIndex + 1} of {announcements.length} announcements
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Close announcement"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className={`${style.text} text-sm whitespace-pre-wrap`}>
            {currentAnnouncement.message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 bg-white bg-opacity-50 border-t border-opacity-20">
          <p className="text-xs text-gray-500">
            {new Date(currentAnnouncement.created_at).toLocaleDateString()}
          </p>
          <div className="flex gap-2">
            {remainingCount > 1 && (
              <button
                onClick={handleDismissAll}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Dismiss All ({remainingCount})
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="px-4 py-1.5 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              {remainingCount > 1 ? 'Next' : 'Got it'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPopup;
