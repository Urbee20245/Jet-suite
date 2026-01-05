business_name).">
import React, { useState, useEffect } from 'react';
import type { Tool, ProfileData, BusinessReview } from '../types';
import { fetchBusinessReviews } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { HowToUse } from '../components/HowToUse';
import { 
  InformationCircleIcon, 
  StarIcon, 
  ArrowPathIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  CodeBracketIcon,
  SparklesIcon
} from '../components/icons/MiniIcons';
import { ALL_TOOLS } from '../constants';

interface JetTrustProps {
  tool: Tool;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null) => void;
}

type WidgetLayout = 'grid' | 'carousel' | 'list';
type StarFilter = 3 | 4 | 5;

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
      .jetsuite-reviews-${layout} { display: ${layout === 'grid' ? 'grid' : layout === 'list' ? 'flex' : 'flex'}; ${layout === 'grid' ? 'grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));' : layout === 'list' ? 'flex-direction: column; max-width: 42rem; margin: 0 auto;' : 'overflow-x: auto;'} gap: 1rem; }
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
                <li>Choose a layout style (Grid, Carousel, or List)</li>
                <li>Filter by minimum star rating (3, 4, or 5 stars) if you have reviews</li>
                <li>Generate embed code and add to your website immediately</li>
            </ul>
        </HowToUse>
      )}

      {/* Tool Description */}
      <div className="bg-brand-card p-4 rounded-xl shadow-sm border border-brand-border">
        <p className="text-brand-text-muted mb-2">{tool.description}</p>
        <p className="text-sm text-brand-text-muted">
          Replaces: <span className="text-accent-purple font-semibold">Review Widget Service ($50-200/mo)</span>
        </p>
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

      {/* Embed Code & Social Media Export */}
      {showCode && widgetCode && (
        <div className="space-y-6">
          {/* Widget Embed Code */}
          <div className="bg-brand-card p-6 rounded-xl shadow-lg border-2 border-accent-purple/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-brand-text flex items-center gap-2">
                  <CodeBracketIcon className="w-6 h-6 text-accent-purple" />
                  Widget Embed Code
                </h3>
                <p className="text-sm text-brand-text-muted mt-1">Add this to your website</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 bg-accent-purple hover:bg-accent-purple/90 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  {copied ? '✓ Copied!' : 'Copy Code'}
                </button>
                <button
                  onClick={handleDownloadWidget}
                  className="flex items-center gap-2 bg-accent-blue hover:bg-accent-blue/90 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm"><code>{widgetCode}</code></pre>
            </div>
            <div className="mt-4 p-4 bg-accent-blue/5 border-l-4 border-accent-blue rounded">
              <p className="text-sm text-brand-text">
                <strong className="text-accent-blue">How to Use:</strong> Copy the code above and paste it into your website's HTML where you want the reviews to appear. 
                The widget is fully self-contained and will display automatically.
              </p>
            </div>
          </div>

          {/* Social Media Export */}
          {filteredReviews.length > 0 && (
            <div className="bg-gradient-to-br from-accent-pink/5 to-accent-purple/5 p-6 rounded-xl shadow-lg border-2 border-accent-pink/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-brand-text flex items-center gap-2">
                    ✨ Social Media Post
                  </h3>
                  <p className="text-sm text-brand-text-muted mt-1">Share your best reviews on social</p>
                </div>
                <button
                  onClick={handleExportForSocial}
                  className="flex items-center gap-2 bg-gradient-to-r from-accent-pink to-accent-purple hover:opacity-90 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  {socialCopied ? '✓ Copied!' : 'Copy for Social Media'}
                </button>
              </div>
              <div className="bg-white p-4 rounded-lg border border-brand-border">
                <div className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  <p className="font-bold mb-2">⭐ What Our Customers Are Saying! ⭐</p>
                  {filteredReviews.slice(0, 3).map((review, idx) => (
                    <div key={idx} className="mb-3">
                      <p className="text-yellow-500">{'⭐'.repeat(review.rating)}</p>
                      <p className="italic">"{review.text.slice(0, 100)}{review.text.length > 100 ? '...' : ''}"</p>
                      <p className="text-xs text-gray-500">- {review.author}</p>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 mt-3">See more reviews: {reviewUrl}</p>
                </div>
              </div>
              <p className="text-xs text-brand-text-muted mt-3">
                💡 <strong>Pro Tip:</strong> Perfect for Instagram, Facebook, Twitter, or LinkedIn posts
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};