import React, { useState, useEffect, useRef } from 'react';
import type { Tool, ProfileData, BusinessReview } from '../types';
import { fetchBusinessReviews } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { HowToUse } from '../components/HowToUse';
import { getSupabaseClient } from '../integrations/supabase/client';
import {
  InformationCircleIcon,
  StarIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  CodeBracketIcon,
  SparklesIcon,
  EnvelopeIcon,
  PhotoIcon,
  LinkIcon,
  GlobeAltIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  ExclamationTriangleIcon
} from '../components/icons/MiniIcons';
import { ALL_TOOLS } from '../constants';

interface JetTrustProps {
  tool: Tool;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null) => void;
}

type WidgetLayout = 'grid' | 'carousel' | 'list';
type StarFilter = 3 | 4 | 5;
type ActiveTab = 'widget' | 'reviewpage' | 'emails';

interface ReviewPageSettings {
  id?: string;
  slug: string;
  business_name: string;
  logo_url: string | null;
  hero_image_url: string | null;
  primary_color: string;
  google_review_url: string;
  is_active: boolean;
}

interface EmailRecipient {
  email: string;
  name: string;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DAILY_EMAILS = 5;

const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' }> = ({ rating, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <StarIcon 
          key={star} 
          className={`${sizeClass} ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};

const WidgetPreview: React.FC<{
  reviews: BusinessReview[];
  layout: WidgetLayout;
  businessName: string;
  reviewUrl: string;
  colors: { primary: string; text: string; background: string; card: string; };
}> = ({ reviews, layout, businessName, reviewUrl, colors }) => {
  
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : '5.0';

  const WidgetHeader = () => (
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold" style={{ color: colors.text }}>What Our Customers Say</h2>
      <div className="flex items-center justify-center gap-2">
        <StarRating rating={parseFloat(averageRating)} />
        <span className="font-semibold" style={{ color: colors.text }}>{averageRating}</span>
        <span className="text-sm" style={{ color: colors.text, opacity: 0.7 }}>({reviews.length} reviews)</span>
      </div>
    </div>
  );

  const WidgetFooter = () => (
    <div className="mt-6 pt-6 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
      <a
        href={reviewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-white font-semibold py-3 px-6 rounded-lg text-center transition mb-3 shadow-md hover:shadow-lg"
        style={{ background: `linear-gradient(to right, ${colors.primary}, color-mix(in srgb, ${colors.primary} 80%, black))` }}
      >
        Leave a Review
      </a>
      <p className="text-center text-xs" style={{ color: colors.text, opacity: 0.6 }}>
        Powered by <span className="font-semibold" style={{ color: colors.primary }}>JetSuite</span>
      </p>
    </div>
  );

  const ReviewItem: React.FC<{ review: BusinessReview }> = ({ review }) => (
    <div className="p-4 rounded-lg shadow border" style={{ backgroundColor: colors.card, borderColor: 'rgba(0,0,0,0.08)' }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold" style={{ color: colors.text }}>{review.author}</p>
          <p className="text-xs" style={{ color: colors.text, opacity: 0.6 }}>{review.date}</p>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>
      <p className="text-sm leading-relaxed" style={{ color: colors.text, opacity: 0.8 }}>{review.text}</p>
    </div>
  );

  if (layout === 'grid') {
    return (
      <div className="p-8 rounded-lg" style={{ backgroundColor: colors.background }}>
        <WidgetHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map(review => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
        <WidgetFooter />
      </div>
    );
  }

  if (layout === 'carousel') {
    return (
      <div className="p-8 rounded-lg" style={{ backgroundColor: colors.background }}>
        <WidgetHeader />
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-4" style={{ scrollSnapType: 'x mandatory' }}>
            {reviews.map(review => (
              <div key={review.id} className="flex-shrink-0 w-80" style={{ scrollSnapAlign: 'start' }}>
                <ReviewItem review={review} />
              </div>
            ))}
          </div>
        </div>
        <WidgetFooter />
      </div>
    );
  }

  // List layout
  return (
    <div className="p-8 rounded-lg" style={{ backgroundColor: colors.background }}>
      <WidgetHeader />
      <div className="space-y-4 max-w-2xl mx-auto">
        {reviews.map(review => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>
      <WidgetFooter />
    </div>
  );
};

export const JetTrust: React.FC<JetTrustProps> = ({ tool, profileData, setActiveTool }) => {
  const [reviews, setReviews] = useState<BusinessReview[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<BusinessReview[]>([]);
  const [layout, setLayout] = useState<WidgetLayout>('grid');
  const [minStars, setMinStars] = useState<StarFilter>(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHowTo, setShowHowTo] = useState(true);
  const [widgetCode, setWidgetCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Connecting to your Google Business Profile...');
  const [socialCopied, setSocialCopied] = useState(false);

  // New state for color customization
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [textColor, setTextColor] = useState('#1F2937');
  const [backgroundColor, setBackgroundColor] = useState('#F9FAFB');
  const [cardColor, setCardColor] = useState('#FFFFFF');

  // Tab navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('widget');

  // Review Page state
  const [reviewPageSettings, setReviewPageSettings] = useState<ReviewPageSettings>({
    slug: '',
    business_name: profileData.business.business_name || '',
    logo_url: null,
    hero_image_url: null,
    primary_color: '#F59E0B',
    google_review_url: '',
    is_active: true
  });
  const [reviewPageLoading, setReviewPageLoading] = useState(false);
  const [reviewPageSaved, setReviewPageSaved] = useState(false);
  const [reviewPageError, setReviewPageError] = useState('');
  const [existingReviewPage, setExistingReviewPage] = useState<ReviewPageSettings | null>(null);
  const [reviewPageLinkCopied, setReviewPageLinkCopied] = useState(false);

  // Email review request state
  const [emailRecipients, setEmailRecipients] = useState<EmailRecipient[]>([{ email: '', name: '' }]);
  const [emailsSentToday, setEmailsSentToday] = useState(0);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  const reviewUrl = profileData.googleBusiness.mapsUrl || 
    `https://search.google.com/local/writereview?placeid=${profileData.googleBusiness.placeId}`;

  // Fetch reviews on mount with progress animation and dynamic messages
  useEffect(() => {
    const fetchReviews = async () => {
      if (profileData.googleBusiness.status === 'Verified' && 
          profileData.business.business_name && 
          profileData.googleBusiness.address) {
        setLoading(true);
        setError('');
        setLoadingProgress(0);
        
        const messages = [
          'Connecting to your Google Business Profile...',
          'Verifying your account credentials...',
          'Scanning for customer reviews...',
          'Analyzing review sentiment...',
          'Organizing your feedback...',
          'Preparing your widget...',
          'Almost there! Finalizing data...'
        ];
        
        let messageIndex = 0;
        
        // Animate progress and cycle messages
        const progressInterval = setInterval(() => {
          setLoadingProgress(prev => {
            const newProgress = prev + 10;
            if (newProgress >= 90) return prev;
            
            // Change message every 20%
            if (newProgress % 20 === 0 && messageIndex < messages.length - 1) {
              messageIndex++;
              setLoadingMessage(messages[messageIndex]);
            }
            
            return newProgress;
          });
        }, 200);
        
        try {
          const fetchedReviews = await fetchBusinessReviews(
            profileData.business.business_name,
            profileData.googleBusiness.address
          );
          
          setLoadingProgress(100);
          setLoadingMessage('Success! Your reviews are ready.');
          
          const formattedReviews: BusinessReview[] = fetchedReviews.map((r, i) => ({
            id: `review_${Date.now()}_${i}`,
            author: r.author,
            rating: r.rating,
            text: r.text,
            date: r.date,
            isPositive: r.rating >= 4
          }));
          
          setReviews(formattedReviews);
        } catch (err) {
          console.error('Failed to fetch reviews:', err);
          setError('Could not fetch reviews. You can still paste reviews manually below.');
        } finally {
          clearInterval(progressInterval);
          setTimeout(() => setLoading(false), 300);
        }
      }
    };
    
    fetchReviews();
  }, [profileData.googleBusiness, profileData.business.business_name]);

  // Filter reviews based on star rating
  useEffect(() => {
    const filtered = reviews.filter(r => r.rating >= minStars);
    setFilteredReviews(filtered);
  }, [reviews, minStars]);

  // Fetch existing review page settings
  useEffect(() => {
    const fetchReviewPage = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      try {
        const userId = localStorage.getItem('jetsuite_userId');
        if (!userId) return;

        const { data, error: fetchError } = await supabase
          .from('review_pages')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!fetchError && data) {
          setExistingReviewPage(data as ReviewPageSettings);
          setReviewPageSettings(data as ReviewPageSettings);
        } else {
          // Set default slug from business name
          const defaultSlug = profileData.business.business_name
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || '';
          
          // --- NEW LOGIC: Use DNA for defaults ---
          const dna = profileData.business.dna;
          const dnaColor = dna?.colors?.[0] || '#F59E0B';
          const dnaLogo = dna?.logo || null;

          setReviewPageSettings(prev => ({
            ...prev,
            slug: defaultSlug,
            google_review_url: reviewUrl,
            primary_color: dnaColor, // Use DNA color
            logo_url: dnaLogo,       // Use DNA logo
          }));
        }
      } catch (err) {
        console.error('Error fetching review page:', err);
      }
    };

    fetchReviewPage();
  }, [profileData.business.business_name, reviewUrl, profileData.business.dna]);

  // Fetch today's email count
  useEffect(() => {
    const fetchEmailCount = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      try {
        const userId = localStorage.getItem('jetsuite_userId');
        if (!userId) return;

        const { data, error: countError } = await supabase
          .rpc('get_user_today_email_count', { p_user_id: userId });

        if (!countError && typeof data === 'number') {
          setEmailsSentToday(data);
        }
      } catch (err) {
        console.error('Error fetching email count:', err);
      }
    };

    fetchEmailCount();
  }, []);

  // Generate widget embed code
  const generateWidgetCode = () => {
    const widgetData = {
      businessName: profileData.business.business_name,
      reviews: filteredReviews,
      layout,
      reviewUrl,
      colors: {
        primary: primaryColor,
        text: textColor,
        background: backgroundColor,
        card: cardColor,
      }
    };

    const embedCode = `<!-- JetSuite Review Widget -->
<div id="jetsuite-reviews-widget"></div>
<script>
  (function() {
    const widgetData = ${JSON.stringify(widgetData, null, 2)};
    
    const container = document.getElementById('jetsuite-reviews-widget');
    if (!container) return;
    
    // Inject styles
    const style = document.createElement('style');
    style.textContent = \`
      .jetsuite-widget { font-family: system-ui, -apple-system, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; background: \${widgetData.colors.background}; border-radius: 12px; }
      .jetsuite-header { text-align: center; margin-bottom: 2rem; }
      .jetsuite-title { font-size: 1.875rem; font-weight: bold; color: \${widgetData.colors.text}; margin-bottom: 0.5rem; }
      .jetsuite-subtitle { color: \${widgetData.colors.text}; opacity: 0.7; }
      .jetsuite-reviews-\${layout} { display: ${layout === 'grid' ? 'grid' : layout === 'list' ? 'flex' : 'flex'}; ${layout === 'grid' ? 'grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));' : layout === 'list' ? 'flex-direction: column; max-width: 42rem; margin: 0 auto;' : 'overflow-x: auto;'} gap: 1rem; }
      .jetsuite-review { background: \${widgetData.colors.card}; padding: 1rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 4px 6px rgba(0,0,0,0.05); ${layout === 'carousel' ? 'min-width: 320px;' : ''} }
      .jetsuite-review-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem; }
      .jetsuite-author { font-weight: 600; color: \${widgetData.colors.text}; }
      .jetsuite-date { font-size: 0.75rem; color: \${widgetData.colors.text}; opacity: 0.6; }
      .jetsuite-stars { display: flex; gap: 2px; }
      .jetsuite-star { width: 1rem; height: 1rem; }
      .jetsuite-text { font-size: 0.875rem; color: \${widgetData.colors.text}; opacity: 0.8; line-height: 1.5; }
      .jetsuite-footer { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(0,0,0,0.1); text-align: center; }
      .jetsuite-cta { display: block; width: 100%; color: white; font-weight: 600; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; margin-bottom: 1rem; transition: all 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.1); background: linear-gradient(to right, \${widgetData.colors.primary}, color-mix(in srgb, \${widgetData.colors.primary} 80%, black)); }
      .jetsuite-cta:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
      .jetsuite-powered { font-size: 0.75rem; color: \${widgetData.colors.text}; opacity: 0.6; }
      .jetsuite-brand { font-weight: 600; color: \${widgetData.colors.primary}; }
    \`;
    document.head.appendChild(style);
    
    // Build HTML
    let html = '<div class="jetsuite-widget">';
    const avgRating = widgetData.reviews.length > 0 ? (widgetData.reviews.reduce((acc, r) => acc + r.rating, 0) / widgetData.reviews.length).toFixed(1) : '5.0';
    html += '<div class="jetsuite-header">';
    html += '<h2 class="jetsuite-title">What Our Customers Say</h2>';
    html += \`<div style="display: flex; align-items: center; justify-content: center; gap: 8px;"><div class="jetsuite-stars" style="color: #FBBF24;">\${'★'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating))}</div><span style="font-weight: 600; color: \${widgetData.colors.text};">\${avgRating}</span><span class="jetsuite-subtitle">(\${widgetData.reviews.length} reviews)</span></div>\`;
    html += '</div>';
    
    html += \`<div class="jetsuite-reviews-\${widgetData.layout}">\`;
    
    if (widgetData.reviews.length === 0) {
      html += '<div style="text-align: center; padding: 3rem 2rem; background: \${widgetData.colors.card}; border-radius: 12px; border: 2px dashed rgba(0,0,0,0.1);">';
      html += '<div style="font-size: 3rem; margin-bottom: 1rem;">⭐</div>';
      html += \`<h3 style="font-size: 1.5rem; font-weight: bold; color: \${widgetData.colors.text}; margin-bottom: 0.5rem;">Be Our First Reviewer!</h3>\`;
      html += \`<p style="color: \${widgetData.colors.text}; opacity: 0.7; margin-bottom: 1.5rem;">We\\'d love to hear about your experience with us.</p>\`;
      html += \`<a href="\${widgetData.reviewUrl}" target="_blank" rel="noopener noreferrer" class="jetsuite-cta" style="display: inline-block; width: auto;">Leave the First Review</a>\`;
      html += '</div>';
    } else {
      widgetData.reviews.forEach(review => {
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        html += '<div class="jetsuite-review">';
        html += '<div class="jetsuite-review-header">';
        html += '<div>';
        html += \`<div class="jetsuite-author">\${review.author}</div>\`;
        html += \`<div class="jetsuite-date">\${review.date}</div>\`;
        html += '</div>';
        html += \`<div class="jetsuite-stars" style="color: #FBBF24;">\${stars}</div>\`;
        html += '</div>';
        html += \`<p class="jetsuite-text">\${review.text}</p>\`;
        html += '</div>';
      });
    }
    html += '</div>';
    
    html += '<div class="jetsuite-footer">';
    html += \`<a href="\${widgetData.reviewUrl}" target="_blank" rel="noopener noreferrer" class="jetsuite-cta">Leave a Review</a>\`;
    html += '<p class="jetsuite-powered">Powered by <span class="jetsuite-brand">JetSuite</span></p>';
    html += '</div>';
    html += '</div>';
    
    container.innerHTML = html;
  })();
</script>`;

    setWidgetCode(embedCode);
    setShowCode(true);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(widgetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadWidget = () => {
    const blob = new Blob([widgetCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profileData.business.business_name.replace(/\s+/g, '_')}_reviews_widget.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRefetchReviews = async () => {
    setLoading(true);
    setError('');
    setLoadingProgress(0);
    setLoadingMessage('Refreshing your reviews...');
    
    const messages = [
      'Refreshing your reviews...',
      'Checking for new feedback...',
      'Updating your data...',
      'Almost done...'
    ];
    
    let messageIndex = 0;
    
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 90) return prev;
        
        if (newProgress % 25 === 0 && messageIndex < messages.length - 1) {
          messageIndex++;
          setLoadingMessage(messages[messageIndex]);
        }
        
        return newProgress;
      });
    }, 200);
    
    try {
      const fetchedReviews = await fetchBusinessReviews(
        profileData.business.business_name,
        profileData.googleBusiness.address || ''
      );
      
      setLoadingProgress(100);
      setLoadingMessage('Reviews updated successfully!');
      
      const formattedReviews: BusinessReview[] = fetchedReviews.map((r, i) => ({
        id: `review_${Date.now()}_${i}`,
        author: r.author,
        rating: r.rating,
        text: r.text,
        date: r.date,
        isPositive: r.rating >= 4
      }));
      
      setReviews(formattedReviews);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError('Could not fetch reviews. Please check your Google Business Profile connection.');
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleCopyQuickLink = () => {
    navigator.clipboard.writeText(reviewUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleExportForSocial = () => {
    if (filteredReviews.length === 0) return;

    // Create formatted text for social media
    let socialText = `⭐ What Our Customers Are Saying! ⭐\n\n`;

    filteredReviews.slice(0, 3).forEach((review, index) => {
      const stars = '⭐'.repeat(review.rating);
      socialText += `${stars}\n"${review.text}"\n- ${review.author}\n\n`;
    });

    socialText += `See more reviews and leave yours: ${reviewUrl}\n\n`;
    socialText += `#CustomerReviews #${profileData.business.business_name.replace(/\s+/g, '')}`;

    navigator.clipboard.writeText(socialText);
    setSocialCopied(true);
    setTimeout(() => setSocialCopied(false), 2000);
  };

  // Review Page Handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'hero') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setReviewPageError('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > MAX_IMAGE_SIZE) {
      setReviewPageError('Image must be less than 5MB');
      return;
    }

    setReviewPageError('');

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (type === 'logo') {
        setReviewPageSettings(prev => ({ ...prev, logo_url: base64 }));
      } else {
        setReviewPageSettings(prev => ({ ...prev, hero_image_url: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveReviewPage = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setReviewPageError('Service unavailable');
      return;
    }

    // Validate slug
    if (!reviewPageSettings.slug || reviewPageSettings.slug.length < 3) {
      setReviewPageError('URL slug must be at least 3 characters');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(reviewPageSettings.slug)) {
      setReviewPageError('URL slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    if (!reviewPageSettings.google_review_url) {
      setReviewPageError('Google review URL is required');
      return;
    }

    setReviewPageLoading(true);
    setReviewPageError('');
    setReviewPageSaved(false);

    try {
      const userId = localStorage.getItem('jetsuite_userId');
      if (!userId) throw new Error('User not logged in');

      const pageData = {
        user_id: userId,
        business_id: profileData.business.id,
        slug: reviewPageSettings.slug,
        business_name: reviewPageSettings.business_name,
        logo_url: reviewPageSettings.logo_url,
        hero_image_url: reviewPageSettings.hero_image_url,
        primary_color: reviewPageSettings.primary_color,
        google_review_url: reviewPageSettings.google_review_url,
        is_active: reviewPageSettings.is_active
      };

      if (existingReviewPage?.id) {
        // Update existing
        const { error: updateError } = await supabase
          .from('review_pages')
          .update(pageData)
          .eq('id', existingReviewPage.id);

        if (updateError) throw updateError;
      } else {
        // Check if slug is already taken
        const { data: existingSlug } = await supabase
          .from('review_pages')
          .select('id')
          .eq('slug', reviewPageSettings.slug)
          .maybeSingle();

        if (existingSlug) {
          setReviewPageError('This URL slug is already taken. Please choose another.');
          setReviewPageLoading(false);
          return;
        }

        // Insert new
        const { data: newPage, error: insertError } = await supabase
          .from('review_pages')
          .insert(pageData)
          .select()
          .single();

        if (insertError) throw insertError;
        setExistingReviewPage(newPage as ReviewPageSettings);
      }

      setReviewPageSaved(true);
      setTimeout(() => setReviewPageSaved(false), 3000);
    } catch (err: any) {
      console.error('Error saving review page:', err);
      setReviewPageError(err.message || 'Failed to save review page');
    } finally {
      setReviewPageLoading(false);
    }
  };

  const handleCopyReviewPageLink = () => {
    const link = `${window.location.origin}/r/${reviewPageSettings.slug}`;
    navigator.clipboard.writeText(link);
    setReviewPageLinkCopied(true);
    setTimeout(() => setReviewPageLinkCopied(false), 2000);
  };

  // Email Handlers
  const addEmailRecipient = () => {
    if (emailRecipients.length < 5) {
      setEmailRecipients([...emailRecipients, { email: '', name: '' }]);
    }
  };

  const removeEmailRecipient = (index: number) => {
    setEmailRecipients(emailRecipients.filter((_, i) => i !== index));
  };

  const updateEmailRecipient = (index: number, field: 'email' | 'name', value: string) => {
    const updated = [...emailRecipients];
    updated[index][field] = value;
    setEmailRecipients(updated);
  };

  const handleSendReviewEmails = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setEmailError('Service unavailable');
      return;
    }

    // Filter valid recipients
    const validRecipients = emailRecipients.filter(r =>
      r.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)
    );

    if (validRecipients.length === 0) {
      setEmailError('Please enter at least one valid email address');
      return;
    }

    const remainingEmails = MAX_DAILY_EMAILS - emailsSentToday;
    if (validRecipients.length > remainingEmails) {
      setEmailError(`You can only send ${remainingEmails} more email(s) today`);
      return;
    }

    if (!existingReviewPage) {
      setEmailError('Please save your review page first before sending emails');
      return;
    }

    setEmailSending(true);
    setEmailError('');
    setEmailSuccess('');

    try {
      const userId = localStorage.getItem('jetsuite_userId');
      if (!userId) throw new Error('User not logged in');

      const reviewPageUrl = `${window.location.origin}/r/${reviewPageSettings.slug}`;
      let sentCount = 0;

      for (const recipient of validRecipients) {
        // Log the email request
        const { error: insertError } = await supabase
          .from('review_request_emails')
          .insert({
            user_id: userId,
            review_page_id: existingReviewPage.id,
            recipient_email: recipient.email,
            recipient_name: recipient.name || null,
            status: 'pending'
          });

        if (insertError) {
          console.error('Failed to log email:', insertError);
          continue;
        }

        // Send email via API
        try {
          const response = await fetch('/api/email/send-review-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: recipient.email,
              recipientName: recipient.name || 'Valued Customer',
              businessName: reviewPageSettings.business_name,
              reviewUrl: reviewPageUrl
            })
          });

          if (response.ok) {
            sentCount++;
            // Update status to sent
            await supabase
              .from('review_request_emails')
              .update({ status: 'sent', sent_at: new Date().toISOString() })
              .eq('recipient_email', recipient.email)
              .eq('review_page_id', existingReviewPage.id)
              .eq('status', 'pending');
          }
        } catch (emailErr) {
          console.error('Email send failed:', emailErr);
        }
      }

      if (sentCount > 0) {
        setEmailSuccess(`Successfully sent ${sentCount} review request email(s)!`);
        setEmailsSentToday(prev => prev + sentCount);
        setEmailRecipients([{ email: '', name: '' }]);
      } else {
        setEmailError('Failed to send emails. Please try again later.');
      }
    } catch (err: any) {
      console.error('Error sending emails:', err);
      setEmailError(err.message || 'Failed to send emails');
    } finally {
      setEmailSending(false);
    }
  };

  // Check if GBP is not connected
  if (profileData.googleBusiness.status !== 'Verified') {
    return (
      <div>
        {showHowTo && (
          <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Connect your verified Google Business Profile first</li>
                  <li>JetTrust will automatically fetch your reviews</li>
                  <li>Choose a layout and star rating filter</li>
                  <li>Generate embeddable widget code</li>
                  <li>Copy and paste on your website or share on social media</li>
              </ul>
          </HowToUse>
        )}
        
        <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg text-center">
          <InformationCircleIcon className="w-12 h-12 mx-auto text-accent-blue mb-4" />
          <h2 className="text-2xl font-bold text-brand-text mb-2">Google Business Profile Required</h2>
          <p className="text-brand-text-muted mb-6 max-w-md mx-auto">
            JetTrust needs your verified Google Business Profile to fetch and display reviews. 
            Once connected, you can create beautiful review widgets for your website.
          </p>
          <button
            onClick={() => {
              const businessDetailsTool = Object.values(ALL_TOOLS).find(t => t.id === 'businessdetails');
              if (businessDetailsTool) setActiveTool(businessDetailsTool);
            }}
            className="bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-opacity shadow-lg"
          >
            Connect Google Business Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHowTo && (
        <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
            <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Works even with zero reviews - start collecting reviews today</li>
                <li>Your reviews are automatically fetched from your Google Business Profile</li>
                <li>Create a public review page to collect reviews from customers</li>
                <li>Send up to 5 review request emails per day to customers</li>
                <li>Generate embed code and add to your website immediately</li>
            </ul>
        </HowToUse>
      )}

      {/* Tab Navigation */}
      <div className="bg-brand-card rounded-xl shadow-sm border border-brand-border overflow-hidden">
        <div className="flex border-b border-brand-border">
          <button
            onClick={() => setActiveTab('widget')}
            className={`flex-1 px-4 py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'widget'
                ? 'bg-accent-purple/10 text-accent-purple border-b-2 border-accent-purple'
                : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-light'
            }`}
          >
            <CodeBracketIcon className="w-4 h-4" />
            Review Widget
          </button>
          <button
            onClick={() => setActiveTab('reviewpage')}
            className={`flex-1 px-4 py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'reviewpage'
                ? 'bg-accent-purple/10 text-accent-purple border-b-2 border-accent-purple'
                : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-light'
            }`}
          >
            <GlobeAltIcon className="w-4 h-4" />
            Public Review Page
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`flex-1 px-4 py-3 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'emails'
                ? 'bg-accent-purple/10 text-accent-purple border-b-2 border-accent-purple'
                : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-light'
            }`}
          >
            <EnvelopeIcon className="w-4 h-4" />
            Email Requests
            {emailsSentToday > 0 && (
              <span className="bg-accent-purple text-white text-xs px-1.5 py-0.5 rounded-full">
                {emailsSentToday}/{MAX_DAILY_EMAILS}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tool Description */}
      <div className="bg-brand-card p-4 rounded-xl shadow-sm border border-brand-border">
        <p className="text-brand-text-muted mb-2">{tool.description}</p>
      </div>

      {/* Connected Business Info */}
      <div className="bg-brand-card p-4 rounded-xl shadow-sm border border-brand-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-brand-text">
              Connected: <span className="font-semibold">{profileData.googleBusiness.profileName}</span>
            </span>
            {profileData.googleBusiness.rating && (
              <span className="text-sm text-brand-text-muted">
                • {profileData.googleBusiness.rating} ⭐ ({profileData.googleBusiness.reviewCount} reviews)
              </span>
            )}
          </div>
          <button
            onClick={handleRefetchReviews}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-accent-purple hover:text-accent-pink font-semibold transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refresh Reviews' : 'Refresh Reviews'}
          </button>
        </div>
      </div>

      {/* ==================== REVIEW PAGE TAB ==================== */}
      {activeTab === 'reviewpage' && (
        <div className="space-y-6">
          {/* Review Page Setup */}
          <div className="bg-brand-card p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
                <GlobeAltIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-brand-text">Public Review Page</h2>
                <p className="text-sm text-brand-text-muted">Create a beautiful page for customers to leave reviews</p>
              </div>
            </div>

            {existingReviewPage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-semibold">Your review page is live!</span>
                  </div>
                  <button
                    onClick={handleCopyReviewPageLink}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition"
                  >
                    <LinkIcon className="w-4 h-4" />
                    {reviewPageLinkCopied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  {window.location.origin}/r/{reviewPageSettings.slug}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Settings */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-2">
                    Page URL Slug *
                  </label>
                  <div className="flex items-center">
                    <span className="bg-brand-light px-3 py-2 rounded-l-lg border border-r-0 border-brand-border text-sm text-brand-text-muted">
                      {window.location.origin}/r/
                    </span>
                    <input
                      type="text"
                      value={reviewPageSettings.slug}
                      onChange={e => setReviewPageSettings(prev => ({
                        ...prev,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                      }))}
                      placeholder="your-business-name"
                      className="flex-1 px-3 py-2 border border-brand-border rounded-r-lg bg-white text-brand-text focus:ring-2 focus:ring-accent-purple focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-brand-text-muted mt-1">Only lowercase letters, numbers, and hyphens</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={reviewPageSettings.business_name}
                    onChange={e => setReviewPageSettings(prev => ({ ...prev, business_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-white text-brand-text focus:ring-2 focus:ring-accent-purple focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text mb-2">
                    Google Review URL *
                  </label>
                  <input
                    type="url"
                    value={reviewPageSettings.google_review_url}
                    onChange={e => setReviewPageSettings(prev => ({ ...prev, google_review_url: e.target.value }))}
                    placeholder="https://g.page/..."
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-white text-brand-text focus:ring-2 focus:ring-accent-purple focus:border-transparent"
                  />
                  <p className="text-xs text-brand-text-muted mt-1">Where customers will be redirected after rating</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={reviewPageSettings.primary_color}
                      onChange={e => setReviewPageSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-10 h-10 rounded border-none cursor-pointer"
                    />
                    <input
                      type="text"
                      value={reviewPageSettings.primary_color}
                      onChange={e => setReviewPageSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-brand-border rounded-lg bg-white text-brand-text font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Image Uploads */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-2">
                    Logo (optional)
                  </label>
                  <div className="border-2 border-dashed border-brand-border rounded-lg p-4 text-center hover:border-accent-purple transition-colors">
                    {reviewPageSettings.logo_url ? (
                      <div className="relative">
                        <img
                          src={reviewPageSettings.logo_url}
                          alt="Logo preview"
                          className="h-20 mx-auto object-contain"
                        />
                        <button
                          onClick={() => setReviewPageSettings(prev => ({ ...prev, logo_url: null }))}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <PhotoIcon className="w-10 h-10 mx-auto text-brand-text-muted mb-2" />
                        <p className="text-sm text-brand-text-muted">Click to upload logo</p>
                        <p className="text-xs text-brand-text-muted">Max 5MB, JPEG/PNG</p>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={e => handleImageUpload(e, 'logo')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text mb-2">
                    Hero Image (optional)
                  </label>
                  <p className="text-xs text-brand-text-muted mb-2">Displayed on the left side of the page on desktop</p>
                  <div className="border-2 border-dashed border-brand-border rounded-lg p-4 text-center hover:border-accent-purple transition-colors">
                    {reviewPageSettings.hero_image_url ? (
                      <div className="relative">
                        <img
                          src={reviewPageSettings.hero_image_url}
                          alt="Hero preview"
                          className="h-32 mx-auto object-cover rounded"
                        />
                        <button
                          onClick={() => setReviewPageSettings(prev => ({ ...prev, hero_image_url: null }))}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <PhotoIcon className="w-10 h-10 mx-auto text-brand-text-muted mb-2" />
                        <p className="text-sm text-brand-text-muted">Click to upload hero image</p>
                        <p className="text-xs text-brand-text-muted">Max 5MB, JPEG/PNG - Best at 800x1200px</p>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={e => handleImageUpload(e, 'hero')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {reviewPageError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                <p className="text-red-600 text-sm">{reviewPageError}</p>
              </div>
            )}

            {reviewPageSaved && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <p className="text-green-600 text-sm">Review page saved successfully!</p>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              {existingReviewPage && (
                <a
                  href={`/r/${reviewPageSettings.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-brand-border rounded-lg text-brand-text font-semibold hover:bg-brand-light transition"
                >
                  Preview Page
                </a>
              )}
              <button
                onClick={handleSaveReviewPage}
                disabled={reviewPageLoading}
                className="bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-2 px-6 rounded-lg transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {reviewPageLoading ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    {existingReviewPage ? 'Update Page' : 'Create Page'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EMAIL REQUESTS TAB ==================== */}
      {activeTab === 'emails' && (
        <div className="space-y-6">
          {/* Email Request Section */}
          <div className="bg-brand-card p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                <EnvelopeIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-brand-text">Send Review Request Emails</h2>
                <p className="text-sm text-brand-text-muted">Request reviews from your customers via email</p>
              </div>
            </div>

            {/* Daily Limit Info */}
            <div className="mb-6 p-4 bg-accent-blue/5 border border-accent-blue/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5 text-accent-blue" />
                  <span className="text-brand-text font-semibold">Daily Email Limit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-accent-blue">{emailsSentToday}</span>
                  <span className="text-brand-text-muted">/ {MAX_DAILY_EMAILS} sent today</span>
                </div>
              </div>
              <div className="mt-2 w-full bg-brand-light rounded-full h-2">
                <div
                  className="h-2 bg-gradient-to-r from-accent-blue to-accent-purple rounded-full transition-all"
                  style={{ width: `${(emailsSentToday / MAX_DAILY_EMAILS) * 100}%` }}
                />
              </div>
            </div>

            {!existingReviewPage && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="text-yellow-800 font-semibold">Review Page Required</p>
                  <p className="text-yellow-700 text-sm">
                    Please create your public review page first before sending email requests.
                    <button
                      onClick={() => setActiveTab('reviewpage')}
                      className="text-accent-purple font-semibold ml-1 hover:underline"
                    >
                      Create Review Page →
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* Email Recipients Form */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-brand-text">
                Email Recipients ({emailRecipients.length}/{MAX_DAILY_EMAILS - emailsSentToday} remaining today)
              </label>

              {emailRecipients.map((recipient, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={recipient.email}
                      onChange={e => updateEmailRecipient(index, 'email', e.target.value)}
                      placeholder="customer@email.com"
                      className="w-full px-3 py-2 border border-brand-border rounded-lg bg-white text-brand-text focus:ring-2 focus:ring-accent-purple focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={recipient.name}
                      onChange={e => updateEmailRecipient(index, 'name', e.target.value)}
                      placeholder="Customer name (optional)"
                      className="w-full px-3 py-2 border border-brand-border rounded-lg bg-white text-brand-text focus:ring-2 focus:ring-accent-purple focus:border-transparent"
                    />
                  </div>
                  {emailRecipients.length > 1 && (
                    <button
                      onClick={() => removeEmailRecipient(index)}
                      className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              {emailRecipients.length < (MAX_DAILY_EMAILS - emailsSentToday) && emailRecipients.length < 5 && (
                <button
                  onClick={addEmailRecipient}
                  className="text-accent-purple hover:text-accent-pink font-semibold text-sm flex items-center gap-1"
                >
                  + Add another recipient
                </button>
              )}
            </div>

            {emailError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                <p className="text-red-600 text-sm">{emailError}</p>
              </div>
            )}

            {emailSuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <p className="text-green-600 text-sm">{emailSuccess}</p>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={handleSendReviewEmails}
                disabled={emailSending || emailsSentToday >= MAX_DAILY_EMAILS || !existingReviewPage}
                className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {emailSending ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-5 h-5" />
                    Send Review Request Emails
                  </>
                )}
              </button>
            </div>

            {/* Email Template Preview */}
            <div className="mt-6 p-4 bg-brand-light rounded-lg">
              <p className="text-xs text-brand-text-muted mb-2 font-semibold">EMAIL PREVIEW</p>
              <div className="bg-white p-4 rounded border border-brand-border">
                <p className="text-sm text-brand-text">
                  <strong>Subject:</strong> {reviewPageSettings.business_name} would love your feedback!
                </p>
                <hr className="my-3 border-brand-border" />
                <p className="text-sm text-brand-text-muted">
                  Hi [Customer Name],
                  <br /><br />
                  Thank you for choosing <strong>{reviewPageSettings.business_name}</strong>! We hope you had a great experience with us.
                  <br /><br />
                  We'd really appreciate it if you could take a moment to share your feedback. Your review helps us improve and helps others discover our business.
                  <br /><br />
                  <span className="text-accent-purple">[Leave a Review Button]</span>
                  <br /><br />
                  Thank you for your support!
                  <br />
                  - The {reviewPageSettings.business_name} Team
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== WIDGET TAB ==================== */}
      {activeTab === 'widget' && (
      <>
      {/* Widget Configuration */}
      <div className="bg-brand-card p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-brand-text mb-6">Widget Configuration</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Layout Selection */}
          <div>
            <label className="block text-sm font-medium text-brand-text mb-3">Layout Style</label>
            <div className="space-y-3">
              {[
                { value: 'grid' as WidgetLayout, label: 'Grid' },
                { value: 'carousel' as WidgetLayout, label: 'Carousel' },
                { value: 'list' as WidgetLayout, label: 'List' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setLayout(option.value)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    layout === option.value
                      ? 'bg-accent-purple/10 border-accent-purple'
                      : 'bg-brand-light border-brand-border hover:border-accent-purple/50'
                  }`}
                >
                  <p className="font-bold text-brand-text">{option.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Star Filter */}
          <div>
            <label className="block text-sm font-medium text-brand-text mb-3">Minimum Star Rating</label>
            <div className="space-y-2">
              {[5, 4, 3].map(stars => (
                <button
                  key={stars}
                  onClick={() => setMinStars(stars as StarFilter)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    minStars === stars
                      ? 'bg-accent-purple/10 border-accent-purple'
                      : 'bg-brand-light border-brand-border hover:border-accent-purple/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-brand-text">{stars}+ Stars Only</span>
                    <StarRating rating={stars} size="sm" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Customization */}
          <div>
            <label className="block text-sm font-medium text-brand-text mb-3">Widget Colors</label>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-brand-light p-2 rounded-lg">
                <label htmlFor="primaryColor" className="text-sm text-brand-text-muted">Primary</label>
                <input type="color" id="primaryColor" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded border-none cursor-pointer" />
              </div>
              <div className="flex items-center justify-between bg-brand-light p-2 rounded-lg">
                <label htmlFor="textColor" className="text-sm text-brand-text-muted">Text</label>
                <input type="color" id="textColor" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-8 h-8 rounded border-none cursor-pointer" />
              </div>
              <div className="flex items-center justify-between bg-brand-light p-2 rounded-lg">
                <label htmlFor="backgroundColor" className="text-sm text-brand-text-muted">Background</label>
                <input type="color" id="backgroundColor" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} className="w-8 h-8 rounded border-none cursor-pointer" />
              </div>
              <div className="flex items-center justify-between bg-brand-light p-2 rounded-lg">
                <label htmlFor="cardColor" className="text-sm text-brand-text-muted">Card</label>
                <input type="color" id="cardColor" value={cardColor} onChange={e => setCardColor(e.target.value)} className="w-8 h-8 rounded border-none cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {reviews.length === 0 && !loading && (
          <div className="mb-6 p-4 bg-accent-blue/5 border-l-4 border-accent-blue rounded">
            <p className="text-sm text-brand-text">
              <strong className="text-accent-blue">No reviews yet?</strong> No problem! Generate your widget now to start collecting reviews. 
              The widget will display a call-to-action encouraging customers to leave their first review.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={generateWidgetCode}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
          >
            <CodeBracketIcon className="w-5 h-5" />
            {filteredReviews.length === 0 ? 'Generate Review Collection Widget' : 'Generate Widget Code'}
          </button>
          {widgetCode && (
            <button
              onClick={handleDownloadWidget}
              className="px-6 bg-accent-blue hover:bg-accent-blue/90 text-white font-bold py-3 rounded-lg transition-all shadow-lg flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Download
            </button>
          )}
        </div>

        {filteredReviews.length === 0 && reviews.length > 0 && (
          <p className="text-center text-brand-text-muted text-sm mt-4">
            No reviews match your filter. Try selecting a lower minimum rating.
          </p>
        )}
      </div>

      {/* Loading State with Progress */}
      {loading && (
        <div className="bg-brand-card p-8 rounded-xl shadow-lg">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-4">
              <SparklesIcon className="w-6 h-6 text-accent-purple animate-pulse" />
              <h3 className="text-lg font-bold text-brand-text">Fetching Your Reviews</h3>
            </div>
            <p className="text-sm text-brand-text-muted animate-pulse">{loadingMessage}</p>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-brand-light rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent-purple via-accent-pink to-accent-blue transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="text-center text-xs text-brand-text-muted mt-3">{loadingProgress}% Complete</p>
          
          {/* Loading Steps */}
          <div className="mt-6 space-y-2">
            <div className={`flex items-center gap-2 text-sm ${loadingProgress >= 30 ? 'text-accent-purple' : 'text-brand-text-muted'}`}>
              {loadingProgress >= 30 ? '✓' : '○'} Authenticating connection
            </div>
            <div className={`flex items-center gap-2 text-sm ${loadingProgress >= 60 ? 'text-accent-purple' : 'text-brand-text-muted'}`}>
              {loadingProgress >= 60 ? '✓' : '○'} Retrieving reviews
            </div>
            <div className={`flex items-center gap-2 text-sm ${loadingProgress >= 90 ? 'text-accent-purple' : 'text-brand-text-muted'}`}>
              {loadingProgress >= 90 ? '✓' : '○'} Processing data
            </div>
          </div>
        </div>
      )}

      {/* Quick Link Section */}
      {!loading && (
        <div className="bg-gradient-to-br from-accent-blue/5 to-accent-purple/5 p-6 rounded-xl shadow-sm border border-accent-blue/20">
          <div className="flex items-start gap-3 mb-4">
            <InformationCircleIcon className="w-6 h-6 text-accent-blue flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-brand-text mb-1">Quick Review Link</h3>
              <p className="text-sm text-brand-text-muted">
                Don't want to embed code? Share this direct link to your Google Business Profile review page via email, text, or social media.
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={reviewUrl}
              readOnly
              className="flex-1 bg-white border border-brand-border rounded-lg px-4 py-2 text-sm text-brand-text font-mono"
            />
            <button
              onClick={handleCopyQuickLink}
              className="bg-accent-blue hover:bg-accent-blue/90 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2 whitespace-nowrap"
            >
              {linkCopied ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>
          
          <p className="text-xs text-brand-text-muted mt-3">
            💡 <strong>Pro Tip:</strong> Add this link to your email signature, receipts, or social media bio
          </p>
        </div>
      )}

      {/* Widget Preview */}
      {!loading && (
        <div className="bg-brand-card p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-brand-text mb-2">Widget Preview</h3>
          <p className="text-sm text-brand-text-muted mb-4">
            {filteredReviews.length === 0 
              ? `Preview: Call-to-action layout (will encourage first review)`
              : `Showing ${filteredReviews.length} review(s) with ${minStars}+ stars in ${layout} layout`
            }
          </p>
          <div className="border-2 border-dashed border-brand-border rounded-lg p-4">
            {filteredReviews.length === 0 ? (
              <div style={{ backgroundColor: backgroundColor }} className="p-8 rounded-lg">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: textColor }}>What Our Customers Say</h2>
                  <p style={{ color: textColor, opacity: 0.7 }}>Real reviews from real customers</p>
                </div>
                <div className="text-center py-12 rounded-xl border-2 border-dashed" style={{ backgroundColor: cardColor, borderColor: 'rgba(0,0,0,0.1)' }}>
                  <div className="text-6xl mb-4">⭐</div>
                  <h3 className="text-2xl font-bold" style={{ color: textColor }}>Be Our First Reviewer!</h3>
                  <p className="mb-6" style={{ color: textColor, opacity: 0.7 }}>We'd love to hear about your experience with us.</p>
                  <a
                    href={reviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-white font-semibold py-3 px-8 rounded-lg transition"
                    style={{ background: `linear-gradient(to right, ${primaryColor}, color-mix(in srgb, ${primaryColor} 80%, black))` }}
                  >
                    Leave the First Review
                  </a>
                </div>
                <div className="mt-6 pt-6 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                  <a
                    href={reviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-white font-semibold py-3 px-6 rounded-lg text-center transition mb-3"
                    style={{ background: `linear-gradient(to right, ${primaryColor}, color-mix(in srgb, ${primaryColor} 80%, black))` }}
                  >
                    Leave a Review
                  </a>
                  <p className="text-center text-xs" style={{ color: textColor, opacity: 0.6 }}>
                    Powered by <span className="font-semibold" style={{ color: primaryColor }}>JetSuite</span>
                  </p>
                </div>
              </div>
            ) : (
              <WidgetPreview
                reviews={filteredReviews.slice(0, layout === 'list' ? 5 : 6)}
                layout={layout}
                businessName={profileData.business.business_name}
                reviewUrl={reviewUrl}
                colors={{ primary: primaryColor, text: textColor, background: backgroundColor, card: cardColor }}
              />
            )}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};