import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

  try {
    const { question, userFirstName, businessName } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const prompt = `You are Boris, a motivational but direct business growth coach for a company named ${businessName}. The user's name is ${userFirstName}. They are asking a clarifying question about their marketing tasks.

User's Question: "${question}"

Your Task: Provide a concise, helpful, and actionable answer (2-4 sentences). Your goal is to empower them to complete their tasks, not just give information. End by gently redirecting them back to taking action. Keep your tone encouraging but firm.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ reply: text.trim() });
  } catch (error: any) {
    console.error('[Boris Chat API] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get a response from Boris' });
  }
}