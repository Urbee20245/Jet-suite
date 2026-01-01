import React, { useState, useEffect } from 'react';
import type { Tool, ProfileData, ReadinessState, BusinessReview } from '../types';
import { generateReviewReply, fetchBusinessReviews } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { HowToUse } from '../components/HowToUse';
import { ReadinessBanner } from '../components/ReadinessBanner';
import { StarIcon, InformationCircleIcon, ArrowPathIcon } from '../components/icons/MiniIcons';
import { ALL_TOOLS } from '../constants';

interface JetReplyProps {
  tool: Tool;
  profileData: ProfileData;
  readinessState: ReadinessState;
  setActiveTool: (tool: Tool | null) => void;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map(star => (
      <StarIcon 
        key={star} 
        className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ))}
  </div>
);

const ReviewCard: React.FC<{ 
  review: BusinessReview; 
  onSelect: () => void;
  isSelected: boolean;
}> = ({ review, onSelect, isSelected }) => (
  <button
    onClick={onSelect}
    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
      isSelected 
        ? 'bg-accent-purple/10 border-accent-purple shadow-lg' 
        : 'bg-white border-brand-border hover:border-accent-purple/50 hover:shadow'
    }`}
  >
    <div className="flex items-start justify-between mb-2">
      <div>
        <p className="font-semibold text-brand-text">{review.author}</p>
        <p className="text-xs text-brand-text-muted">{review.date}</p>
      </div>
      <StarRating rating={review.rating} />
    </div>
    <p className="text-sm text-brand-text-muted line-clamp-3">{review.text}</p>
    {isSelected && (
      <div className="mt-2 text-xs text-accent-purple font-semibold">
        ✓ Selected - Reply will follow your settings below
      </div>
    )}
  </button>
);

export const JetReply: React.FC<JetReplyProps> = ({ tool, profileData, readinessState, setActiveTool }) => {
  const [reviews, setReviews] = useState<BusinessReview[]>([]);
  const [selectedReview, setSelectedReview] = useState<BusinessReview | null>(null);
  const [manualReview, setManualReview] = useState('');
  const [isPositive, setIsPositive] = useState(true);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingReviews, setFetchingReviews] = useState(false);
  const [postingReply, setPostingReply] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showHowTo, setShowHowTo] = useState(true);
  const [showBanner, setShowBanner] = useState(true);
  const [showManualInput, setShowManualInput] = useState(false);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyMinStars, setAutoReplyMinStars] = useState<number>(4);
  const [hasGoogleConnection, setHasGoogleConnection] = useState(false);

  const isReady = readinessState === 'Foundation Ready';

  // Fetch reviews on component mount if GBP is connected
  useEffect(() => {
    const fetchReviewsFromBackend = async () => {
      if (
        profileData.googleBusiness.status === 'Verified' && 
        profileData.user.id
      ) {
        setFetchingReviews(true);
        setError('');
        try {
          // First try real Google Business API (if connected via OAuth)
          const googleRes = await fetch(`/api/google-business/get-reviews?userId=${profileData.user.id}`);
          
          if (googleRes.ok) {
            const data = await googleRes.json();
            const googleReviews: BusinessReview[] = (data.reviews || []).map((r: any) => ({
              id: r.id,
              author: r.author,
              rating: r.rating,
              text: r.text,
              date: r.date,
              isPositive: r.isPositive,
              source: r.source,
              googleReviewName: r.googleReviewName,
              googleLocationName: r.googleLocationName,
            }));
            setReviews(googleReviews);
            setHasGoogleConnection(true);
            return;
          }

          // If no Google connection, fall back to AI-based fetch
          setHasGoogleConnection(false);
          const fetchedReviews = await fetchBusinessReviews(
            profileData.business.name,
            profileData.googleBusiness.address || ''
          );
          
          const formattedReviews: BusinessReview[] = fetchedReviews.map((r: any, i: number) => ({
            id: `review_${Date.now()}_${i}`,
            author: r.author,
            rating: r.rating,
            text: r.text,
            date: r.date,
            isPositive: r.rating >= 4,
            source: 'ai',
          }));
          
          setReviews(formattedReviews);
        } catch (err) {
          console.error('Failed to fetch reviews:', err);
          setError('Could not fetch reviews. You can still paste reviews manually below.');
        } finally {
          setFetchingReviews(false);
        }
      }
    };
    
    fetchReviewsFromBackend();
  }, [profileData.googleBusiness, profileData.business.name, profileData.user.id]);

  const handlePostReplyToGoogle = async (review: BusinessReview, replyText: string) => {
    if (!hasGoogleConnection || !review.googleReviewName) {
      // No real Google connection; nothing to post
      return;
    }

    try {
      setPostingReply(true);
      setError('');
      const res = await fetch('/api/google-business/post-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profileData.user.id,
          reviewName: review.googleReviewName,
          replyText,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to post reply to Google');
      }
    } catch (err: any) {
      console.error('Post reply error:', err);
      setError(err.message || 'Failed to post reply to Google. You can still copy and paste it manually.');
    } finally {
      setPostingReply(false);
    }
  };

  const handleSelectReview = (review: BusinessReview) => {
    setSelectedReview(review);
    setManualReview(review.text);
    setIsPositive(review.isPositive);
    setReply('');
    setCopied(false);

    // If auto-reply is enabled and rating meets threshold, auto-draft and auto-post (when possible)
    if (autoReplyEnabled && review.rating >= autoReplyMinStars) {
      handleGenerateAutoReply(review);
    }
  };

  const handleGenerateAutoReply = async (review: BusinessReview) => {
    setError('');
    setLoading(true);
    setReply('');
    setCopied(false);

    try {
      const result = await generateReviewReply(
        review.text,
        review.isPositive,
        profileData.business.dna.style
      );
      setReply(result);

      // If we have a live Google connection and a real review ID, post automatically
      if (hasGoogleConnection && review.googleReviewName) {
        await handlePostReplyToGoogle(review, result);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to auto-generate reply. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const reviewText = selectedReview ? selectedReview.text : manualReview;
    
    if (!reviewText) {
      setError('Please select a review or paste one manually.');
      return;
    }
    
    setError('');
    setLoading(true);
    setReply('');
    setCopied(false);
    
    try {
      const result = await generateReviewReply(reviewText, isPositive, profileData.business.dna.style);
      setReply(result);
    } catch (err) {
      setError('Failed to generate reply. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    if (!reply) return;
    navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefetchReviews = async () => {
    // Re-run same logic as initial fetch
    if (!profileData.user.id) return;
    setFetchingReviews(true);
    setError('');
    try {
      const googleRes = await fetch(`/api/google-business/get-reviews?userId=${profileData.user.id}`);
      if (googleRes.ok) {
        const data = await googleRes.json();
        const googleReviews: BusinessReview[] = (data.reviews || []).map((r: any) => ({
          id: r.id,
          author: r.author,
          rating: r.rating,
          text: r.text,
          date: r.date,
          isPositive: r.isPositive,
          source: r.source,
          googleReviewName: r.googleReviewName,
          googleLocationName: r.googleLocationName,
        }));
        setReviews(googleReviews);
        setHasGoogleConnection(true);
      } else {
        setHasGoogleConnection(false);
        const fetchedReviews = await fetchBusinessReviews(
          profileData.business.name,
          profileData.googleBusiness.address || ''
        );
        const formattedReviews: BusinessReview[] = fetchedReviews.map((r: any, i: number) => ({
          id: `review_${Date.now()}_${i}`,
          author: r.author,
          rating: r.rating,
          text: r.text,
          date: r.date,
          isPositive: r.rating >= 4,
          source: 'ai',
        }));
        setReviews(formattedReviews);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError('Could not fetch reviews. You can still paste reviews manually below.');
    } finally {
      setFetchingReviews(false);
    }
  };

  // Check if GBP is not connected at all
  if (profileData.googleBusiness.status === 'Not Created' || profileData.googleBusiness.status === 'Not Verified') {
    return (
      <div>
        {showHowTo && (
          <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Connect your Google Business Profile to automatically fetch reviews</li>
                  <li>Select a review from the list or paste one manually</li>
                  <li>AI will generate a professional, on-brand response</li>
              </ul>
          </HowToUse>
        )}
        
        <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg text-center">
          <InformationCircleIcon className="w-12 h-12 mx-auto text-accent-blue mb-4" />
          <h2 className="text-2xl font-bold text-brand-text mb-2">Google Business Profile Required</h2>
          <p className="text-brand-text-muted mb-6 max-w-md mx-auto">
            JetReply needs your connected Google Business Profile to fetch reviews automatically. 
            Once connected, we'll pull your latest reviews for you to respond to.
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
    <div>
      {showHowTo && (
        <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
            <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Your recent Google Business Profile reviews are automatically fetched</li>
                <li>If you connect with Google OAuth, JetReply can also auto-post replies for high-star reviews</li>
                <li>Select a review from the list to reply to, or paste one manually</li>
                <li>Turn on auto-reply so 4–5 star reviews get a drafted reply and are posted automatically</li>
                <li>For lower-star reviews, JetReply will draft a reply but wait for you to review and post</li>
            </ul>
        </HowToUse>
      )}

      {showBanner && !isReady && (
        <ReadinessBanner 
            readinessState={readinessState}
            onContinue={() => setShowBanner(false)}
            setActiveTool={setActiveTool}
        />
      )}

      {/* Connected Business Info */}
      <div className="mb-6 bg-brand-card p-4 rounded-xl shadow-sm border border-brand-border">
        <p className="text-brand-text-muted mb-2">{tool.description}</p>
        <p className="text-sm text-brand-text-muted mb-3">
          Replaces: <span className="text-accent-purple font-semibold">Reputation Management ($200-800/mo)</span>
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-accent-purple/5 p-3 rounded-lg border border-accent-purple/20">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-brand-text">
              Connected: <span className="font-semibold">{profileData.googleBusiness.profileName}</span>
            </span>
            {profileData.googleBusiness.rating && (
              <span className="text-sm text-brand-text-muted">
                • {profileData.googleBusiness.rating} ⭐ ({profileData.googleBusiness.reviewCount} reviews)
              </span>
            )}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-brand-border text-brand-text">
              OAuth: {hasGoogleConnection ? 'Google Connected (auto-post on)' : 'App Not Authorized (draft only)'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!hasGoogleConnection && (
              <button
                type="button"
                onClick={() => {
                  // Start Google OAuth flow
                  window.location.href = `/api/auth/google-business/authorize?userId=${profileData.user.id}`;
                }}
                className="text-xs font-semibold bg-white border border-accent-purple text-accent-purple px-3 py-1.5 rounded-full hover:bg-accent-purple/5"
              >
                Connect for Auto-Posting
              </button>
            )}
            <button
              onClick={handleRefetchReviews}
              disabled={fetchingReviews}
              className="flex items-center gap-2 text-sm text-accent-purple hover:text-accent-pink font-semibold transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${fetchingReviews ? 'animate-spin' : ''}`} />
              {fetchingReviews ? 'Fetching...' : 'Refresh Reviews'}
            </button>
          </div>
        </div>
      </div>

      {/* Auto-reply configuration */}
      <div className="mb-6 bg-brand-card p-4 rounded-xl shadow-sm border border-brand-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-brand-text">Auto-Reply & Auto-Post Settings</h3>
            <p className="text-xs text-brand-text-muted">
              When enabled, clicking reviews at or above your star threshold will draft a reply automatically. 
              If Google OAuth is connected, JetReply will also post those replies to Google on your behalf. 
              Lower-rated reviews will wait for you to read before posting.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setAutoReplyEnabled(prev => !prev)}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition ${
                autoReplyEnabled
                  ? 'bg-accent-purple text-white border-accent-purple'
                  : 'bg-brand-light text-brand-text border-brand-border'
              }`}
            >
              Auto-reply: {autoReplyEnabled ? 'On' : 'Off'}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-brand-text-muted">Auto-reply min stars:</span>
              {[3, 4, 5].map(stars => (
                <button
                  key={stars}
                  type="button"
                  onClick={() => setAutoReplyMinStars(stars)}
                  className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center border transition ${
                    autoReplyMinStars === stars
                      ? 'bg-accent-purple text-white border-accent-purple'
                      : 'bg-brand-light text-brand-text border-brand-border'
                  } ${!autoReplyEnabled ? 'opacity-50' : ''}`}
                  disabled={!autoReplyEnabled}
                >
                  {stars}★
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {fetchingReviews ? (
        <div className="mb-6 bg-brand-card p-8 rounded-xl shadow-lg text-center">
          <Loader />
          <p className="text-brand-text-muted mt-4">Fetching your recent reviews...</p>
        </div>
      ) : reviews.length > 0 ? (
        <div className="mb-6 bg-brand-card p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-brand-text">Recent Reviews</h3>
            <p className="text-sm text-brand-text-muted">{reviews.length} reviews found</p>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {reviews.map(review => (
              <ReviewCard
                key={review.id}
                review={review}
                onSelect={() => handleSelectReview(review)}
                isSelected={selectedReview?.id === review.id}
              />
            ))}
          </div>
          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="mt-4 text-sm text-accent-purple hover:text-accent-pink font-semibold transition-colors"
          >
            {showManualInput ? 'Hide manual input' : 'Or paste a review manually →'}
          </button>
        </div>
      ) : (
        <div className="mb-6 bg-brand-card p-6 rounded-xl shadow-lg text-center">
          <InformationCircleIcon className="w-12 h-12 mx-auto text-brand-text-muted mb-3" />
          <p className="text-brand-text-muted mb-4">
            No recent reviews found. Reviews may take time to sync, or you can paste a review manually below.
          </p>
          <button
            onClick={() => setShowManualInput(true)}
            className="text-accent-purple hover:text-accent-pink font-semibold transition-colors"
          >
            Paste review manually →
          </button>
        </div>
      )}

      {/* Manual Input */}
      {(showManualInput || reviews.length === 0) && (
        <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
          <h3 className="text-lg font-bold text-brand-text mb-4">
            {reviews.length > 0 ? 'Or Paste a Review Manually' : 'Paste a Review'}
          </h3>
          <form onSubmit={handleGenerateReply}>
            <div className="mb-6">
              <label htmlFor="review" className="block text-sm font-medium text-brand-text mb-2">Customer Review</label>
              <textarea
                id="review"
                rows={5}
                value={manualReview}
                onChange={(e) => {
                  setManualReview(e.target.value);
                  setSelectedReview(null);
                }}
                placeholder="Paste customer review here..."
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
              />
            </div>
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-sm font-medium text-brand-text">Review Type:</span>
              <button 
                type="button" 
                onClick={() => setIsPositive(true)} 
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${isPositive ? 'bg-green-500 text-white shadow' : 'bg-brand-light text-brand-text-muted hover:bg-gray-200'}`}
              >
                Positive
              </button>
              <button 
                type="button" 
                onClick={() => setIsPositive(false)} 
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${!isPositive ? 'bg-red-500 text-white shadow' : 'bg-brand-light text-brand-text-muted hover:bg-gray-200'}`}
              >
                Negative
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button 
              type="submit" 
              disabled={loading || (!selectedReview && !manualReview)} 
              className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? 'Drafting Reply...' : 'Draft Reply'}
            </button>
          </form>
        </div>
      )}

      {/* Generate Reply Button (for selected review) */}
      {selectedReview && !showManualInput && (
        <div className="mb-6">
          <button
            onClick={handleGenerateReply}
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? 'Drafting Reply...' : 'Draft Reply for Selected Review'}
          </button>
        </div>
      )}

      {/* Loading + Suggested Reply */}
      {loading && (
        <div className="mt-6 bg-brand-card p-8 rounded-xl shadow-lg text-center">
          <Loader />
          <p className="text-brand-text-muted mt-4">Crafting your professional reply...</p>
        </div>
      )}
      
      {reply && (
        <div className="mt-6 bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-2 text-brand-text">Suggested Reply</h3>
          {selectedReview && (
            <div className="mb-4 p-3 bg-brand-light rounded-lg border border-brand-border">
              <p className="text-xs text-brand-text-muted mb-1">Replying to:</p>
              <p className="text-sm font-semibold text-brand-text">{selectedReview.author}</p>
              <StarRating rating={selectedReview.rating} />
            </div>
          )}
          <p className="text-brand-text whitespace-pre-wrap bg-brand-light p-4 rounded-lg border border-brand-border mb-4">{reply}</p>
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={handleCopyToClipboard} 
              className="flex-1 bg-accent-purple hover:bg-accent-purple/90 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              {copied ? '✓ Copied!' : 'Copy to Clipboard'}
            </button>
            {hasGoogleConnection && selectedReview?.googleReviewName && (
              <button
                onClick={() => handlePostReplyToGoogle(selectedReview, reply)}
                disabled={postingReply}
                className="flex-1 bg-accent-blue hover:bg-accent-blue/90 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50"
              >
                {postingReply ? 'Posting to Google...' : 'Post to Google Now'}
              </button>
            )}
            <button
              onClick={() => {
                setReply('');
                setSelectedReview(null);
                setManualReview('');
                setError('');
              }}
              className="px-4 py-2 bg-brand-light hover:bg-gray-200 text-brand-text font-semibold rounded-lg transition"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};