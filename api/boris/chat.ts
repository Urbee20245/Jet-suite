import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const geminiApiKey = process.env.GEMINI_API_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);

// Rate limit: 5 questions per day per user
const DAILY_QUESTION_LIMIT = 5;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userMessage, context, conversationHistory, userId, type = 'chat' } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Check if Gemini API key is configured
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not configured');
      return res.status(500).json({ 
        error: 'AI service not configured. Please contact support.' 
      });
    }

    // Check rate limit (only for chat, not daily greeting)
    if (type === 'chat') {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Get today's question count
      const { data: usageData, error: usageError } = await supabase
        .from('boris_usage')
        .select('question_count')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (usageError && usageError.code !== 'PGRST116') {
        console.error('Error checking usage:', usageError);
        // Continue anyway - don't block user
      }

      const currentCount = usageData?.question_count || 0;

      if (currentCount >= DAILY_QUESTION_LIMIT) {
        return res.status(429).json({ 
          error: `Daily limit reached. You can ask ${DAILY_QUESTION_LIMIT} questions per day. Try again tomorrow!`,
          remainingQuestions: 0
        });
      }

      // Update usage count
      if (usageData) {
        // Update existing record
        await supabase
          .from('boris_usage')
          .update({ 
            question_count: currentCount + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('date', today);
      } else {
        // Insert new record
        await supabase
          .from('boris_usage')
          .insert([{
            user_id: userId,
            date: today,
            question_count: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
      }
    }

    // Generate AI response
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    let prompt = '';
    
    if (type === 'greeting') {
      // Daily greeting
      prompt = `
You are Boris, the AI Growth Coach. Generate a personalized daily greeting and task recommendation.

**User Context:**
- Name: ${context.userName}
- Business: ${context.businessName}
- Growth Score: ${context.growthScore}/100
- Pending Tasks: ${context.pendingTasks}
- Completed: ${context.completedAudits?.join(', ') || 'Just getting started'}
- New Reviews: ${context.newReviews || 0}

**Instructions:**
1. Start with a friendly, personalized greeting
2. Acknowledge their recent progress (if any)
3. Suggest 1-2 specific tasks for today
4. Keep it motivating and actionable
5. Total response: 3-4 sentences max

**Example Format:**
"Great work completing your JetBiz audit, [Name]! You're building real momentum. Today, let's focus on [specific task]. This will [specific benefit]. Ready to dive in?"

Generate the greeting now:`;
    } else {
      // Chat response
      const systemContext = `
You are Boris, the AI Growth Coach for JetSuite - a digital marketing platform for local businesses.

**Your Personality:**
- Friendly, motivating, and action-oriented
- Use the user's first name (${context.userName})
- Keep responses concise (2-3 sentences max)
- Focus on actionable advice
- Celebrate wins, encourage on challenges
- Never apologize unnecessarily

**User Context:**
- Business: ${context.businessName}
- Growth Score: ${context.growthScore}/100
- Pending Tasks: ${context.pendingTasks}
- Completed Audits: ${context.completedAudits?.join(', ') || 'None yet'}
- New Reviews: ${context.newReviews || 0}

**Your Role:**
1. Answer questions about JetSuite tools and features
2. Guide users on what to do next
3. Explain marketing concepts simply
4. Help prioritize tasks
5. Motivate and celebrate progress

**Available JetSuite Tools:**
- JetBiz: Google Business Profile audit
- JetViz: Website analysis
- JetKeywords: Keyword research
- JetCompete: Competitor analysis
- JetCreate: Campaign creation
- JetSocial: Social media scheduling
- JetContent: Content generation
- JetReply: Review management

**Response Guidelines:**
- Keep it SHORT (2-3 sentences)
- Be specific and actionable
- Reference their specific context
- If they ask "what should I do today?", suggest 1-2 urgent tasks
- If they ask about a tool, explain it simply
- Always end with encouragement or next step
`;

      const chatHistory = (conversationHistory || [])
        .slice(-6)
        .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Boris'}: ${msg.content}`)
        .join('\n');

      prompt = `${systemContext}

${chatHistory ? `**Previous Conversation:**\n${chatHistory}\n` : ''}

**User Question:** ${userMessage}

**Boris Response:**`;
    }

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    // Get remaining questions for today
    const today = new Date().toISOString().split('T')[0];
    const { data: finalUsage } = await supabase
      .from('boris_usage')
      .select('question_count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    const questionsUsed = finalUsage?.question_count || 0;
    const remainingQuestions = Math.max(0, DAILY_QUESTION_LIMIT - questionsUsed);

    return res.status(200).json({ 
      success: true, 
      response: text,
      remainingQuestions,
      dailyLimit: DAILY_QUESTION_LIMIT
    });

  } catch (error: any) {
    console.error('Error in Boris chat API:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to generate response',
      fallback: "I'm having trouble connecting right now. Try asking me again in a moment!"
    });
  }
}