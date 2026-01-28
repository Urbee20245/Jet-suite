import React, { useState, useEffect, useRef } from 'react';
import { getSupabaseClient } from '../integrations/supabase/client';
import QRCode from 'qrcode.react';
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

const QRCodeGenerator: React.FC<{ url: string; businessName: string }> = ({ url, businessName }) => {
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const downloadQrCode = (format: 'png' | 'jpeg') => {
    if (!qrCodeRef.current) return;

    const canvas = qrCodeRef.current.querySelector('canvas');
    if (!canvas) return;

    const filename = `${businessName.replace(/\s/g, '_')}_review_qr.${format}`;

    if (format === 'png') {
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (format === 'jpeg') {
      // Use html2canvas to capture the canvas and convert to JPEG
      html2canvas(canvas, { backgroundColor: '#ffffff' }).then(jpegCanvas => {
        const jpegUrl = jpegCanvas.toDataURL('image/jpeg', 1.0);
        const a = document.createElement('a');
        a.href = jpegUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    }
  };

  return (
    <div className="mt-12 p-6 bg-gray-100 rounded-xl shadow-inner">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Download Your Review QR Code</h3>
      <p className="text-sm text-gray-600 mb-4">Place this QR code on receipts, flyers, or business cards to instantly direct customers to your review page.</p>
      
      <div ref={qrCodeRef} className="flex justify-center mb-6 p-4 bg-white rounded-lg shadow-md">
        <QRCode value={url} size={256} level="H" renderAs="canvas" />
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => downloadQrCode('png')}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download PNG
        </button>
        <button
          onClick={() => downloadQrCode('jpeg')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download JPEG
        </button>
      </div>
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

  const handleRatingClick = async (selectedRating: number) => {
    setRating(selectedRating);

    // Log the click for analytics
    const supabase = getSupabaseClient();
    if (supabase && pageData) {
      try {
        await supabase.from('review_page_clicks').insert({
          review_page_id: pageData.id,
          rating_clicked: selectedRating,
          clicked_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to log click:', err);
      }
    }

    // Redirect to Google review after a brief delay
    if (pageData?.google_review_url) {
      setSubmitted(true);
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
  const reviewPageUrl = `${window.location.origin}/r/${pageData.slug}`;

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
              <div className="mb-12">
                <StarRatingInput
                  rating={rating}
                  onRatingChange={handleRatingClick}
                  hoverRating={hoverRating}
                  onHoverChange={setHoverRating}
                />
              </div>
            </>
          )}
          
          {/* QR Code Generator */}
          <QRCodeGenerator url={reviewPageUrl} businessName={pageData.business_name} />

          {/* Footer */}
          <div className="mt-auto pt-16">
            <p className="text-xs text-gray-400">
              Powered by{' '}
              <a
                href="https://getjetsuite.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline"
                style={{ color: '#6366F1' }}
              >
                repbarn<sup className="text-yellow-500">*****</sup>
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPagePublic;