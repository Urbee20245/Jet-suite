import { getSupabaseClient } from '../integrations/supabase/client';

interface Review {
  id: string;
  platform: 'google' | 'facebook' | 'yelp';
  author: string;
  rating: number;
  text: string;
  date: string;
  replied: boolean;
  businessId: string;
}

export async function checkForNewReviews(userId: string, businessId: string): Promise<{
  hasNewReviews: boolean;
  count: number;
  reviews: Review[];
}> {
  const supabase = getSupabaseClient();
  if (!supabase) return { hasNewReviews: false, count: 0, reviews: [] };

  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('business_id', businessId)
      .eq('replied', false)
      .order('date', { ascending: false });

    if (error) throw error;
    const reviewList = reviews || [];
    return { hasNewReviews: reviewList.length > 0, count: reviewList.length, reviews: reviewList as Review[] };
  } catch (error) {
    console.error('[Boris] Error checking reviews:', error);
    return { hasNewReviews: false, count: 0, reviews: [] };
  }
}

export async function generateBorisReplies(reviews: Review[], businessName: string) {
  try {
    const response = await fetch('/api/boris/generate-replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviews: reviews.map(r => ({ id: r.id, platform: r.platform, author: r.author, rating: r.rating, text: r.text })),
        businessName
      })
    });
    if (!response.ok) throw new Error('Failed to generate replies');
    return await response.json();
  } catch (error: any) {
    console.error('[Boris] Error generating replies:', error);
    return { success: false, replies: [], error: error.message };
  }
}

export async function postBorisReplies(replies: Array<{ reviewId: string; replyText: string }>, businessId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, posted: 0, failed: replies.length };

  let posted = 0, failed = 0;
  for (const reply of replies) {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ reply_text: reply.replyText, replied: true, reply_date: new Date().toISOString() })
        .eq('id', reply.reviewId)
        .eq('business_id', businessId);
      if (error) throw error;
      posted++;
    } catch (error) {
      console.error(`[Boris] Failed to post reply for review ${reply.reviewId}:`, error);
      failed++;
    }
  }
  return { success: failed === 0, posted, failed };
}

export function getBorisReplyConfirmation(reviewCount: number, businessName: string): string {
  if (reviewCount === 1) {
    return `✅ Done! I've replied to your review.\n\nResponding quickly builds trust with customers and shows you care. This is exactly the kind of engagement that grows ${businessName}.\n\nKeep it up! 💪`;
  }
  return `✅ Boom! I've replied to all ${reviewCount} reviews.\n\nYou just showed ${reviewCount} customers that ${businessName} values their feedback. That's how you build loyalty and reputation.\n\nThis is the kind of daily action that separates growing businesses from stagnant ones. Proud of you! 🎉`;
}

export async function askBoris(question: string, userFirstName: string, businessName: string): Promise<string> {
  try {
    const response = await fetch('/api/boris/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, userFirstName, businessName })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Boris is unavailable right now.');
    }
    const data = await response.json();
    return data.reply;
  } catch (error: any) {
    console.error('[Boris] Error asking question:', error);
    throw error;
  }
}