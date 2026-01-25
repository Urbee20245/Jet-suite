// services/borisAIService.ts
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
 * Generate Boris AI response using API endpoint
 */
export async function generateBorisResponse(
  userMessage: string,
  context: BorisContext,
  conversationHistory: BorisMessage[] = [],
  userId: string
): Promise<{ response: string; remainingQuestions: number; dailyLimit: number }> {
  try {
    const response = await fetch('/api/boris/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage,
        context,
        conversationHistory,
        userId,
        type: 'chat'
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Return error message with fallback
      return {
        response: data.error || data.fallback || "I'm having trouble connecting right now. Try asking me again in a moment!",
        remainingQuestions: data.remainingQuestions || 0,
        dailyLimit: data.dailyLimit || 5
      };
    }

    return {
      response: data.response,
      remainingQuestions: data.remainingQuestions,
      dailyLimit: data.dailyLimit
    };
  } catch (error) {
    console.error('[Boris AI] Error generating response:', error);
    return {
      response: "I'm having trouble connecting right now. Try asking me again in a moment!",
      remainingQuestions: 0,
      dailyLimit: 5
    };
  }
}

/**
 * Generate daily task recommendation
 */
export async function generateDailyRecommendation(
  context: BorisContext,
  userId: string
): Promise<string> {
  try {
    const response = await fetch('/api/boris/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context,
        userId,
        type: 'greeting'
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate greeting');
    }

    return data.response;
  } catch (error) {
    console.error('[Boris AI] Error generating daily recommendation:', error);
    return `Good to see you, ${context.userName}! You have ${context.pendingTasks} tasks in your Growth Plan. Let's knock them out today!`;
  }
}

/**
 * Get quick action suggestions
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