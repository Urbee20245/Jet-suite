import { GoogleGenerativeAI } from '@google/genai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface BorisMessage {
  id: string;
  role: 'user' | 'boris';
  content: string;
  timestamp: string;
}

export interface BorisContext {
  userName: string;
  businessName: string;
  growthScore: number;
  pendingTasks: number;
  completedAudits: string[];
  urgentTasks: any[];
  newReviews: number;
}

/**
 * Generate Boris AI response using Gemini
 */
export async function generateBorisResponse(
  userMessage: string,
  context: BorisContext,
  conversationHistory: BorisMessage[] = []
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return "AI features are currently disabled due to a missing API key. Please contact human support.";
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Build system context for Boris
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
- Completed Audits: ${context.completedAudits.join(', ') || 'None yet'}
- New Reviews: ${context.newReviews}

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

    // Build conversation history
    const chatHistory = conversationHistory
      .slice(-6) // Last 6 messages for context
      .map(msg => `${msg.role === 'user' ? 'User' : 'Boris'}: ${msg.content}`)
      .join('\n');

    const prompt = `${systemContext}

${chatHistory ? `**Previous Conversation:**\n${chatHistory}\n` : ''}

**User Question:** ${userMessage}

**Boris Response:**`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text.trim();
  } catch (error) {
    console.error('[Boris AI] Error generating response:', error);
    return "I'm having trouble connecting right now. Try asking me again in a moment!";
  }
}

/**
 * Generate daily task recommendation
 */
export async function generateDailyRecommendation(context: BorisContext): Promise<string> {
  if (!GEMINI_API_KEY) {
    return `Welcome, ${context.userName}! Your AI coach is offline, but you have ${context.pendingTasks} tasks waiting. Let's get to work!`;
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
You are Boris, the AI Growth Coach. Generate a personalized daily greeting and task recommendation.

**User Context:**
- Name: ${context.userName}
- Business: ${context.businessName}
- Growth Score: ${context.growthScore}/100
- Pending Tasks: ${context.pendingTasks}
- Completed: ${context.completedAudits.join(', ') || 'Just getting started'}
- New Reviews: ${context.newReviews}

**Instructions:**
1. Start with a friendly, personalized greeting
2. Acknowledge their recent progress (if any)
3. Suggest 1-2 specific tasks for today (e.g., "Run your JetBiz audit" or "Complete your highest priority task")
4. Keep it motivating and actionable
5. Total response: 3-4 sentences max

**Example Format:**
"Great work completing your JetBiz audit, [Name]! You're building real momentum. Today, let's focus on [specific task]. This will [specific benefit]. Ready to dive in?"

Generate the greeting now:`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('[Boris AI] Error generating daily recommendation:', error);
    return `Good to see you, ${context.userName}! You have ${context.pendingTasks} tasks in your Growth Plan. Let's knock them out today!`;
  }
}

/**
 * Generate quick action suggestions
 */
export function getQuickActions(context: BorisContext): string[] {
  const actions: string[] = [];

  if (context.completedAudits.length === 0) {
    actions.push('Run my first audit');
    actions.push('Set up my business profile');
  }

  if (context.newReviews > 0) {
    actions.push(`Reply to ${context.newReviews} new reviews`);
  }

  if (context.pendingTasks > 0) {
    actions.push('Show me my tasks');
    actions.push('What should I do today?');
  }

  if (context.growthScore < 50) {
    actions.push('How can I improve my score?');
  }

  actions.push('Explain JetBiz audit');
  actions.push('Help me get more customers');

  return actions.slice(0, 6); // Max 6 quick actions
}