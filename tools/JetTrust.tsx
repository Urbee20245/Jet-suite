
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
  CodeBracketIcon
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
}> = ({ reviews, layout, businessName, reviewUrl }) => {
  
  const WidgetHeader = () => (
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">What Our Customers Say</h2>
      <p className="text-gray-600">Real reviews from real customers</p>
    </div>
  );

  const WidgetFooter = () => (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <a
        href={reviewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition mb-3"
      >
        Leave a Review
      </a>
      <p className="text-center text-xs text-gray-500">
        Powered by <span className="font-semibold text-blue-600">JetSuite</span>
      </p>
    </div>
  );

  const ReviewItem: React.FC<{ review: BusinessReview }> = ({ review }) => (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900">{review.author}</p>
          <p className="text-xs text-gray-500">{review.date}</p>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>
      <p className="text-sm text-gray-700">{review.text}</p>
    </div>
  );

  if (layout === 'grid') {
    return (
      <div className="bg-gray-50 p-8 rounded-lg">
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
      <div className="bg-gray-50 p-8 rounded-lg">
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
    <div className="bg-gray-50 p-8 rounded-lg">
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

  const reviewUrl = profileData.googleBusiness.mapsUrl || 
    `https://search.google.com/local/writereview?placeid=${profileData.googleBusiness.placeId}`;

  // Fetch reviews on mount
  useEffect(() => {
    const fetchReviews = async () => {
      if (profileData.googleBusiness.status === 'Verified' && 
          profileData.business.name && 
          profileData.googleBusiness.address) {
        setLoading(true);
        setError('');
        try {
          const fetchedReviews = await fetchBusinessReviews(
            profileData.business.name,
            profileData.googleBusiness.address
          );
          
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
          setError('Could not fetch reviews. Please try again or check your Google Business Profile connection.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchReviews();
  }, [profileData.googleBusiness, profileData.business.name]);

  // Filter reviews based on star rating
  useEffect(() => {
    const filtered = reviews.filter(r => r.rating >= minStars);
    setFilteredReviews(filtered);
  }, [reviews, minStars]);

  // Generate widget embed code
  const generateWidgetCode = () => {
    const widgetData = {
      businessName: profileData.business.name,
      reviews: filteredReviews,
      layout,
      reviewUrl,
      colors: {
        primary: '#3B82F6',
        text: '#1F2937',
        background: '#F9FAFB'
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
      .jetsuite-subtitle { color: #6B7280; }
      .jetsuite-reviews-${layout} { display: ${layout === 'grid' ? 'grid' : layout === 'list' ? 'flex' : 'flex'}; ${layout === 'grid' ? 'grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));' : layout === 'list' ? 'flex-direction: column; max-width: 42rem; margin: 0 auto;' : 'overflow-x: auto;'} gap: 1rem; }
      .jetsuite-review { background: white; padding: 1rem; border-radius: 8px; border: 1px solid #E5E7EB; ${layout === 'carousel' ? 'min-width: 320px;' : ''} }
      .jetsuite-review-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem; }
      .jetsuite-author { font-weight: 600; color: \${widgetData.colors.text}; }
      .jetsuite-date { font-size: 0.75rem; color: #9CA3AF; }
      .jetsuite-stars { display: flex; gap: 2px; }
      .jetsuite-star { width: 1rem; height: 1rem; }
      .jetsuite-text { font-size: 0.875rem; color: #4B5563; line-height: 1.5; }
      .jetsuite-footer { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #E5E7EB; text-align: center; }
      .jetsuite-cta { display: block; width: 100%; background: \${widgetData.colors.primary}; color: white; font-weight: 600; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; margin-bottom: 1rem; transition: background 0.2s; }
      .jetsuite-cta:hover { background: #2563EB; }
      .jetsuite-powered { font-size: 0.75rem; color: #9CA3AF; }
      .jetsuite-brand { font-weight: 600; color: \${widgetData.colors.primary}; }
    \`;
    document.head.appendChild(style);
    
    // Build HTML
    let html = '<div class="jetsuite-widget">';
    html += '<div class="jetsuite-header">';
    html += '<h2 class="jetsuite-title">What Our Customers Say</h2>';
    html += '<p class="jetsuite-subtitle">Real reviews from real customers</p>';
    html += '</div>';
    
    html += \`<div class="jetsuite-reviews-\${widgetData.layout}">\`;
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
    a.download = `${profileData.business.name.replace(/\s+/g, '_')}_reviews_widget.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRefetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedReviews = await fetchBusinessReviews(
        profileData.business.name,
        profileData.googleBusiness.address || ''
      );
      
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
      setLoading(false);
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
                <li>Your reviews are automatically fetched from your Google Business Profile</li>
                <li>Choose a layout style (Grid, Carousel, or List)</li>
                <li>Filter by minimum star rating (3, 4, or 5 stars)</li>
                <li>Preview how the widget will look</li>
                <li>Generate embed code and copy to your website or download for sharing</li>
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
            {loading ? 'Fetching...' : 'Refresh Reviews'}
          </button>
        </div>
      </div>

      {/* Widget Configuration */}
      <div className="bg-brand-card p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-brand-text mb-6">Widget Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Layout Selection */}
          <div>
            <label className="block text-sm font-medium text-brand-text mb-3">Layout Style</label>
            <div className="space-y-2">
              {[
                { value: 'grid' as WidgetLayout, label: 'Grid', description: 'Cards in responsive grid' },
                { value: 'carousel' as WidgetLayout, label: 'Carousel', description: 'Horizontal scrolling' },
                { value: 'list' as WidgetLayout, label: 'List', description: 'Stacked vertical list' }
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
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      layout === option.value ? 'bg-accent-purple border-accent-purple' : 'border-gray-300'
                    }`}>
                      {layout === option.value && <CheckCircleIcon className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <p className="font-semibold text-brand-text">{option.label}</p>
                      <p className="text-xs text-brand-text-muted">{option.description}</p>
                    </div>
                  </div>
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
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        minStars === stars ? 'bg-accent-purple border-accent-purple' : 'border-gray-300'
                      }`}>
                        {minStars === stars && <CheckCircleIcon className="w-4 h-4 text-white" />}
                      </div>
                      <span className="font-semibold text-brand-text">{stars}+ Stars Only</span>
                    </div>
                    <StarRating rating={stars} size="sm" />
                  </div>
                  <p className="text-xs text-brand-text-muted ml-6 mt-1">
                    {reviews.filter(r => r.rating >= stars).length} reviews match
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={generateWidgetCode}
            disabled={loading || filteredReviews.length === 0}
            className="flex-1 bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
          >
            <CodeBracketIcon className="w-5 h-5" />
            Generate Widget Code
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

      {/* Loading State */}
      {loading && (
        <div className="bg-brand-card p-8 rounded-xl shadow-lg text-center">
          <Loader />
          <p className="text-brand-text-muted mt-4">Fetching your reviews...</p>
        </div>
      )}

      {/* Widget Preview */}
      {!loading && filteredReviews.length > 0 && (
        <div className="bg-brand-card p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-brand-text mb-2">Widget Preview</h3>
          <p className="text-sm text-brand-text-muted mb-4">
            Showing {filteredReviews.length} review(s) with {minStars}+ stars in {layout} layout
          </p>
          <div className="border-2 border-dashed border-brand-border rounded-lg p-4">
            <WidgetPreview
              reviews={filteredReviews.slice(0, layout === 'list' ? 5 : 6)}
              layout={layout}
              businessName={profileData.business.name}
              reviewUrl={reviewUrl}
            />
          </div>
        </div>
      )}

      {/* Embed Code */}
      {showCode && widgetCode && (
        <div className="bg-brand-card p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-brand-text">Embed Code</h3>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 bg-accent-purple hover:bg-accent-purple/90 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {copied ? '✓ Copied!' : 'Copy Code'}
            </button>
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
      )}
    </div>
  );
};
