import { GetServerSideProps } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import Head from 'next/head';
import { StarIcon } from '../../components/icons/SolidIcons';
import { useState } from 'react';

type ReviewPageProps = {
  businessName: string;
  logoUrl?: string;
  googleReviewUrl: string;
  slug: string;
  error?: string;
};

const PublicReviewPage = ({ businessName, logoUrl, googleReviewUrl, slug, error }: ReviewPageProps) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <Head>
          <title>Error</title>
        </Head>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">An Error Occurred</h1>
          <p className="text-slate-400 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const handleStarClick = (index: number) => {
    setRating(index);
    // If rating is 4 or 5 stars, redirect to Google
    if (index >= 4) {
      window.location.href = googleReviewUrl;
    }
    // If rating is 1-3 stars, we could show a feedback form in the future
    // For now, it just sets the state.
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <Head>
        <title>Leave a Review for {businessName}</title>
        <meta name="description" content={`Share your experience with ${businessName}.`} />
      </Head>

      <div className="w-full max-w-md mx-auto bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 text-center">
        {logoUrl && (
          <img src={logoUrl} alt={`${businessName} Logo`} className="mx-auto h-20 w-auto mb-6 rounded-md" />
        )}
        <h1 className="text-2xl font-bold text-white mb-2">How was your experience with {businessName}?</h1>
        <p className="text-slate-400 mb-8">Your feedback helps us improve.</p>

        <div className="flex justify-center items-center mb-8">
          {[...Array(5)].map((_, index) => {
            const starIndex = index + 1;
            return (
              <button
                key={starIndex}
                type="button"
                onClick={() => handleStarClick(starIndex)}
                onMouseEnter={() => setHover(starIndex)}
                onMouseLeave={() => setHover(rating)}
                className="cursor-pointer transition-transform duration-200 ease-in-out transform hover:scale-125"
              >
                <StarIcon
                  className={`w-12 h-12 ${
                    starIndex <= (hover || rating) ? 'text-yellow-400' : 'text-slate-600'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {rating > 0 && rating < 4 && (
          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
            <h3 className="font-semibold text-white">Thank you for your feedback.</h3>
            <p className="text-sm text-slate-300 mt-1">We're sorry to hear you had a less than positive experience. We are always looking for ways to improve.</p>
          </div>
        )}
        
        {rating >= 4 && (
           <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
            <h3 className="font-semibold text-white">Thank you!</h3>
            <p className="text-sm text-slate-300 mt-1">We're redirecting you to Google to share your review...</p>
          </div>
        )}

      </div>
      <footer className="text-center mt-8">
        <p className="text-sm text-slate-500">Powered by JetSuite</p>
      </footer>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };
  const supabase = createServerSupabaseClient(context);

  try {
    const { data: business, error } = await supabase
      .from('businesses')
      .select('business_name, logo_url, google_review_url, review_page_enabled')
      .eq('review_page_slug', slug)
      .single();

    if (error || !business) {
      return {
        props: {
          error: 'This review page could not be found.',
        },
      };
    }

    if (!business.review_page_enabled) {
        return {
            props: {
              error: 'This review page is not currently active.',
            },
          };
    }

    if (!business.google_review_url) {
        return {
            props: {
              error: 'The business has not configured their Google Review link yet.',
              businessName: business.business_name,
            },
          };
    }

    return {
      props: {
        businessName: business.business_name,
        logoUrl: business.logo_url,
        googleReviewUrl: business.google_review_url,
        slug,
      },
    };
  } catch (e: any) {
    console.error('Error on public review page:', e);
    return {
      props: {
        error: 'A server error occurred.',
      },
    };
  }
};

export default PublicReviewPage;