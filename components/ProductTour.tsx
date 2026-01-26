import { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { getSupabaseClient } from '../integrations/supabase/client';

interface ProductTourProps {
  userId: string;
  userFirstName: string;
  onComplete?: () => void;
}

export const ProductTour: React.FC<ProductTourProps> = ({ userId, userFirstName, onComplete }) => {
  const [tourStarted, setTourStarted] = useState(false);

  useEffect(() => {
    checkAndStartTour();
  }, []);

  const checkAndStartTour = async () => {
    const completed = localStorage.getItem(`jetsuite_tour_completed_${userId}`);
    
    if (!completed) {
      setTimeout(() => {
        startTour();
      }, 1500);
    }
  };

  const startTour = () => {
    if (tourStarted) return;
    setTourStarted(true);
    
    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      steps: [
        {
          element: 'body',
          popover: {
            title: `Welcome to JetSuite, ${userFirstName}! 🚀`,
            description: 'Let\'s take a quick 2-minute tour to show you how to grow your business with AI-powered tools. Ready?\n\nClick "Next" to start or "Close" if you\'re already familiar.',
            align: 'center'
          }
        },
        {
          element: '[data-tour="business-details"]',
          popover: {
            title: '1️⃣ Start Here: Business Details',
            description: 'First, complete your business profile. This helps our AI understand your business and provide personalized recommendations. Click here when you\'re ready to set up your profile.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '[data-tour="analyze-section"]',
          popover: {
            title: '2️⃣ Analyze & Diagnose',
            description: 'These tools analyze your business and find opportunities for growth. Start with JetBiz (Google Business Profile audit) and JetViz (website analysis).',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '[data-tour="jetbiz"]',
          popover: {
            title: '🔍 JetBiz - Google Business Audit',
            description: 'Run this FIRST! JetBiz audits your Google Business Profile and tells you exactly what to fix to rank higher in local search. Takes 30 seconds.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '[data-tour="jetviz"]',
          popover: {
            title: '🌐 JetViz - Website Analysis',
            description: 'Run this SECOND! JetViz analyzes your website for SEO, speed, mobile-friendliness, and conversion issues. Get actionable fixes in minutes.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '[data-tour="growth-plan"]',
          popover: {
            title: '📋 Your Growth Plan',
            description: 'After running JetBiz and JetViz, check here for your personalized weekly action plan. Complete 3-5 tasks per week to grow your business.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '[data-tour="ask-boris"]',
          popover: {
            title: '🤖 Meet Boris - Your AI Coach',
            description: 'Boris is your personal growth coach! Ask him questions like "What should I do today?" or "How do I get more customers?" He\'ll guide you every step of the way.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '[data-tour="attract-section"]',
          popover: {
            title: '3️⃣ Attract & Visibility Tools',
            description: 'Use these tools to attract more customers: JetContent (blog posts), JetSocial (social media), JetAds (advertising). Use AFTER you complete your audits.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '[data-tour="trust-section"]',
          popover: {
            title: '4️⃣ Trust & Engagement Tools',
            description: 'Build trust with customers: JetReply (review management), JetTrust (reputation), JetLeads (lead capture). These help convert visitors into customers.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '[data-tour="header-help"]',
          popover: {
            title: '❓ Need Help?',
            description: 'Click this help icon anytime to restart this tour, access our knowledge base, or contact support. We\'re here to help you succeed!',
            side: 'bottom',
            align: 'end'
          }
        },
        {
          element: 'body',
          popover: {
            title: '🎉 You\'re All Set!',
            description: 'Here\'s your action plan:\n\n1️⃣ Complete Business Details\n2️⃣ Run JetBiz audit\n3️⃣ Run JetViz audit\n4️⃣ Check your Growth Plan\n5️⃣ Complete 3-5 weekly tasks\n\nAsk Boris if you need help! Let\'s grow your business! 🚀',
            align: 'center'
          }
        }
      ],
      onDestroyStarted: () => {
        localStorage.setItem(`jetsuite_tour_completed_${userId}`, 'true');
        saveTourCompletionToDatabase(userId);
        if (onComplete) onComplete();
        if (driverObj && driverObj.isActive && driverObj.isActive()) {
          driverObj.destroy();
        }
      },
    });

    driverObj.drive();
  };

  const saveTourCompletionToDatabase = async (userId: string) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          tour_completed: true,
          tour_completed_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    } catch (error) {
      console.error('Error saving tour completion:', error);
    }
  };

  (window as any).restartProductTour = startTour;

  return null;
};

export const manuallyStartTour = () => {
  if ((window as any).restartProductTour) {
    (window as any).restartProductTour();
  }
};
