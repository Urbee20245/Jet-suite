import React, { useState, useEffect, useRef } from 'react';
import { getSupabaseClient } from '../integrations/supabase/client';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';

interface ReviewPageData {
  id: string;
  user_id: string;
  business_id: string;
  slug: string;
  business_name: string;
  logo_url: string | null;
  hero_image_url: string | null;
  primary_color: string;
  google_review_url: string;
  is_active: boolean;
  created_at: string;
}

interface ReviewPagePublicProps {
  slug: string;
}

const StarRatingInput: React.FC<{
  rating: number;
  onRatingChange: (rating: number) => void;
  hoverRating: number;
  onHoverChange: (rating: number) => void;
}> = ({ rating, onRatingChange, hoverRating, onHoverChange }) => {
  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => onHoverChange(star)}
          onMouseLeave={() => onHoverChange(0)}
          className="p-1 transition-transform hover:scale-110 focus:outline-none"
        >
          <svg
            className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors ${
              star <= displayRating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

export const ReviewPagePublic: React.FC<ReviewPagePublicProps> = ({ slug }) => {
  const [pageData, setPageData] = useState<ReviewPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [authorName, setAuthorName] = useState('');

  useEffect(() => {
    const fetchPageData = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError('Service unavailable');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('review_pages')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (fetchError || !data) {
          setError('Review page not found');
          setLoading(false);
          return;
        }

        setPageData(data as ReviewPageData);
      } catch (err) {
        console.error('Error fetching review page:', err);
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [slug]);

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitted(true);

    const supabase = getSupabaseClient();
    if (supabase && pageData) {
      try {
        const { error } = await supabase.from('public_reviews').insert({
          review_page_id: pageData.id,
          rating: rating,
          message: reviewMessage,
          author_name: authorName || 'Anonymous',
        });
        if (error) throw error;
      } catch (err) {
        console.error('Failed to submit review:', err);
        // Fail silently on the backend, user experience is more important
      }
    }

    // Redirect to Google review after a brief delay
    if (pageData?.google_review_url) {
      setTimeout(() => {
        window.open(pageData.google_review_url, '_blank');
      }, 1000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
          <p className="text-gray-600">This review page doesn't exist or has been deactivated.</p>
        </div>
      </div>
    );
  }

  const primaryColor = pageData.primary_color || '#F59E0B';

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Hero Image (hidden on mobile) */}
      {pageData.hero_image_url && (
        <div className="hidden lg:block lg:w-1/2 relative">
          <img
            src={pageData.hero_image_url}
            alt={pageData.business_name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      )}

      {/* Right Side - Review Form */}
      <div
        className={`flex-1 flex flex-col items-center justify-center p-8 ${
          pageData.hero_image_url ? 'lg:w-1/2' : 'w-full'
        }`}
      >
        <div className="w-full max-w-md mx-auto text-center">
          {/* Logo */}
          {pageData.logo_url ? (
            <div className="mb-8">
              <img
                src={pageData.logo_url}
                alt={`${pageData.business_name} logo`}
                className="h-20 w-auto mx-auto object-contain"
              />
            </div>
          ) : (
            <div
              className="w-20 h-20 rounded-full mx-auto mb-8 flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <span className="text-white text-2xl font-bold">
                {pageData.business_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Business Name */}
          <h1
            className="text-2xl font-bold mb-8"
            style={{ color: primaryColor }}
          >
            {pageData.business_name.toUpperCase()}
          </h1>

          {submitted ? (
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <svg
                  className="w-8 h-8"
                  style={{ color: primaryColor }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Thank you!
              </h2>
              <p className="text-gray-600">
                Redirecting you to leave your review...
              </p>
            </div>
          ) : (
            <>
              {/* Question */}
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8">
                How was your experience
                <br />
                with {pageData.business_name.toUpperCase()}?
              </h2>

              {/* Star Rating */}
              <div className="mb-8">
                <StarRatingInput
                  rating={rating}
                  onRatingChange={handleRatingClick}
                  hoverRating={hoverRating}
                  onHoverChange={setHoverRating}
                />
              </div>

              {rating > 0 && (
                <div className="space-y-4 animate-in fade-in">
                  <textarea
                    value={reviewMessage}
                    onChange={(e) => setReviewMessage(e.target.value)}
                    placeholder="Share your experience (optional)"
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Your name (optional)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  />
                  <button
                    onClick={handleSubmit}
                    className="w-full text-white font-bold py-3 px-6 rounded-lg transition"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Submit Review
                  </button>
                </div>
              )}
            </>
          )}
          
          {/* Footer */}
          <div className="mt-auto pt-16">
            <a
              href="https://getjetsuite.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-xs text-black hover:text-gray-800 transition-colors"
            >
              Powered by 
              <img src="/Jetsuitewing.png" alt="JetSuite Logo" className="h-4 w-auto" />
              <span className="font-semibold">JetSuite</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPagePublic;