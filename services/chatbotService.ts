// =====================================================
// JETSUITE AI CHATBOT SERVICE
// Powered by Google Gemini API
// =====================================================

import { GoogleGenAI, Type } from "@google/genai";
import type {
  ChatMessage,
  ChatbotResponse,
  ChatbotContext,
  SuggestedAction,
  KnowledgeBaseArticle,
  CreateTicketRequest,
} from '../Types/supportTypes';
import { supportService } from './supportService';
import { getAIDateTimeContext } from '../utils/dateTimeUtils';
// @ts-ignore
import jetbotKnowledgeBase from '../jetbot-knowledge/JETBOT_KNOWLEDGE_BASE.md?raw';

// Use the environment variable as configured in vite.config.ts
const getApiKey = () => process.env.GEMINI_API_KEY;

/**
 * Helper function to get the AI client instance.
 * Throws an error if the API key is missing, ensuring all AI functions are guarded.
 */
const getAiClient = (): GoogleGenAI => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing. Chatbot will not function.");
    throw new Error("AI_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

// =====================================================
// CHATBOT SERVICE
// =====================================================

export const chatbotService = {
  /**
   * Process a user message and generate AI response
   */
  async chat(
    userMessage: string,
    conversationHistory: ChatMessage[],
    context?: ChatbotContext
  ): Promise<ChatbotResponse> {
    // 1. Artificial "Thinking" Delay (2-4 seconds)
    const delay = Math.floor(Math.random() * 2000) + 2000;
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      // 2. Search knowledge base for relevant articles (Dynamic RAG)
      const kbArticles = await this.searchRelevantArticles(userMessage);
      
      // 3. Build context for Gemini
      const contextInfo = this.buildContextPrompt(context, kbArticles);
      
      // 4. Build conversation messages
      const systemPrompt = this.buildSystemPrompt(contextInfo);
      
      // 5. Call Gemini API
      const responseText = await this.callGeminiAPI(userMessage, conversationHistory, systemPrompt);
      
      // 6. Parse and validate response
      const chatbotResponse = this.parseGeminiResponse(responseText, kbArticles);
      
      return chatbotResponse;
    } catch (error) {
      if (error instanceof Error && error.message === "AI_KEY_MISSING") {
        return {
          message: "I'm sorry, my AI brain is currently offline due to a missing API key. Please contact human support directly.",
          confidence: 0.1,
          should_escalate: true,
          escalation_reason: 'AI service unavailable',
          suggested_actions: [
            {
              type: 'create_ticket',
              label: 'Create Support Ticket',
              data: { category: 'technical' }
            }
          ]
        };
      }
      
      console.error('Error in chatbot.chat:', error);
      
      // Return fallback response
      return {
        message: "I apologize, but I'm having trouble processing your request right now. Would you like me to create a support ticket so our team can help you?",
        confidence: 0.1,
        should_escalate: true,
        escalation_reason: 'AI service error',
        suggested_actions: [
          {
            type: 'create_ticket',
            label: 'Create Support Ticket',
            data: { category: 'technical' }
          }
        ]
      };
    }
  },

  /**
   * Search knowledge base for relevant articles
   */
  async searchRelevantArticles(query: string): Promise<KnowledgeBaseArticle[]> {
    try {
      const result = await supportService.searchKnowledgeBase({
        query,
        limit: 3
      });
      
      return result.data || [];
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return [];
    }
  },

  /**
   * Build context prompt from user data and KB articles
   */
  buildContextPrompt(
    context?: ChatbotContext,
    articles: KnowledgeBaseArticle[] = []
  ): string {
    let prompt = '\n\n**Current Context:**\n';
    
    if (context) {
      if (context.user_email) {
        prompt += `- User: ${context.user_email}\n`;
      }
      if (context.business_name) {
        prompt += `- Business: ${context.business_name}\n`;
      }
      if (context.subscription_status) {
        prompt += `- Subscription: ${context.subscription_status}\n`;
      }
      if (context.current_page) {
        prompt += `- Current Page: ${context.current_page}\n`;
      }
    }
    
    if (articles.length > 0) {
      prompt += '\n**Relevant Database Articles:**\n';
      articles.forEach((article, index) => {
        prompt += `${index + 1}. "${article.title}"\n`;
        prompt += `   ${article.content.substring(0, 300)}...\n\n`;
      });
    }
    
    return prompt;
  },

  /**
   * Build the full system prompt including the static Knowledge Base
   */
  buildSystemPrompt(contextInfo: string): string {
    return `${getAIDateTimeContext()}

${jetbotKnowledgeBase}

${contextInfo}

**Response Format:**
Your response MUST be a valid JSON object matching this schema:
{
  "message": "Your helpful response to the user (markdown supported)",
  "confidence": number (0-1),
  "suggested_actions": [
    {"type": "view_article" | "create_ticket" | "contact_support", "label": "Button Label", "data": { ... }}
  ],
  "should_escalate": boolean,
  "escalation_reason": string | null
}
`;
  },

  /**
   * Call Gemini API using GoogleGenAI SDK
   */
  async callGeminiAPI(
    userMessage: string,
    history: ChatMessage[],
    systemPrompt: string
  ): Promise<string> {
    const ai = getAiClient();

    console.log('DATE CONTEXT:', getAIDateTimeContext());

    // Use generateContent (single turn) which is more stable with the current SDK.
    // We construct the full conversation history manually.
    
    let fullPrompt = systemPrompt + "\n\n**Conversation History:**\n";
    
    // Add history (limit to last 10 turns to save context)
    // Note: 'history' here contains previous messages, not including the current user message
    const recentHistory = history.slice(-10);
    recentHistory.forEach(msg => {
        const role = msg.role === 'user' ? 'User' : 'JetBot';
        fullPrompt += `${role}: ${msg.content}\n`;
    });

    // Add the current user message
    fullPrompt += `\nUser: ${userMessage}\nJetBot:`;

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json" 
        }
    });

    // Handle potential null/undefined response.text
    return response.text ? response.text.trim() : '{}';
  },

  /**
   * Parse Gemini response and extract structured data
   */
  parseGeminiResponse(
    response: string,
    kbArticles: KnowledgeBaseArticle[]
  ): ChatbotResponse {
    try {
      // Clean up markdown code blocks if present
      const cleanJson = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      return {
        message: parsed.message || "I'm not sure how to respond to that.",
        confidence: parsed.confidence || 0.7,
        suggested_actions: parsed.suggested_actions || [],
        should_escalate: parsed.should_escalate || false,
        escalation_reason: parsed.escalation_reason,
        knowledge_base_articles: kbArticles.slice(0, 2) // Attach relevant articles found earlier
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      
      // Fallback: treat entire response as message if JSON parsing fails
      return {
        message: response,
        confidence: 0.5,
        suggested_actions: [],
        should_escalate: false,
        knowledge_base_articles: kbArticles
      };
    }
  },

  /**
   * Create a support ticket from chatbot conversation
   */
  async escalateToTicket(
    conversationHistory: ChatMessage[],
    category: string = 'general',
    context?: ChatbotContext
  ): Promise<string | null> {
    try {
      // Generate ticket subject from conversation
      const subject = this.generateTicketSubject(conversationHistory);
      
      // Generate ticket description
      const description = this.generateTicketDescription(conversationHistory);
      
      // Create ticket request
      const ticketRequest: CreateTicketRequest = {
        subject,
        category: category as any,
        priority: 'medium',
        description,
        business_name: context?.business_name,
        source: 'chatbot'
      };
      
      const result = await supportService.createTicket(ticketRequest);
      
      if (result.success && result.data) {
        return result.data.id;
      }
      
      return null;
    } catch (error) {
      console.error('Error escalating to ticket:', error);
      return null;
    }
  },

  /**
   * Generate a subject line from conversation
   */
  generateTicketSubject(history: ChatMessage[]): string {
    // Use first user message or a default
    const firstUserMessage = history.find(msg => msg.role === 'user');
    
    if (firstUserMessage) {
      // Truncate to reasonable length
      const subject = firstUserMessage.content.substring(0, 100);
      return subject.length < firstUserMessage.content.length 
        ? subject + '...' 
        : subject;
    }
    
    return 'Support Request from Chatbot';
  },

  /**
   * Generate ticket description from conversation
   */
  generateTicketDescription(history: ChatMessage[]): string {
    let description = '**Conversation History from AI Chatbot:**\n\n';
    
    history.forEach((msg, index) => {
      const role = msg.role === 'user' ? 'User' : 'JetBot';
      description += `**${role}:** ${msg.content}\n\n`;
    });
    
    description += '---\n*This ticket was automatically created when the chatbot determined human support was needed.*';
    
    return description;
  },

  /**
   * Get quick reply suggestions based on context
   */
  getQuickReplies(context?: ChatbotContext): string[] {
    const defaultReplies = [
      'How do I set up my business profile?',
      'What is JetBiz?',
      'How does billing work?',
      'I need help with my account'
    ];
    
    // Customize based on context
    if (context?.current_page) {
      if (context.current_page.includes('jetbiz')) {
        return [
          'How do I improve my Google ranking?',
          'What is a GBP audit?',
          ...defaultReplies.slice(2)
        ];
      }
      if (context.current_page.includes('jetviz')) {
        return [
          'How do I improve my website speed?',
          'What are the PageSpeed scores?',
          ...defaultReplies.slice(2)
        ];
      }
    }
    
    return defaultReplies;
  }
};

export default chatbotService;