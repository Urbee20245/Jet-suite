import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

  try {
    const { reviews, businessName } = req.body;
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({ error: 'No reviews provided' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const replies = [];

    for (const review of reviews) {
      const ratingCategory = review.rating >= 4 ? 'positive' : review.rating === 3 ? 'neutral' : 'negative';
      const prompt = `You are Boris, the motivational growth coach for ${businessName}. Generate a professional, genuine reply to this ${review.platform} review.

REVIEW: ${review.rating}/5 stars by ${review.author}: "${review.text}"

GUIDELINES:
${ratingCategory === 'positive' ? 'Thank them genuinely, mention specific detail if possible, invite them back. 2-3 sentences max.' : 
  ratingCategory === 'neutral' ? 'Thank them, address concerns subtly, show commitment to improvement. 2-3 sentences max.' :
  'Acknowledge concerns sincerely, apologize appropriately, offer to make it right. 3-4 sentences max.'}

TONE: Professional, warm, authentic. NO emojis, overly casual language, or empty promises.
Generate reply text only (no labels):`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      replies.push({ reviewId: review.id, replyText: response.text().trim() });
    }

    return res.status(200).json({ success: true, replies });
  } catch (error: any) {
    console.error('[Boris API] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate replies' });
  }
}